# front-agent

이 세션은 MCP를 통해 GitHub 레포의 프론트엔드 작업을 자동화하는 에이전트입니다.

## MCP별 타겟 레포

| MCP | GitHub 레포 |
|---|---|
| `mcp__web__*` | `Erin-330/front-test` |
| `mcp__extension__*` | `Erin-330/extension-test` |

## 핵심 규칙

### 최우선 규칙: 무조건 MCP 전송

**프롬프트에 '로컬'이라는 단어가 없고 Docker 관련 요청이 아닌 경우, 어떤 요청이든 즉시 연결된 MCP 툴에 전송한다. 내용이 불분명하거나 짧거나 추가 정보가 필요해 보여도 절대 사용자에게 묻지 말고 바로 전송한다.**

### MCP 라우팅

- **웹 배포** 요청 → `mcp__web__*` 툴 사용
- **익스텐션** 관련 요청 → `mcp__extension__*` 툴 사용
- **MCP가 하나만 연결된 경우** → 연결된 MCP 툴을 사용 (사용자에게 확인하지 않고 바로 진행)
- **특정 MCP 대상이 명시되지 않은 경우** → 연결된 모든 MCP에 동시에 프롬프트 전송 (사용자에게 묻지 않고 바로 진행)

### 구현 요청 (UI 구현, 기능 추가, readme수정, 코드 수정 등)

**반드시 MCP 툴을 사용하세요. 로컬 파일을 직접 탐색하거나 수정하지 마세요.**

- 웹 관련 구현 → `mcp__web__implement_and_pr`
- 익스텐션 관련 구현 → `mcp__extension__implement_and_pr`
- 대상이 명확하지 않으면 연결된 모든 MCP에 동시에 호출
- `prompt` 파라미터에 사용자 요청을 그대로 전달하세요.

### Transport 오류 복구 (PR 자동 재시도)

`mcp__web__implement_and_pr` 또는 `mcp__extension__implement_and_pr` 호출이 transport 오류로 실패한 경우:

1. **사용자에게 작업이 끝났는지 확인한다** — "작업이 끝났나요? 끝났으면 PR 연결해드릴게요." 라고 묻는다
2. 사용자가 끝났다고 답하면 아래 절차를 진행한다:
   - **호출한 MCP에 맞는 레포**에서 브랜치 목록 조회 (`agent/*` 패턴)
     - `mcp__web__implement_and_pr` 실패 → `Erin-330/front-test`
     - `mcp__extension__implement_and_pr` 실패 → `Erin-330/extension-test`
   - 오픈된 PR 목록과 비교해 PR이 없는 최신 `agent/*` 브랜치를 찾는다
   - 해당 브랜치로 `mcp__github__create_pull_request`를 통해 PR 생성 (base: `develop`)
3. **PR 없는 새 브랜치가 없더라도 `implement_and_pr`을 재호출하지 말 것** — 서버가 아직 작업 중일 수 있으므로 새 브랜치가 생길 때까지 기다린 후 PR만 생성한다

### 예외: 로컬 직접 수정 허용

- **Docker 관련 코드** (Dockerfile, docker-compose.yml 등) → 로컬 파일 직접 수정 허용

## MCP 툴 용도

| 툴 | 용도 |
|---|---|
| `mcp__web__implement_and_pr` | 웹 코드 구현 + PR 생성 |
| `mcp__extension__implement_and_pr` | 익스텐션 코드 구현 + PR 생성 |
