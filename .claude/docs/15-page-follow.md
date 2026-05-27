# Follow 페이지 — 리그·팀·선수 팔로우 온보딩

## 라우트
| 경로 | 컴포넌트 | 단계 |
|------|----------|------|
| `/follow/league-list` | `LeagueListPage` | 1단계: 리그 선택 |
| `/follow/team-list` | `TeamListPage` | 2단계: 팀 선택 |
| `/follow/player-list` | `PlayerListPage` | 3단계: 선수 선택 + 완료 |

## 진입 조건
`followApi.getMyFollow` → `data.follow_onboarding_yn === false` 이면 온보딩 강제 진행.  
이미 완료된 경우에도 설정 메뉴에서 재진입 가능.

---

## 파일 구조
```
pages/follow/
  league-list/index.tsx
  team-list/index.tsx
  player-list/index.tsx
features/follow/
  api/follow.ts
  model/
    hooks/
      useFollowList.ts              → GET /follow/list 조회
      useFollowListPage.ts          → 페이지별 상태 통합
      useFollowSubmit.ts            → PUT /follow 제출
      useHydrateFollowSelections.ts → 기존 팔로우 복원
      useSearchFollowList.ts        → GET /search
      useSearchPanel.ts             → 검색 패널 open/close
      index.ts
    store/
      followSelectionsStore.ts      → 선택 상태 Zustand
    lib/
      followListResponse.ts
      followListUtils.ts
      followMyStorage.ts
    constants/
      selectionLimits.ts
      navigation.ts
      hydration.ts
      errorMessages.ts
  ui/
    FollowListLayout.tsx
    FollowListContent.tsx
    StepIndicator.tsx
    SearchResultsEmpty.tsx
entities/
  league/ui/LeagueSelectButton.tsx
  team/ui/TeamSelectButton.tsx
  player/ui/PlayerSelectButton.tsx
```

---

## Zustand 스토어 (`followSelectionsStore`)

```ts
{
  leagues: FollowTargetItem[]    // 선택된 리그 목록
  teams: FollowTargetItem[]      // 선택된 팀 목록
  players: FollowTargetItem[]    // 선택된 선수 목록
  setLeagues: (items) => void
  setTeams: (items) => void
  setPlayers: (items) => void
  toggleLeague: (item) => void
  toggleTeam: (item) => void
  togglePlayer: (item) => void
  reset: () => void
}
```

---

## 선택 제한 (`selectionLimits.ts`)

| 타입 | 최소 | 최대 |
|------|------|------|
| league | 1 | 5 |
| team | 1 | 10 |
| player | 0 | 20 |

---

## 공통 레이아웃 (`FollowListLayout`)

```
<div className="flex flex-col h-[100dvh]">
  <AppHeader left={CloseIcon} center="팔로우 설정" />
  <StepIndicator currentStep={1|2|3} />    ← 단계 표시 (리그/팀/선수)
  <SearchBar onFocus={openSearch} />
  [검색 패널 (SearchResultsEmpty or 결과)]
  <FollowListContent items={...} />        ← 선택 가능 카드 목록
  <div className="p-4">
    <button onClick={handleNext} disabled={!canProceed}>
      {step === 3 ? '완료' : '다음'}
    </button>
  </div>
</div>
```

---

## 1단계: 리그 선택 (`LeagueListPage`)

### 동작
1. `useFollowList('league')` → `GET /follow/list?follow_type=league`.
2. `useHydrateFollowSelections` → 기존 팔로우 데이터로 스토어 초기화.
3. `<LeagueSelectButton>` 렌더 + 선택 토글.
4. 다음 → `/follow/team-list`.

### LeagueSelectButton props
```ts
{
  item: FollowTargetItem
  isSelected: boolean
  onToggle: (item: FollowTargetItem) => void
}
```

---

## 2단계: 팀 선택 (`TeamListPage`)

### 동작
1. `useFollowList('team')`.
2. `<TeamSelectButton>` 렌더 — `initial`(팀 약어)·`image_url` 표시.
3. 다음 → `/follow/player-list`.

---

## 3단계: 선수 선택 (`PlayerListPage`)

### 동작
1. `useFollowList('player')` — 선택된 팀 소속 선수만 필터링.
2. `<PlayerSelectButton>` 렌더.
3. **완료** → `useFollowSubmit.submitAll()`:
   ```ts
   followApi.submitFollowAll({
     league: selectedLeagues.map(l => ({ target_id: l.target_id })),
     team:   selectedTeams.map(t => ({ target_id: t.target_id })),
     player: selectedPlayers.map(p => ({ target_id: p.target_id })),
   })
   ```
4. 성공 → 메인 페이지(`/`) 이동, `followSelectionsStore.reset()`.

---

## 검색 패널

- 검색창 포커스 → 검색 패널 오픈.
- `useSearchFollowList(query, searchType)` → `followApi.searchFollow`.
- debounce 적용 (300ms).
- 결과 없음 → `<SearchResultsEmpty>` 표시.
- 검색 결과 항목 클릭 → 해당 아이템 선택 토글.

---

## FollowTargetItem 카드 공통 표시 규칙

| 필드 | 표시 위치 |
|------|----------|
| `image_url` | 원형 로고/아바타 |
| `name` | 메인 텍스트 |
| `nickname` (player) | 서브 텍스트 |
| `team_name` (player) | 서브 텍스트 2 |
| `initial` (team) | 팀 약어 배지 |
| `boostYN === 'Y'` | 부스트 가능 뱃지 |
| `follow_yn` | 이미 팔로우 표시 |
