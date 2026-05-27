# Schedule 페이지 — 경기 일정 + 상세 + 리그 필터

## 라우트
| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/schedule` | `SchedulePage` | 경기 목록 (양방향 무한 스크롤) |
| `/schedule/detail` | `ScheduleDetailPage` | 매치 상세 + 부스트 피드 + 이벤트 탭 |
| `/league-filter` | `LeagueFilterPage` | 리그 필터 선택 |

---

## `/schedule` — 경기 목록

### 파일
```
pages/schedule/index.tsx
features/schedule/
  api/scheduleMatches.ts
  model/hooks/useScheduleMatches.ts
  lib/mapSeriesStatusToMatchStatus.ts
shared/ui/MatchScoreCard/
```

### 핵심 동작

**양방향 무한 스크롤**
- 초기 로드: `direction: 'standard'` (오늘 기준 전후 경기)
- 위 스크롤 → `direction: 'forward'` (이전 경기 prepend)
- 아래 스크롤 → `direction: 'backward'` (다음 경기 append)
- `IntersectionObserver`로 상단/하단 sentinel 감지 (rootMargin: 100px)
- forward prepend 시 scrollTop 보정 (스크롤 점프 방지)

**오늘 날짜 스크롤**
- 초기 로드 후 오늘 날짜 라벨로 자동 스크롤 (RAF retry 최대 10회)
- 오늘 경기 없으면 가장 최근 완료 경기 날짜로 이동
- Today 버튼: 대상 날짜 라벨이 뷰포트 밖일 때만 표시

**localStorage 리그 필터**
- 키: `'LoL_leagueS'`
- 없으면 기본값: `'LoL_OF_98767991310872058'`

### 레이아웃

```
<PageScrollLayout>                          ← 스크롤 컨테이너 (ref)
  <AppHeader
    left={CloseIcon → PAGES.MAIN}
    right={LeagueFilterIcon → PAGES.LEAGUE_FILTER}
  />
  [로딩: <LoadingRive>]
  [빈 일정: <NoScheduleRive>]
  [일정 목록]:
    <div ref={topSentinelRef} />           ← 상단 sentinel (forward 트리거)
    [isFetchingForward: <LoadingRive>]
    {matches.map → dateLabel + <MatchScoreCard> onClick→SCHEDULE_DETAIL}
    [isFetchingBackward: <LoadingRive>]
    <div ref={bottomSentinelRef} />        ← 하단 sentinel (backward 트리거)
  [Today 버튼: fixed bottom-6 right]       ← conditional
</PageScrollLayout>
```

### MatchScoreCard props
```ts
{
  gameLabel: 'LOL'
  leagueLabel: string        // leagues.league_name
  leftTeamName: string       // teams[0].initial
  leftTeamLogo: string       // teams[0].image_url
  rightTeamName: string      // teams[1].initial
  rightTeamLogo: string      // teams[1].image_url
  leftScore?: number
  rightScore?: number
  status: 'live' | 'upcoming' | 'finished'  // mapSeriesStatusToMatchStatus 변환
  beginDate: string
  onClick: () => void        // → SCHEDULE_DETAIL with location state
}
```

### status 매핑 (`mapSeriesStatusToMatchStatus`)
- `'running'` → `'live'`
- `'completed'` → `'finished'`
- 그 외 → `'upcoming'`

### SCHEDULE_DETAIL location state
```ts
{
  match_id: string
  status: string
  teams: ScheduleMatchTeamDto[]
  leagues: ScheduleMatchLeagueDto
  series: { serie_id, serie_name, begin_date, end_date }
  begin_date: string | null
  donationInfo: ScheduleMatchDonationInfoDto[]
}
```

---

## `/schedule/detail` — 매치 상세

### 파일
```
pages/schedule/detail/index.tsx
pages/schedule/detail/boost/index.tsx   ← 부스트 피드 탭
pages/schedule/detail/event/index.tsx   ← 이벤트 탭
features/schedule/model/hooks/
  useDonationHistoryByMatchInfinite.ts
  useScheduleEvents.ts
  useSetFeedLike.ts
shared/ui/BoostHistoryMatchCard/
shared/ui/GameEventCard/
```

### 탭 구조
1. **부스트 탭** (`/schedule/detail/boost`): 매치별 부스트 피드 무한 스크롤
2. **이벤트 탭** (`/schedule/detail/event`): LLM 요약 이벤트 목록

### 부스트 탭 동작
- `useDonationHistoryByMatchInfinite` → `donationApi.getDonationHistoryByMatch`
- `IntersectionObserver`로 무한 스크롤 (per_page: 20)
- 좋아요: `useSetFeedLike` → `feedLikeApi.setFeedLike`
- 각 아이템: `<BoostHistoryMatchCard item={...} leftTeamId={teams[0].team_id} onLikeClick={...} />`

### 이벤트 탭 동작
- `useScheduleEvents` → `scheduleMatchesApi.getEvents`
- `<GameEventCard>` 목록 렌더
- 이벤트가 없으면 `<NoDataRive>`

### 헤더 구조
```
<AppHeader
  left={BackIcon → 이전 페이지}
  center={leagueName}
  right={BoostIcon → /boost/select with location state}
/>
<MatchScoreCard (클릭 불가, 상태 표시용) />
<TabNav tabs={['부스트', '이벤트']} />
```

---

## `/league-filter` — 리그 필터

### 파일
```
pages/schedule/league-filter/index.tsx
features/schedule/model/hooks/useLeaguesForLoL.ts
entities/league/ui/LeagueSelectButton.tsx
```

### 동작
- `useLeaguesForLoL` → `scheduleMatchesApi.getLeaguesForLoL`
- 리그 버튼 선택 → localStorage `'LoL_leagueS'`에 league_id 저장
- 완료 → `/schedule` 복귀

### 레이아웃
```
<AppHeader left={CloseIcon → PAGES.SCHEDULE} />
<div className="flex flex-col gap-4 p-4">
  {leagues.map → <LeagueSelectButton>}
</div>
<button onClick={handleDone}>완료</button>
```
