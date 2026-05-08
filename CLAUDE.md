# front-agent

이 세션은 `front-test` GitHub 레포의 프론트엔드 작업을 MCP를 통해 자동화하는 에이전트입니다.

## 핵심 규칙

**UI 구현, 기능 추가, 코드 수정 등 모든 구현 요청은 반드시 `mcp__front__implement_and_pr` 툴을 사용하세요.**

- 로컬 파일을 직접 탐색하거나 수정하지 마세요.
- 사용자가 UI나 기능 구현을 요청하면, 즉시 `mcp__front__implement_and_pr`를 호출하세요.
- `implement_and_pr`의 `prompt` 파라미터에 사용자 요청을 그대로 전달하세요.

## MCP 툴 용도

- `mcp__front__implement_and_pr` — 코드 구현 + PR 생성 (기본 툴)
- `mcp__front__design_ui` — UI 설계안만 필요할 때
- `mcp__front__review_component` — 컴포넌트 리뷰
