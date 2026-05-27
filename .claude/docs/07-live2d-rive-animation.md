# Live2D & Rive 애니메이션

## Rive

패키지: `@rive-app/react-canvas` v4.27.2

**사용 위치:**

- `shared/ui/Loading/LoadingRive.tsx` — 로딩 스피너
- `shared/ui/Loading/NoScheduleRive.tsx` — 일정 없음 상태
- `features/rank/ui/StreakRankingGraphRive/` — 랭킹 그래프 애니메이션
- `app/providers/pageNavigation.tsx` — 페이지 전환 오버레이

**유틸:**

- `shared/lib/utils/riveAssetFont.ts` — Rive 에셋 폰트 처리

## Live2D / PIXI

**핵심 이슈**: 앱은 PIXI v8을 쓰지만, `pixi-live2d-display`는 PIXI v5만 지원.

**해결책** (`vite.config.ts`):

```ts
// pixiLive2dV5Alias() 플러그인
// pixi-live2d-display 의 PIXI import만 v5로 alias
// 나머지 앱은 PIXI v8 그대로 사용
```

**패키지:**

- `live2d-react` — 로컬 vendor 패키지 (`vendor/live2d-react/`)
- `untitled-pixi-live2d-engine` — Live2D 엔진

**설치:**

```bash
yarn install:vendor-live2d   # vendor 패키지 설치
```

**컴포넌트:** `shared/ui/Live2DCharacter/Live2DCharacter.tsx`  
**API:** `shared/api/extension/live2dCharacter.ts`  
**Hook:** `shared/model/hooks/useLive2DCharacter.ts`

**캐시 비활성화**: `live2d-no-cache` Vite 플러그인이 `/live/` 경로 캐싱 비활성화.
