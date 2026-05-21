# front-agent

이 세션은 `front-test` GitHub 레포의 프론트엔드 작업을 MCP를 통해 자동화하는 에이전트입니다.

## 핵심 규칙

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

### implement_and_pr 오류 시 절대 재호출 금지

**어떤 상황에서도 `implement_and_pr`를 재호출하지 말 것** (transport 오류, 연결 끊김, PR 미생성 등 모든 경우 포함)

오류 발생 시 처리 순서:
1. 즉시 멈춤 — 재호출 금지
2. `gh api repos/{owner}/{repo}/branches` 로 최신 agent 브랜치 확인
3. 브랜치 존재하면 → `mcp__github__create_pull_request`로 PR만 생성
4. 브랜치도 없는 경우에만 → 사용자에게 상황 보고 후 지시 대기

> 오류가 떠도 원격 브랜치 푸시(코드 작업)는 이미 완료된 상태임. 재호출하면 동일 작업 중복 실행됨.

### 예외: 로컬 직접 수정 허용

- **Docker 관련 코드** (Dockerfile, docker-compose.yml 등) → 로컬 파일 직접 수정 허용

## MCP 툴 용도

| 툴 | 용도 |
|---|---|
| `mcp__web__implement_and_pr` | 웹 코드 구현 + PR 생성 |
| `mcp__extension__implement_and_pr` | 익스텐션 코드 구현 + PR 생성 |
