import "dotenv/config";
import express from "express";
import cookieSession from "cookie-session";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { createInterface } from "readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set("trust proxy", 1);
app.use(express.json());
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.SESSION_SECRET || "dev-secret-change-me"],
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  })
);
app.use(express.static(path.join(__dirname, "public")));

function requireAuth(req, res, next) {
  if (!req.session.token) return res.status(401).json({ error: "Not authenticated" });
  next();
}

// ── GitHub OAuth ──────────────────────────────────────────────────
app.get("/auth/github", (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.status(500).send("GITHUB_CLIENT_ID가 설정되지 않았습니다.");
  }
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: "read:user repo",
    redirect_uri: process.env.REDIRECT_URI || `http://localhost:${process.env.PORT || 3000}/auth/github/callback`,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

app.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const { access_token, error, error_description } = await tokenRes.json();
    if (error) throw new Error(error_description || error);

    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}`, "User-Agent": "mcp-orchestrator" },
    });
    const user = await userRes.json();

    req.session.token = access_token;
    req.session.user = { login: user.login, name: user.name || user.login, avatar_url: user.avatar_url };
    res.redirect("/dashboard.html");
  } catch (err) {
    res.redirect(`/?error=${encodeURIComponent(err.message)}`);
  }
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.session.user, token: req.session.token });
});

app.post("/auth/logout", (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

// ── MCP Config ────────────────────────────────────────────────────
async function loadMcpConfig() {
  const raw = await fs.readFile(path.join(__dirname, "../.mcp.json"), "utf-8");
  return JSON.parse(raw);
}

// ── Stdio MCP Client ──────────────────────────────────────────────
function createStdioClient(command, args, env) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });

  let idSeq = 1;
  const pending = new Map();

  const rl = createInterface({ input: child.stdout });
  rl.on("line", (line) => {
    try {
      const msg = JSON.parse(line.trim());
      if (msg.id != null && pending.has(msg.id)) {
        const { resolve } = pending.get(msg.id);
        pending.delete(msg.id);
        resolve(msg);
      }
    } catch {}
  });

  const send = (method, params) =>
    new Promise((resolve, reject) => {
      const id = idSeq++;
      pending.set(id, { resolve, reject });
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`timeout: ${method}`));
        }
      }, 30000);
    });

  const notify = (method, params) =>
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");

  const close = () => child.kill();

  return { send, notify, close };
}

async function initStdioClient(command, args, env) {
  const client = createStdioClient(command, args, env);
  await client.send("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "mcp-orchestrator-ui", version: "1.0.0" },
  });
  client.notify("notifications/initialized", {});
  return client;
}

// command 서버 env에 OAuth 토큰 주입
function resolveEnv(configEnv, oauthToken) {
  const resolved = { ...configEnv };
  if ("GITHUB_PERSONAL_ACCESS_TOKEN" in resolved) {
    resolved.GITHUB_PERSONAL_ACCESS_TOKEN = oauthToken;
  }
  return resolved;
}

// ── HTTP MCP Client ───────────────────────────────────────────────
async function callHttpTool(mcpUrl, headers, toolName, toolArgs, onEvent) {
  const initRes = await fetch(mcpUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "mcp-orchestrator-ui", version: "1.0.0" } },
    }),
  });
  const sessionId = initRes.headers.get("mcp-session-id");
  const sessionHeader = sessionId ? { "mcp-session-id": sessionId } : {};

  const callRes = await fetch(mcpUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers, ...sessionHeader },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: toolName, arguments: toolArgs } }),
  });

  const ct = callRes.headers.get("content-type") || "";
  if (ct.includes("text/event-stream")) {
    const reader = callRes.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try { onEvent(JSON.parse(line.slice(6))); } catch {}
        }
      }
    }
  } else {
    onEvent(await callRes.json());
  }
}

// ── MCP Servers 목록 ──────────────────────────────────────────────
app.get("/debug/health", async (req, res) => {
  const { mcpServers } = await loadMcpConfig();
  const results = [];
  for (const [name, config] of Object.entries(mcpServers)) {
    if (config.type !== "http") continue;
    const healthUrl = config.url.replace(/\/mcp$/, "/health");
    try {
      const r = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
      results.push({ name, healthUrl, status: r.status, data: await r.json() });
    } catch (err) {
      results.push({ name, healthUrl, error: err.message });
    }
  }
  res.json(results);
});

app.get("/api/mcp-servers", requireAuth, async (req, res) => {
  const { mcpServers } = await loadMcpConfig();

  const results = await Promise.all(
    Object.entries(mcpServers).map(async ([name, config]) => {
      if (config.type === "http") {
        const healthUrl = config.url.replace(/\/mcp$/, "/health");
        try {
          const r = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
          return { name, type: "http", url: config.url, status: "connected", health: await r.json() };
        } catch (err) {
          return { name, type: "http", url: config.url, status: "disconnected", error: err.message };
        }
      }
      // command 타입 - OAuth 토큰 있으면 사용 가능
      return {
        name,
        type: "command",
        status: req.session.token ? "connected" : "local",
        note: req.session.token ? "OAuth 토큰으로 연결됨" : "로그인 필요",
      };
    })
  );

  res.json(results);
});

// ── Tools 목록 ────────────────────────────────────────────────────
app.get("/api/tools/:server", requireAuth, async (req, res) => {
  const { mcpServers } = await loadMcpConfig();
  const config = mcpServers[req.params.server];
  if (!config) return res.status(404).json({ error: "서버를 찾을 수 없습니다." });

  try {
    if (config.type === "http") {
      const initRes = await fetch(config.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...config.headers },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "mcp-orchestrator-ui", version: "1.0.0" } } }),
      });
      const sessionId = initRes.headers.get("mcp-session-id");
      const toolsRes = await fetch(config.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(sessionId ? { "mcp-session-id": sessionId } : {}), ...config.headers },
        body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
      });
      const data = await toolsRes.json();
      res.json(data.result?.tools || []);
    } else if (config.command) {
      const env = resolveEnv(config.env || {}, req.session.token);
      const client = await initStdioClient(config.command, config.args || [], env);
      const result = await client.send("tools/list", {});
      client.close();
      res.json(result.result?.tools || []);
    } else {
      res.status(400).json({ error: "지원하지 않는 서버 타입입니다." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Tool 직접 호출 (github 등 command 서버용) ──────────────────────
app.post("/api/call/:server", requireAuth, async (req, res) => {
  const { tool, args } = req.body;
  if (!tool) return res.status(400).json({ error: "tool이 필요합니다." });

  const { mcpServers } = await loadMcpConfig();
  const config = mcpServers[req.params.server];
  if (!config) return res.status(404).json({ error: "서버를 찾을 수 없습니다." });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    if (config.command) {
      const env = resolveEnv(config.env || {}, req.session.token);
      send({ type: "status", message: `🚀 ${req.params.server} 서버 스폰 중...` });
      const client = await initStdioClient(config.command, config.args || [], env);
      send({ type: "status", message: `🔧 ${tool} 호출 중...` });
      const result = await client.send("tools/call", { name: tool, arguments: args || {} });
      client.close();
      send({ type: "result", data: result.result });
      send({ type: "done" });
    } else if (config.type === "http") {
      send({ type: "status", message: `🚀 요청 시작...` });
      await callHttpTool(config.url, config.headers || {}, tool, args || {}, (event) => send({ type: "event", data: event }));
      send({ type: "done" });
    }
  } catch (err) {
    send({ type: "error", message: err.message });
  }

  res.write(`data: ${JSON.stringify({ type: "complete" })}\n\n`);
  res.end();
});

// ── PR 정보 파싱 ──────────────────────────────────────────────────
function parsePrDetails(text) {
  const repo = text.match(/- repo:\s*([^\n]+)/)?.[1]?.trim();
  const head = text.match(/- head:\s*([^\n]+)/)?.[1]?.trim();
  const base = text.match(/- base:\s*([^\n]+)/)?.[1]?.trim() || "develop";
  const title = text.match(/- title:\s*([^\n]+)/)?.[1]?.trim();
  const bodyMatch = text.match(/- body:\s*([\s\S]+?)(?:\n---\n|\n\*🤖|$)/);
  const body = bodyMatch?.[1]?.trim();

  if (!repo || !head) return null;
  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) return null;
  return { owner, repo: repoName, head, base, title, body };
}

// 결과 텍스트에서 content 추출
function extractResultText(event) {
  if (event?.result?.content) {
    return event.result.content.filter(c => c.type === "text").map(c => c.text).join("\n");
  }
  if (event?.params?.data) return String(event.params.data); // notification
  return "";
}

// ── Prompt → implement_and_pr + 자동 PR 생성 ──────────────────────
app.post("/api/prompt", requireAuth, async (req, res) => {
  const { servers, prompt } = req.body;
  if (!servers?.length || !prompt) return res.status(400).json({ error: "servers와 prompt가 필요합니다." });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const { mcpServers } = await loadMcpConfig();
  const githubConfig = mcpServers["github"];

  await Promise.all(
    servers.map(async (serverName) => {
      const config = mcpServers[serverName];
      if (!config || config.type !== "http") {
        send({ server: serverName, type: "error", message: "implement_and_pr은 HTTP 서버에서만 사용 가능합니다." });
        return;
      }
      send({ server: serverName, type: "status", message: "🚀 요청 시작..." });

      let collectedText = "";
      try {
        await callHttpTool(config.url, config.headers || {}, "implement_and_pr", { prompt }, (event) => {
          send({ server: serverName, type: "event", data: event });
          collectedText += extractResultText(event);
        });
        send({ server: serverName, type: "done" });
      } catch (err) {
        send({ server: serverName, type: "error", message: err.message });
        return;
      }

      // PR 정보 파싱 후 GitHub MCP로 자동 생성
      const pr = parsePrDetails(collectedText);
      if (!pr || !githubConfig) return;

      send({ server: "github", type: "status", message: `🔗 PR 자동 생성 중 (${pr.owner}/${pr.repo} ← ${pr.head})...` });
      try {
        const env = resolveEnv(githubConfig.env || {}, req.session.token);
        const client = await initStdioClient(githubConfig.command, githubConfig.args || [], env);
        const result = await client.send("tools/call", {
          name: "create_pull_request",
          arguments: { owner: pr.owner, repo: pr.repo, title: pr.title || prompt.slice(0, 72), head: pr.head, base: pr.base, body: pr.body || "" },
        });
        client.close();

        // 에러 처리
        if (result.error) {
          send({ server: "github", type: "error", message: `create_pull_request 실패: ${result.error.message || JSON.stringify(result.error)}` });
          return;
        }

        // PR URL 추출 (JSON 파싱 또는 정규식)
        const rawText = result.result?.content?.[0]?.text || "";
        let prUrl = null;
        try {
          const parsed = JSON.parse(rawText);
          prUrl = parsed.html_url || parsed.url;
        } catch {
          const match = rawText.match(/https:\/\/github\.com\/[^\s"]+\/pull\/\d+/);
          prUrl = match?.[0];
        }

        if (prUrl) {
          send({ server: "github", type: "pr_url", url: prUrl });
        } else if (rawText) {
          send({ server: "github", type: "event", data: { result: { content: [{ type: "text", text: rawText }] } } });
        }
        send({ server: "github", type: "done" });
      } catch (err) {
        send({ server: "github", type: "error", message: `PR 생성 실패: ${err.message}` });
      }
    })
  );

  res.write(`data: ${JSON.stringify({ type: "complete" })}\n\n`);
  res.end();
});

export default app;

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`\n🚀 MCP Orchestrator UI: http://localhost:${PORT}\n`));
}
