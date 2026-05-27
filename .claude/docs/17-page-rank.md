# Rank 페이지 — 월간 랭킹

## 라우트
`/rank` → `RankPage`

---

## 파일 구조
```
pages/rank/index.tsx
features/rank/
  api/ranking.ts
  lib/
    gradeConfig.ts           ← 등급 설정 (threshold, name, color 등)
    getGradeDisplayItems.ts
    getGradesWithEntries.ts
    scrollUtils.ts
  model/hooks/
    useMonthlyRanking.ts     → GET /ranking/monthly
    useRankPage.ts
    useRankPageData.ts
  ui/
    RankTop5Section/         ← 상위 5명 특별 표시
    RankGradeSection/        ← 등급 헤더 + 그래프
    RankGradeList/           ← 등급별 사용자 목록
    RankGradeListSection/
    RankMyRankingSection/    ← 내 순위 고정 표시
    RankMonthPicker/         ← 월 선택
    RankDetailModal/         ← 랭커 상세 모달
    StreakRankingGraphRive/   ← Rive 그래프 애니메이션
    StreakRankingGraphSkeleton/
```

---

## 데이터 흐름

```
1. rankingApi.getMonthlyAvailablePeriods()  → 선택 가능한 period 목록
2. rankingApi.getMonthly(periodValue)       → 해당 기간 랭킹 데이터
3. getGradesWithEntries(rankings, gradeConfig) → 등급별 그룹핑
4. getGradeDisplayItems(grade)              → 각 등급 표시 정보
```

---

## 등급 시스템 (`gradeConfig.ts`)

등급은 `gradeId`로 구분. 예시 구조:
```ts
const gradeConfig = [
  { gradeId: 1, gradeName: 'Bronze', color: '#CD7F32', minStreak: 0 },
  { gradeId: 2, gradeName: 'Silver', color: '#C0C0C0', minStreak: 5 },
  { gradeId: 3, gradeName: 'Gold',   color: '#FFD700', minStreak: 10 },
  // ...
]
```

---

## 레이아웃

```
<PageScrollLayout>
  <AppHeader left={BackIcon → PROFILE} center="랭킹" />

  <RankMonthPicker
    periods={availablePeriods}
    selected={currentPeriod}
    onChange={setPeriod}
  />

  <RankMyRankingSection
    rank={data.my_rank}
    grade={data.my_grade}
    streak={data.my_currentStreak}
    picture={data.my_picture}
    userName={data.my_userName}
  />

  <RankTop5Section entries={rankings.slice(0,5)} />

  {gradesWithEntries.map(({ grade, entries }) =>
    <RankGradeListSection>
      <RankGradeSection
        gradeName={grade}
        expectedReward={...}
      >
        <StreakRankingGraphRive />        ← Rive 그래프 또는 Skeleton
      </RankGradeSection>
      <RankGradeList>
        {entries.map → <RankGradeListItem onClick={openDetailModal} />}
      </RankGradeList>
    </RankGradeListSection>
  )}
</PageScrollLayout>

<RankDetailModal
  isOpen={modalOpen}
  entry={selectedEntry}
  onClose={closeModal}
/>
```

---

## RankGradeListItem 표시 항목

| 필드 | 표시 |
|------|------|
| `rank` | 순위 번호 |
| `picture` | 프로필 이미지 |
| `userName` | 닉네임 |
| `grade` / `gradeName` | 등급 배지 |
| `currentStreak` | 현재 연승/연패 |
| `longest_win_streak` | 최장 연승 |
| `isMe` | 내 항목 하이라이트 |
| `expected_reward` | 예상 보상 에너지 |

---

## RankDetailModal

- 클릭한 사용자 상세 정보 모달.
- 표시: 프로필, 등급, 현재 스트릭, 최장 스트릭, 예상 보상.

---

## 월 선택 (`RankMonthPicker`)

- `availablePeriods` 드롭다운.
- 선택 변경 시 `rankingApi.getMonthly(newPeriod)` 재호출.

---

## TanStack Query 키

```ts
['ranking', 'monthly', periodValue]
['ranking', 'available-periods']
```
