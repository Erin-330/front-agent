# front-agent

Claude CLI 기반으로 GitHub 레포의 프론트엔드 코드를 자동으로 수정하고 PR을 생성하는 MCP 서버.

---

## 전체 프로세스

### 1단계 — 최초 인증 세팅

```
컨테이너 접속 (ecs-login.sh)
  │
  │  $ claude /login  →  claude.ai 계정으로 OAuth 로그인 (Team 플랜)
  │  → /root/.claude/.credentials.json 자동 생성
  │
  │  $ ./ecs-backup-auth.sh
  ▼
AWS SSM Parameter Store
  └─ /mcp-agents-front/claude-credentials = { "token": "세션토큰..." }
```

> 로컬 Mac은 인증 정보를 Keychain에 저장하기 때문에 파일로 꺼낼 수 없습니다.
> 컨테이너(Linux)에서 로그인하면 `/root/.claude/.credentials.json` 파일로 저장되므로
> SSM에 올릴 수 있습니다.

---

### 2단계 — ECS 컨테이너 시작 (배포 시마다 자동)

```
ECS 컨테이너 부팅
  │
  │  entrypoint.sh 실행
  │  AWS SSM에서 credentials 꺼내옴
  └─ /root/.claude/.credentials.json 파일로 저장
  │
  │  node index.js 실행
  ▼
MCP 서버 5004 포트 대기 중...
```

---

### 3단계 — 실제 요청 처리

```
사용자가 Claude 대화에서 "배경색 노란색으로 바꿔줘"
  │
  │  Claude(대화)가 mcp__front-test__run 툴 호출
  │  HTTP POST → 5004포트 MCP 서버
  ▼

index.js 실행:
  ├─ /tmp/front-agent-xxx/ 임시 폴더 생성
  ├─ git clone front-test 레포  (GITHUB_TOKEN으로 인증)
  ├─ git checkout -b agent/브랜치명
  │
  ├─ spawn("claude -p", "배경색 노란색으로 바꿔줘")
  │     │
  │     │  /root/.claude/.credentials.json 읽음  ← Team 플랜 세션
  │     │  Anthropic 서버에 세션 토큰으로 요청
  │     │
  │     │  Claude CLI가 tmpDir 안에서:
  │     │    Read  → App.tsx 읽음
  │     │    Edit  → bg-red-500 → bg-yellow-400 수정
  │     │  완료 후 프로세스 종료
  │     ▼
  │
  ├─ git add -A && git commit && git push  (GITHUB_TOKEN으로 인증)
  ├─ GitHub API로 PR 생성  (GITHUB_TOKEN으로 인증)
  └─ /tmp/front-agent-xxx/ 삭제

PR URL 반환 → Claude(대화)가 사용자에게 출력
```

---

## 인증

| | Claude CLI 인증 | GitHub 인증 |
|---|---|---|
| **무엇** | claude.ai 세션 토큰 | GitHub Personal Access Token |
| **어디서** | SSM → `.credentials.json` | `.env` 파일 |
| **왜 가능** | Team 플랜 구독 중 | 레포 접근 권한 있는 토큰 |
| **용도** | Anthropic 서버에 AI 요청 | clone, push, PR 생성 |

---

## 인증 갱신 방법 (토큰 만료 시)

```bash
# 1. 컨테이너 접속
./mcp-servers/front/ecs-login.sh

# 2. 컨테이너 안에서 재로그인
claude /login

# 3. 컨테이너 안에서 SSM에 저장
./ecs-backup-auth.sh

# 4. 컨테이너 나가기
exit

# 5. ECS 태스크 재시작 → entrypoint.sh가 SSM에서 새 인증 파일 복원
```

---

## 파일 구조

```
mcp-servers/front/
├── index.js           # MCP 서버 진입점, 툴 정의, git/PR 로직
├── agent.js           # claude CLI spawn, 출력 파싱
├── Dockerfile         # node:20 + claude CLI 설치
├── entrypoint.sh      # SSM에서 Claude 인증 파일 복원 후 서버 실행
├── ecs-login.sh       # 로컬에서 ECS 컨테이너 접속
├── ecs-backup-auth.sh # 컨테이너 안에서 인증 파일 → SSM 저장
└── .env               # GITHUB_TOKEN, GITHUB_REPO_URL
```

---

## MCP 툴

| 툴 | 설명 |
|---|---|
| `run` | 프롬프트를 받아 코드 수정 + PR 생성 |

---

## 환경 변수 (`.env`)

```
GITHUB_TOKEN=...        # GitHub Personal Access Token (repo 권한)
GITHUB_REPO_URL=...     # 대상 레포 URL
```