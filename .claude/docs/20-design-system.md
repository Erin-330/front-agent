# 디자인 시스템 — Typography · Color · Components · Layout

---

## Typography

`shared/ui/Typography/Typography.tsx` — `<Typography>` 컴포넌트 사용.

### Variants (Tailwind 클래스 기준)

| variant | 클래스 | 크기 | 굵기 |
|---------|--------|------|------|
| `title` | `text-custom-32px font-bold` | 32px | Bold |
| `header` | `text-custom-28px font-semibold` | 28px | SemiBold |
| `subtitle` | `text-2xl font-semibold` | 24px | SemiBold |
| `teamName` | `text-xl font-bold` | 20px | Bold |
| `description2` | `text-base font-bold` | 16px | Bold |
| `descriptionFocused` | `text-base font-extrabold` | 16px | ExtraBold |
| `description` | `text-sm font-light` | 14px | Light |
| `annotationBold` | `text-xs font-bold` | 12px | Bold |
| `annotation` | `text-xs font-normal` | 12px | Normal |
| `streakCalendarBold` | `text-custom-8px font-bold` | 8px | Bold |
| `streakCalendar` | `text-custom-8px font-normal` | 8px | Normal |
| `text4Icon` | `text-custom-8px font-bold` | 8px | Bold |

### Colors

| color | Tailwind 클래스 | 용도 |
|-------|----------------|------|
| `text100` | `text-dsText-100` | 최대 강조 |
| `text90` | `text-dsText-90` | 강조 |
| `text80` | `text-dsText-80` | 보조 |
| `text50` | `text-dsText-50` | 중간 |
| `text30` | `text-dsText-30` | 약한 |
| `text0` | `text-dsText-0` | 최약 |
| `primary` | `text-primary` | 주 색상 |
| `secondary` | `text-secondary` | 보조 색상 |
| `accent` | `text-accent` | 강조 색상 |
| `error` | `text-error` | 에러 |
| `success` | `text-success` | 성공 |
| `selected` | `text-selected` | 선택 상태 |
| `upcoming` | `text-upcoming` | 예정 상태 (노란색 계열) |
| `live` | `text-live` | 라이브 상태 (빨간색 계열) |
| `scoreColor` | `text-scoreColor` | 점수 표시 |
| `statusColorLive` | `text-statusColorLive` | 라이브 상태 배지 |
| `statusColorUpcoming` | `text-statusColorUpcoming` | 예정 상태 배지 |
| `boostEnergy4Icon` | `text-boostEnergy4Icon` | 부스트 에너지 (금색 계열) |
| `teamColorLeft` | `text-teamColorLeft` | 왼쪽 팀 동적 색상 |
| `teamColorRight` | `text-teamColorRight` | 오른쪽 팀 동적 색상 |

---

## 배경/표면 색상 (bg- 클래스)

| 의미 | 클래스 |
|------|--------|
| 앱 배경 | `bg-background` |
| 카드/표면 | `bg-surface` |
| 선택 상태 배경 | `bg-selected` |
| 테두리 | `border-border` |
| 테두리 (약) | `border-dsText-80` |

---

## 공통 UI 컴포넌트

### `<AppHeader>`
```ts
interface AppHeaderProps {
  left?: { icon: ReactNode; onClick: () => void }
  center?: ReactNode | string
  right?: { icon: ReactNode; onClick: () => void }
}
```
- 고정 상단 헤더. `pt-safe` 또는 `h-14` 기준.
- 뒤로가기: 보통 `<CloseIcon>` 또는 `<BackIcon>`.

### `<IconButton>`
```ts
interface IconButtonProps {
  icon: ReactNode
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  'aria-label': string
}
```

### `<PageScrollLayout>`
전체 높이 스크롤 컨테이너. `ref` 전달 시 IntersectionObserver root로 사용.
```tsx
<PageScrollLayout ref={scrollRef}>
  {children}
</PageScrollLayout>
```

### `<AppLayout>`
헤더 포함 레이아웃. `PageScrollLayout` + AppHeader 조합.

### `<MatchScoreCard>`
```ts
interface MatchScoreCardProps {
  gameLabel: string         // 'LOL'
  leagueLabel: string
  leftTeamName: string
  leftTeamLogo: string
  rightTeamName: string
  rightTeamLogo: string
  leftScore?: number
  rightScore?: number
  status: 'live' | 'upcoming' | 'finished'
  beginDate: string
  onClick?: () => void
  className?: string
}
```
- 상태별 배지: `live` → 빨간 LIVE, `upcoming` → 노란 예정, `finished` → 회색 종료.
- 점수 표시: `status === 'finished'` 일 때만.

### `<MatchPickCard>`
퀴즈 픽 카드. 팀 선택 버튼 + 결과 레이블 포함.

### `<TabNav>`
```ts
interface TabNavProps {
  tabs: string[]
  activeIndex: number
  onChange: (index: number) => void
}
```

### `<LeagueFilterToggle>`
리그 필터 버튼 (schedule 상단).

### `<SectionHeader>`
섹션 제목 헤더.

### `<SocialLoginButton>`
소셜 로그인 버튼 (구글, 애플, 카카오).

### `<Modal>`
전역 모달. `showModal(variant, layout, message)` 함수로 호출.
```ts
showModal(variant: string, layout: string, message: string): void
```

### `<ToggleSwitch>`
ON/OFF 토글 스위치.
```ts
{ checked: boolean; onChange: (v: boolean) => void; label?: string }
```

### `<CustomImg>`
이미지 컴포넌트. 에러 시 `errorImgSrc` 폴백.
```ts
{ src?: string; errorImgSrc?: string; className?: string; ... }
```

### Loading 컴포넌트
| 컴포넌트 | 용도 |
|----------|------|
| `<LoadingRive artboard="Loading" />` | 인라인 로딩 |
| `<RiveLoading overlayPosition="absolute" />` | 전체화면 오버레이 |
| `<NoScheduleRive />` | 일정 없음 빈 상태 |
| `<NoDataRive />` | 데이터 없음 빈 상태 |
| `<NoBoostRive />` | 부스트 없음 빈 상태 |

---

## 레이아웃 패턴

### 전체 페이지 기본 구조
```tsx
<div className="relative h-full min-h-[100dvh] w-full bg-background">
  <AppHeader ... />
  <main className="flex h-[100dvh] w-full flex-col overflow-y-auto px-4 pt-14">
    {/* 콘텐츠 */}
  </main>
</div>
```

### 스크롤 + 헤더 패턴 (`PageScrollLayout`)
```tsx
<PageScrollLayout ref={scrollRef}>
  <AppHeader ... />
  <div className="pl-4 pr-2 pb-8 flex flex-col gap-4 w-full max-w-[500px] mx-auto">
    {/* 목록 */}
  </div>
</PageScrollLayout>
```

### 카드 기본 구조
```tsx
<div className="bg-surface flex flex-col w-full rounded-[0.5rem]">
  {/* 내용 */}
</div>
```

---

## 애니메이션 (Rive)

| 컴포넌트 | 파일 | artboard |
|----------|------|----------|
| 로딩 | `LoadingRive.tsx` | `'Loading'` |
| 스플래시 | `SplashRive.tsx` | — |
| 좋아요 버튼 | `FeedLikeBtnRive.tsx` | — |
| 데이터 없음 | `NoDataRive.tsx` | — |
| 일정 없음 | `NoScheduleRive.tsx` | — |
| 부스트 없음 | `NoBoostRive.tsx` | — |
| 부스트 월 파티클 | `BoostWallConfettiRive.tsx` | — |
| 랭킹 그래프 | `StreakRankingGraphRive.tsx` | — |
| 스트릭 불꽃 | `StreakStatusFireRive.tsx` | — |

---

## 아이콘 시스템

`shared/ui/icons/index.ts`에서 65개 이상 SVG 아이콘 export.

네이밍 패턴: `{Name}Icon` (예: `CloseIcon`, `BackIcon`, `BoostIcon`, `MailIcon`).

사용법:
```tsx
import { CloseIcon } from '@/shared/ui/icons'
<CloseIcon className="w-6 h-6 text-dsText-0" />
```

---

## 페이지 내비게이션 패턴

`usePageNavigation()` hook 사용 — history state를 포함한 `setPage` 제공.

```ts
const { setPage, page, pageState } = usePageNavigation()

// 이동
setPage(PAGES.SCHEDULE_DETAIL, {
  state: { match_id, teams, ... }
})

// 뒤로가기
setPage(PAGES.MAIN)
```

`PAGES` 상수 (`shared/lib/constants/pages.ts`):
```ts
PAGES.MAIN = '/'
PAGES.SCHEDULE = '/schedule'
PAGES.SCHEDULE_DETAIL = '/schedule/detail'
PAGES.LEAGUE_FILTER = '/league-filter'
PAGES.BOOST_SELECT = '/boost/select'
PAGES.BOOST_MESSAGE = '/boost/message'
PAGES.BOOST_CONFIRM = '/boost/confirm'
PAGES.BOOST_LIST = '/boost-list'
PAGES.BOOST_LIST_TEAM = '/boost-list/team'
PAGES.BOOST_LIST_PLAYER = '/boost-list/player'
PAGES.BOOST_WALL = '/boost-wall'
PAGES.PROFILE = '/profile'
PAGES.MAIL = '/mail'
PAGES.CHARGE = '/charge'
PAGES.PURCHASE_LIST = '/purchase-list'
PAGES.RANK = '/rank'
PAGES.STREAK_HISTORY = '/streak/history'
PAGES.FOLLOW_LEAGUE = '/follow/league-list'
PAGES.FOLLOW_TEAM = '/follow/team-list'
PAGES.FOLLOW_PLAYER = '/follow/player-list'
PAGES.LOGIN = '/login'
```

---

## 반응형 / 모바일

- 모바일 우선 설계. 최대 너비: `max-w-[500px] mx-auto`.
- 뷰포트 높이: `h-[100dvh]` (dynamic viewport height).
- 입력 포커스 줌 방지: `usePreventZoomOnInput` hook.
- 모바일 기기 감지: `useIsMobileDevice` hook.
