# Architecture — Feature-Sliced Design (FSD)

## Layer 구조

```
src/
├── app/        앱 진입점, Provider 조합
├── pages/      라우트 단위 페이지 (16개)
├── features/   비즈니스 로직 슬라이스 (13개)
├── entities/   핵심 도메인 모델 (follow, league, team, player)
└── shared/     공통 API, lib, UI, hooks, config
```

**Import 규칙**: 상위 레이어만 하위 레이어를 import. 역방향 절대 금지.

```
pages → features → entities → shared
```

## Path Aliases (`vite.config.ts`, `tsconfig.app.json`)

| Alias        | 경로           |
| ------------ | -------------- |
| `@/`         | `src/`         |
| `@/app`      | `src/app`      |
| `@/shared`   | `src/shared`   |
| `@/entities` | `src/entities` |
| `@/features` | `src/features` |
| `@/pages`    | `src/pages`    |

## Feature 슬라이스 내부 구조

```
features/<name>/
├── api/        API 호출 함수 (Axios 기반)
├── model/
│   ├── hooks/  TanStack Query / 비즈니스 로직 hooks
│   └── store/  Zustand store (필요시)
├── lib/        constants, utils, types
├── ui/         React 컴포넌트
└── index.ts    public export
```

## 13개 Features 목록

| Feature         | 역할                           |
| --------------- | ------------------------------ |
| `boost`         | 선수/팀 응원(부스트) 생성·조회 |
| `charge`        | 인앱 화폐 충전 (Toss Payments) |
| `chat`          | 실시간 WebSocket 채팅          |
| `follow`        | 리그·팀·선수 팔로우            |
| `mail`          | 받은 편지함                    |
| `profile`       | 유저 프로필 관리               |
| `purchase-list` | 구매 이력 조회                 |
| `quiz-answer`   | 경기 예측 답변                 |
| `quiz-calendar` | 퀴즈 일정 캘린더               |
| `quiz-my-picks` | 내 픽 결과 조회                |
| `rank`          | 월간 랭킹 리더보드             |
| `schedule`      | 경기 일정 조회·필터            |

## 16개 Pages 목록

`main`, `login`, `auth-verification`, `profile`, `rank`, `schedule/detail/{boost,event}`, `schedule/league-filter`, `follow/{league,team,player}-list`, `boost/{select,message,confirm}`, `boost-list/{user,team,player}`, `boost-wall`, `charge/toss`, `payment/verify`, `mail`, `purchase/list`, `streak/history`

## 4개 Entities

- `follow/model/types.ts` — Follow 타입 정의
- `league/ui/LeagueSelectButton`
- `team/ui/TeamSelectButton`
- `player/ui/PlayerSelectButton`

## App Providers 순서 (`app/App.tsx`)

```
SplashProvider
  ModalProvider
    PageNavigationProvider
      QueryClientProvider
        RouterProvider
```
