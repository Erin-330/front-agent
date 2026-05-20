# Claude 컨텍스트 문서

이 디렉토리는 Claude와 협업할 때 참조하는 프로젝트 문서입니다.

## 파일 목록

### 아키텍처·개발 참조 (01–10)

| 파일                                                       | 내용                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------- |
| [01-architecture.md](01-architecture.md)                   | FSD 레이어 구조, import 규칙, path alias, features·pages 목록 |
| [02-state-management.md](02-state-management.md)           | TanStack Query v5, Zustand 5 스토어 목록·패턴                 |
| [03-api-http.md](03-api-http.md)                           | Axios 클라이언트, JWT 처리, API 작성 패턴, 환경변수           |
| [04-routing-auth.md](04-routing-auth.md)                   | React Router v7, 인증 흐름, 소셜 로그인, 페이지 전환          |
| [05-websocket-realtime.md](05-websocket-realtime.md)       | LoLSocket 싱글톤, 실시간 채팅, LLM 이벤트 처리                |
| [06-ui-components.md](06-ui-components.md)                 | shared/ui 컴포넌트 목록, 아이콘, Tailwind, Storybook          |
| [07-live2d-rive-animation.md](07-live2d-rive-animation.md) | Rive 애니메이션, Live2D + PIXI v5/v8 이중 버전 처리           |
| [08-testing.md](08-testing.md)                             | Jest + Testing Library, 명령어, git hook                      |
| [09-dev-workflow.md](09-dev-workflow.md)                   | 개발 명령어, Husky hooks, ESLint/Prettier, 브랜치 전략        |
| [10-shared-hooks-utils.md](10-shared-hooks-utils.md)       | 공통 hooks, 날짜·상수·유틸 목록, 무한 스크롤 패턴             |

### 페이지·기능 스펙 (11–21) — 제로베이스 재현용

| 파일                                                             | 내용                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [11-api-reference.md](11-api-reference.md)                       | 전체 API 엔드포인트 명세 (URL, Request/Response TS 타입 포함)            |
| [12-page-main.md](12-page-main.md)                               | 메인 페이지 (채팅, WebSocket, 라이브 퀴즈, LLM 이벤트)                  |
| [13-page-schedule.md](13-page-schedule.md)                       | 스케줄 페이지 (경기 목록, 상세, 리그 필터, 양방향 무한 스크롤)           |
| [14-page-boost.md](14-page-boost.md)                             | 부스트 생성 3단계 플로우 (팀/선수 선택, 메시지, 확인)                    |
| [15-page-follow.md](15-page-follow.md)                           | 팔로우 온보딩 3단계 (리그·팀·선수 선택, 검색, 제출)                     |
| [16-page-profile-charge-mail.md](16-page-profile-charge-mail.md) | 프로필, 충전(Toss 결제), 메시지함, 구매 내역 페이지                      |
| [17-page-rank.md](17-page-rank.md)                               | 월간 랭킹 페이지 (등급별 그룹, 내 순위, Rive 그래프)                     |
| [18-page-quiz-streak.md](18-page-quiz-streak.md)                 | 퀴즈 답변, 내 픽 히스토리, 스트릭 캘린더                                |
| [19-page-boost-list-wall.md](19-page-boost-list-wall.md)         | 부스트 히스토리 (유저/팀/선수), 부스트 월, BoostHistoryMatchCard 상세    |
| [20-design-system.md](20-design-system.md)                       | Typography 변형·색상, 공통 컴포넌트 props, 레이아웃 패턴, 아이콘, 네비게이션 |
| [21-page-login-auth.md](21-page-login-auth.md)                   | 로그인 페이지, OAuth 콜백, JWT 관리, 인증 전체 흐름                      |

## 프로젝트 요약

- **서비스**: 리그 오브 레전드 e스포츠 커뮤니티 앱 (한국어)
- **스택**: React 19 + TypeScript + Vite + FSD 아키텍처
- **서버 상태**: TanStack Query v5
- **클라이언트 상태**: Zustand 5
- **HTTP**: Axios (`shared/api/axios.ts`)
- **실시간**: WebSocket (`shared/lib/socket/`)
- **애니메이션**: Rive + Live2D (PIXI v8/v5 혼용)
- **결제**: Toss Payments SDK
