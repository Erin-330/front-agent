import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { runCodingAgent, parseSummary } from "./agent.js";

const execAsync = promisify(exec);
const app = express();
app.use(express.json());

function parseRepoUrl(url) {
  const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (!match) throw new Error(`Cannot parse GitHub repo URL: ${url}`);
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

function slugify(text) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  return slug || Math.random().toString(36).slice(2, 8);
}

function extractTitle(summary) {
  for (const line of summary.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const clean = line.replace(/^[#*\->]+\s*/, "").replace(/\*\*/g, "").replace(/`/g, "");
    if (clean.length > 5) return clean.slice(0, 72);
  }
  return summary.slice(0, 72);
}

async function hasChanges(workDir) {
  const { stdout } = await execAsync("git status --porcelain", { cwd: workDir });
  return stdout.trim().length > 0;
}

function createServer() {
  const server = new McpServer({ name: "front", version: "1.0.0" });

  server.tool(
    "implement_and_pr",
    "프롬프트를 받아 GitHub 저장소 코드를 자동으로 수정하고 PR을 생성합니다",
    {
      prompt: z.string().describe("구현할 기능 또는 수정 사항 설명"),
    },
    async ({ prompt }, extra) => {
      const sendLog = async (msg) => {
        process.stderr.write(`[front-agent] ${msg}\n`);
        try {
          await extra.sendNotification({
            method: "notifications/message",
            params: { level: "info", logger: "front-agent", data: msg },
          });
        } catch {}
      };

      const repo_url = process.env.GITHUB_REPO_URL;
      const base_branch = "develop";
      if (!repo_url) return { content: [{ type: "text", text: "Error: GITHUB_REPO_URL이 설정되지 않았습니다." }] };

      // gh CLI 설치 여부 확인
      try {
        await execAsync("gh --version");
      } catch {
        return {
          content: [{
            type: "text",
            text: "Error: gh CLI가 설치되어 있지 않습니다.\n\n설치 방법:\n  macOS:  brew install gh\n  Linux:  https://github.com/cli/cli/blob/trunk/docs/install_linux.md\n\n설치 후 'gh auth login'으로 인증하세요.",
          }],
        };
      }

      const { owner, repo } = parseRepoUrl(repo_url);

      const now = new Date();
      const datePart = now.toISOString().slice(0, 16).replace(/[-T:]/g, "").slice(0, 12);
      const branchName = `agent/${datePart}-${slugify(prompt)}`;

      // Check if this branch (and PR) already exists — handles ALB-timeout retries
      try {
        const { stdout: existingPrJson } = await execAsync(
          `gh pr list --repo ${owner}/${repo} --head ${branchName} --state open --json url,number`
        );
        const existingPrs = JSON.parse(existingPrJson || "[]");
        if (existingPrs.length > 0) {
          const pr = existingPrs[0];
          await sendLog(`♻️ 이미 생성된 PR 발견: ${pr.url}`);
          return {
            content: [{
              type: "text",
              text: `♻️ 이미 생성된 PR이 있습니다 (중복 방지).\n\nURL: ${pr.url}\n브랜치: ${branchName}`,
            }],
          };
        }
      } catch { /* PR 없으면 계속 진행 */ }

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "front-agent-"));

      // Heartbeat: send a ping every 30s to keep ALB connection alive
      const heartbeat = setInterval(async () => {
        await sendLog("⏳ 작업 진행 중...");
      }, 30_000);

      try {
        // 1. Clone
        await sendLog(`📦 저장소 클론 중... (${owner}/${repo}@${base_branch})`);
        await execAsync(`gh repo clone ${owner}/${repo} . -- --depth=1 --branch ${base_branch}`, {
          cwd: tmpDir,
        });

        // Configure git identity for commits
        await execAsync('git config user.email "agent@rorr.club"', { cwd: tmpDir });
        await execAsync('git config user.name "front-agent"', { cwd: tmpDir });

        // 2. Create new branch
        await sendLog(`🌿 브랜치 생성: ${branchName}`);
        await execAsync(`git checkout -b ${branchName}`, { cwd: tmpDir });

        // 3. Run Claude coding agent
        await sendLog(`🤖 Claude 에이전트 실행 중... (프롬프트: "${prompt.slice(0, 60)}")`);
        const raw = await runCodingAgent(prompt, tmpDir, sendLog);
        const { title: agentTitle, summary } = parseSummary(raw);
        await sendLog("✅ Claude 에이전트 완료");

        // 4. Check if anything changed
        if (!(await hasChanges(tmpDir))) {
          return {
            content: [{
              type: "text",
              text: `에이전트가 실행됐지만 변경된 파일이 없습니다.\n\n${summary}`,
            }],
          };
        }

        // 5. Commit & push
        await sendLog("💾 변경사항 커밋 & 푸시 중...");
        await execAsync("git add -A", { cwd: tmpDir });
        await execAsync(
          `git commit -m "feat: ${prompt.slice(0, 60).replace(/"/g, "'")}\n\nGenerated by front-agent"`,
          { cwd: tmpDir }
        );
        await execAsync(`git push origin ${branchName}`, { cwd: tmpDir });

        // 6. Create PR via gh CLI
        await sendLog("🔗 PR 생성 중...");
        const prTitle = agentTitle || extractTitle(summary);
        const prBody = `## Summary\n\n${summary}\n\n---\n*🤖 Generated by front-agent*`;

        let prUrl;
        try {
          const { stdout } = await execAsync(
            `gh pr create --repo ${owner}/${repo} --title ${JSON.stringify(prTitle)} --body ${JSON.stringify(prBody)} --head ${branchName} --base ${base_branch}`,
            { cwd: tmpDir }
          );
          prUrl = stdout.trim();
        } catch (err) {
          // 이미 PR이 존재하는 경우
          if (err.message.includes("already exists")) {
            const { stdout: existingJson } = await execAsync(
              `gh pr list --repo ${owner}/${repo} --head ${branchName} --state open --json url`
            );
            prUrl = JSON.parse(existingJson)[0]?.url;
            await sendLog(`♻️ 이미 존재하는 PR 반환: ${prUrl}`);
            return {
              content: [{
                type: "text",
                text: `♻️ PR이 이미 존재합니다 (중복 방지).\n\nURL: ${prUrl}\n브랜치: ${branchName}\n\n## 변경 내용\n${summary}`,
              }],
            };
          }
          throw err;
        }

        await sendLog(`🎉 PR 생성 완료! ${prUrl}`);
        return {
          content: [{
            type: "text",
            text: `✅ PR 생성 완료!\n\nURL: ${prUrl}\n브랜치: ${branchName}\n\n## 변경 내용\n${summary}`,
          }],
        };
      } finally {
        clearInterval(heartbeat);
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    }
  );

  return server;
}

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = createServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
  await server.close();
});

app.get("/health", (_, res) => res.json({ status: "ok", server: "front" }));

app.listen(5004, () => process.stdout.write("front MCP server running on :5004\n"));
