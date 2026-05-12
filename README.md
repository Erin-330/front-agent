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
  │  inotifywait로 .credentials.json 변경 감지 → SSM 자동 동기화 (백그라운드)
  │
  │  node index.js 실행
  ▼
MCP 서버 5004 포트 대기 중...
```

---

### 3단계 — 실제 요청 처리 (비동기 Job 방식)

```
사용자가 Claude 대화에서 "배경색 노란색으로 바꿔줘"
  │
  │  Claude(대화)가 mcp__front-test__run 툴 호출
  │  HTTP POST → 5004포트 MCP 서버
  ▼

index.js: run 툴 실행
  ├─ job_id 생성 후 즉시 반환 (비동기)
  │     └─ 동일 프롬프트 이미 실행 중이면 기존 job_id 반환 (중복 방지)
  │
  └─ 백그라운드에서 executeJob() 실행:
       ├─ /tmp/front-agent-xxx/ 임시 폴더 생성
       ├─ git clone front-test 레포 (develop 브랜치, GITHUB_TOKEN으로 인증)
       ├─ git checkout -b agent/브랜치명
       │
       ├─ spawn("claude -p", "배경색 노란색으로 바꿔줘")
       │     │  허용 툴: Edit, Read, Write, Bash, Glob, Grep
       │     │  /root/.claude/.credentials.json 읽음 ← Team 플랜 세션
       │     │  Claude CLI가 tmpDir 안에서 코드 수정
       │     ▼
       │
       ├─ 변경사항이 없으면 → job 완료 (PR 미생성)
       │
       ├─ git add -A && git commit && git push (GITHUB_TOKEN으로 인증)
       ├─ GitHub API로 PR 생성 (base: develop)
       └─ /tmp/front-agent-xxx/ 삭제

Claude(대화)가 status 툴로 job_id 조회 → PR URL 반환
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

> entrypoint.sh는 `.credentials.json` 파일 변경을 inotifywait로 감지해 SSM에 자동 동기화합니다.

---

## 파일 구조

```
mcp-servers/front/
├── index.js           # MCP 서버 진입점, 툴 정의, 비동기 Job 관리, git/PR 로직
├── agent.js           # claude CLI spawn, PR 제목 파싱
├── Dockerfile         # node:20-slim + awscli + inotify-tools + claude CLI 설치
├── entrypoint.sh      # SSM에서 Claude 인증 파일 복원, credentials 자동 동기화, 서버 실행
├── ecs-login.sh       # 로컬에서 ECS 컨테이너 접속
├── ecs-backup-auth.sh # 컨테이너 안에서 인증 파일 → SSM 저장
├── setup-env.sh       # 환경 변수 설정 보조 스크립트
├── deploy.sh          # 배포 스크립트
├── docker-compose.yml # 로컬 실행용
├── eslint.config.js   # ESLint 설정
├── package.json       # 의존성 정의
└── .env               # GITHUB_TOKEN, GITHUB_REPO_URL
```

---

## MCP 툴

| 툴 | 설명 |
|---|---|
| `run` | 프롬프트를 받아 코드 수정 + PR 생성을 비동기로 시작하고 `job_id` 즉시 반환 |
| `status` | `job_id`로 작업 진행 상황 및 결과(PR URL) 확인 |

### 사용 흐름

```
1. run(prompt) → job_id 반환
2. status(job_id) → 진행 중이면 최근 로그 반환, 완료되면 PR URL 반환
```

---

## REST 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| `POST` | `/mcp` | MCP StreamableHTTP 엔드포인트 |
| `GET` | `/health` | 헬스체크 (`{ status: "ok" }`) |
| `GET` | `/jobs/:id` | Job 상세 정보 조회 (status, logs, result, error) |

---

## 환경 변수 (`.env`)

```
GITHUB_TOKEN=...        # GitHub Personal Access Token (repo 권한)
GITHUB_REPO_URL=...     # 대상 레포 URL (예: https://github.com/org/front-test)
```

---

## MCP 서버 연결 설정 (`.mcp.json`)

```json
{
  "mcpServers": {
    "front-test": {
      "type": "http",
      "url": "http://localhost:5004/mcp",
      "timeout": 600000
    },
    "front": {
      "type": "http",
      "url": "http://<ALB_HOST>:5004/mcp",
      "timeout": 600000
    }
  }
}
```

- `front-test`: 로컬 개발용 (localhost)
- `front`: 스테이징/프로덕션용 (AWS ALB)
