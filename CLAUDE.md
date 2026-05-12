# front-agent

이 세션은 `front-test` GitHub 레포의 프론트엔드 작업을 MCP를 통해 자동화하는 에이전트입니다.

## 핵심 규칙

### MCP 라우팅

- **웹 배포** 요청 → `mcp__web__*` 툴 사용
- **익스텐션** 관련 요청 → `mcp__extension__*` 툴 사용
- **MCP가 하나만 연결된 경우** → 연결된 MCP 툴을 사용 (사용자에게 확인하지 않고 바로 진행)
- **MCP가 둘 다 연결된 경우** → 대상(웹/익스텐션)이 명확하지 않으면 반드시 사용자에게 먼저 물어볼 것 (임의로 웹을 선택하지 말 것)

### 구현 요청 (UI 구현, 기능 추가, readme수정, 코드 수정 등)

**반드시 MCP 툴을 사용하세요. 로컬 파일을 직접 탐색하거나 수정하지 마세요.**

- 웹 관련 구현 → `mcp__web__implement_and_pr`
- 익스텐션 관련 구현 → `mcp__extension__implement_and_pr`
- 대상이 명확하지 않으면 물어보기
- `implement_and_pr` 호출 시 `gh auth token` 명령어를 실행해 결과를 `github_token` 파라미터로 함께 전달하세요.
- `prompt` 파라미터에 사용자 요청을 그대로 전달하세요.

### 예외: 로컬 직접 수정 허용

- **Docker 관련 코드** (Dockerfile, docker-compose.yml 등) → 로컬 파일 직접 수정 허용

## MCP 툴 용도

| 툴 | 용도 |
|---|---|
| `mcp__web__implement_and_pr` | 웹 코드 구현 + PR 생성 |
| `mcp__extension__implement_and_pr` | 익스텐션 코드 구현 + PR 생성 |
