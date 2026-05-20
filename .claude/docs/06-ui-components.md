# UI Components

## Shared UI 라이브러리

위치: `shared/ui/`  
사용: `import { ComponentName } from '@/shared/ui'`

### 주요 컴포넌트 목록

| 컴포넌트                | 역할                            |
| ----------------------- | ------------------------------- |
| `AppHeader`             | 상단 네비게이션 바 (slots 패턴) |
| `Modal`                 | 글로벌 모달 컨테이너            |
| `TabNav`                | 탭 네비게이션                   |
| `Typography`            | 텍스트 스타일 통일 컴포넌트     |
| `MatchPickCard`         | 경기 예측 카드 (팀 선택 UI)     |
| `MatchScoreCard`        | 경기 결과 스코어 카드           |
| `StreakCalendar`        | 스트릭 달력 시각화              |
| `StreakStatusCard`      | 스트릭 현황 배지                |
| `Loading / LoadingRive` | Rive 기반 로딩 스피너           |
| `NoScheduleRive`        | 일정 없음 Rive 애니메이션       |
| `Live2DCharacter`       | Live2D 캐릭터 위젯              |
| `SocialLoginButton`     | OAuth 소셜 로그인 버튼          |
| `PageContainer`         | 페이지 공통 레이아웃 래퍼       |
| `SectionHeader`         | 섹션 제목                       |
| `IconButton`            | 아이콘 버튼                     |
| `CustomImg`             | 이미지 fallback 처리            |
| `LeagueFilterToggle`    | 리그 필터 토글                  |
| `ToggleSwitch`          | 토글 스위치                     |
| `BoostHistoryMatchCard` | 부스트 이력 카드                |
| `BoostWallConfetti`     | 부스트 월 컨페티                |
| `NoBoost / NoData`      | 빈 상태 UI                      |
| `GameEventCard`         | 게임 이벤트 카드                |
| `SplashScreen`          | 스플래시 화면                   |

### Icons (`shared/ui/icons/`)

50+ SVG 아이콘 컴포넌트. 모두 `index.ts`에서 named export.

```ts
import { BoostIcon, CloseIcon, CheckIcon } from '@/shared/ui/icons'
```

## 스타일링

**Tailwind CSS** + 커스텀 설정 (`tailwind.config.ts`):

```ts
colors: {
  dsText: { ... },     // 텍스트 색상 시스템
  primary: { ... },    // 브랜드 색상
  // ...
}
fonts: ['Pretendard']
```

CSS Modules 사용 가능 (Jest에서 `identity-obj-proxy`로 mock).

## AppHeader 패턴

Slots 패턴으로 좌/중/우 영역 커스터마이즈:

```tsx
<AppHeader left={<BackButton />} center={<Title />} right={<ActionButton />} />
```

## Storybook

```bash
yarn storybook   # localhost:6006
```

`.stories.tsx` 파일: AppHeader, MatchPickCard, MatchScoreCard, StreakCalendar, TabNav, Typography, LeagueSelectButton, TeamSelectButton, PlayerSelectButton, Modal 등에 존재.
