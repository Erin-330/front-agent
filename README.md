# front-agent

Claude CLI 기반으로 GitHub 레포의 프론트엔드 코드를 자동으로 수정하고 PR을 생성하는 MCP 서버.

웹(`mcp-agents-web`)과 익스텐션(`mcp-agents-extension`) 두 개의 ECS 서비스로 운영되며, 코드베이스는 `mcp-servers/front/`를 공유합니다.

---

## 전체 프로세스

### 1단계 — 최초 인증 세팅

```
컨테이너 접속 (ecs-login.sh)
  │
  │  $ claude /login  →  claude.ai 계정으로 OAuth 로그인 (Team 플랜)
  │  → /home/node/.claude/.credentials.json 자동 생성
  │
  │  $ ./ecs-backup-auth.sh
  ▼
AWS SSM Parameter Store
  └─ /mcp-agents-front/claude-credentials = { "token": "세션토큰..." }
```

> 로컬 Mac은 인증 정보를 Keychain에 저장하기 때문에 파일로 꺼낼 수 없습니다.
> 컨테이너(Linux)에서 로그인하면 `/home/node/.claude/.credentials.json` 파일로 저장되므로
> SSM에 올릴 수 있습니다.

---

### 2단계 — ECS 컨테이너 시작 (배포 시마다 자동)

```
ECS 컨테이너 부팅
  │
  │  entrypoint.sh 실행
  │  AWS SSM에서 credentials 꺼내옴
  └─ /home/node/.claude/.credentials.json 파일로 저장
  │
  │  credentials 변경 감지 시 SSM 자동 동기화 (inotifywait)
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
  │  Claude(대화)가 mcp__web__implement_and_pr 또는
  │             mcp__extension__implement_and_pr 툴 호출
  │  HTTP POST → 5004포트 MCP 서버
  ▼

index.js 실행:
  ├─ /tmp/front-agent-xxx/ 임시 폴더 생성
  ├─ gh repo clone 레포  (github_token으로 인증)
  ├─ git checkout -b agent/브랜치명
  │
  ├─ spawn("claude -p", "배경색 노란색으로 바꿔줘")
  │     │
  │     │  /home/node/.claude/.credentials.json 읽음  ← Team 플랜 세션
  │     │  Anthropic 서버에 세션 토큰으로 요청
  │     │
  │     │  Claude CLI가 tmpDir 안에서:
  │     │    Read  → App.tsx 읽음
  │     │    Edit  → bg-red-500 → bg-yellow-400 수정
  │     │  완료 후 프로세스 종료
  │     ▼
  │
  ├─ git add -A && git commit && git push  (github_token으로 인증)
  ├─ GitHub API로 PR 생성  (github_token으로 인증)
  └─ /tmp/front-agent-xxx/ 삭제

PR URL 반환 → Claude(대화)가 사용자에게 출력
```

---

## 인증

| | Claude CLI 인증 | GitHub 인증 |
|---|---|---|
| **무엇** | claude.ai 세션 토큰 | GitHub Personal Access Token |
| **어디서** | SSM → `.credentials.json` | 호출 시 `github_token` 파라미터 또는 `.env`의 `GH_TOKEN` |
| **왜 가능** | Team 플랜 구독 중 | 레포 접근 권한 있는 토큰 |
| **용도** | Anthropic 서버에 AI 요청 | clone, push, PR 생성 |

---

## 인증 갱신 방법 (토큰 만료 시)

```bash
# 1. 컨테이너 접속 (web 또는 extension 서비스 선택)
./mcp-servers/front/ecs-login.sh

# 2. 컨테이너 안에서 재로그인
claude /login

# 3. SSM에 자동 동기화됨 (inotifywait가 감지하여 자동 업로드)
#    또는 수동으로:
./ecs-backup-auth.sh

# 4. 컨테이너 나가기
exit
```

---

## 배포

```bash
# 웹 서비스 배포
./mcp-servers/web/deploy.sh

# 익스텐션 서비스 배포
./mcp-servers/extension/deploy.sh
```

두 스크립트 모두 `mcp-servers/front/`의 Dockerfile로 이미지를 빌드해 ECR에 푸시한 뒤, 각 ECS 서비스를 업데이트합니다.

---

## 로컬 실행 (개발용)

```bash
cd mcp-servers/front
docker compose up
# → localhost:5004 에서 MCP 서버 실행
```

---

## 파일 구조

```
front-agent/
├── CLAUDE.md
├── README.md
├── mcp-servers/
│   ├── package.json
│   ├── front/                    # 핵심 MCP 서버 (web/extension 공통 코드베이스)
│   │   ├── index.js              # MCP 서버 진입점, implement_and_pr 툴 정의
│   │   ├── agent.js              # claude CLI spawn, 출력 파싱
│   │   ├── Dockerfile            # node:20 + claude CLI 설치
│   │   ├── docker-compose.yml    # 로컬 개발용
│   │   ├── entrypoint.sh         # SSM에서 Claude 인증 복원 + 자동 동기화
│   │   ├── ecs-login.sh          # 로컬에서 ECS 컨테이너 접속
│   │   ├── ecs-backup-auth.sh    # 인증 파일 → SSM 수동 저장
│   │   ├── setup-env.sh          # 환경 변수 초기 세팅
│   │   ├── install-gh.sh         # gh CLI 설치
│   │   └── .env                  # GH_TOKEN, GITHUB_REPO_URL
│   ├── web/                      # 웹 서비스 배포
│   │   ├── deploy.sh             # ECS mcp-agents-web 서비스 배포
│   │   └── .env                  # 웹 레포 환경 변수
│   └── extension/                # 익스텐션 서비스 배포
│       ├── deploy.sh             # ECS mcp-agents-extension 서비스 배포
│       └── .env                  # 익스텐션 레포 환경 변수
└── scripts/
    └── install-gh.sh             # gh CLI 설치 스크립트
```

---

## MCP 툴

| 툴 | 서비스 | 설명 |
|---|---|---|
| `mcp__web__implement_and_pr` | mcp-agents-web | 웹 레포 코드 수정 + PR 생성 |
| `mcp__extension__implement_and_pr` | mcp-agents-extension | 익스텐션 레포 코드 수정 + PR 생성 |

### 파라미터

| 파라미터 | 필수 | 설명 |
|---|---|---|
| `prompt` | 필수 | 구현할 기능 또는 수정 사항 설명 |
| `github_token` | 선택 | `gh auth token`으로 획득한 PAT. 미전달 시 서버 환경변수 `GH_TOKEN` 사용 |

---

## 환경 변수 (`.env`)

```
GH_TOKEN=...            # GitHub Personal Access Token (repo 권한)
GITHUB_REPO_URL=...     # 대상 레포 URL
```
