# Quiz · Streak 페이지 — 퀴즈·픽 히스토리·스트릭 캘린더

---

## 라우트
| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/streak/history` | `StreakHistoryPage` | 내 픽 목록 + 스트릭 캘린더 |

퀴즈 답변(제출/취소)은 라우트가 아닌 메인 페이지 내 `StreakWindowQuiz` 또는 `ScheduleQuizToast`에서 처리.

---

## `/streak/history` — 내 픽 히스토리

### 파일
```
pages/streak/history/index.tsx
pages/streak/history/components/
  MyPicksSection.tsx
  MyPicksList.tsx
  MyPicksCardItem.tsx
  MyPicksEmpty.tsx
  MyPicksSkeleton.tsx
features/quiz-my-picks/
  api/quizMyPicks.ts
  model/hooks/useQuizMyPicksInfinite.ts
features/quiz-calendar/
  api/quizCalendar.ts
  model/hooks/useQuizCalendar.ts
  ui/StreakCalendarWithData.tsx
shared/ui/StreakCalendar/
shared/ui/MatchPickCard/
```

### 레이아웃

```
<PageScrollLayout>
  <AppHeader left={BackIcon → PROFILE} center="내 픽 히스토리" />

  <StreakCalendarWithData
    year={currentYear}
    month={currentMonth}
    onMonthChange={setMonth}
  />

  <MyPicksSection>
    [로딩: <MyPicksSkeleton>]
    [빈 결과: <MyPicksEmpty>]
    [목록]:
      <MyPicksList>
        {picks.map → <MyPicksCardItem>}
      </MyPicksList>
      [무한 스크롤 sentinel]
  </MyPicksSection>
</PageScrollLayout>
```

---

## StreakCalendar — 스트릭 캘린더

### 파일
```
shared/ui/StreakCalendar/
  StreakCalendar.tsx
  StreakCalendar.helpers.ts
  components/
    Header.tsx
    Legend.tsx
    day/DayCellContent.tsx, DayNumber.tsx
```

### StreakCalendarWithData 동작
1. `useQuizCalendar({ year, month })` → `quizCalendarApi.getCalendar`.
2. 캘린더 데이터를 `<StreakCalendar>` props로 전달.
3. 월 이동 버튼 → year/month 상태 변경 → 재조회.

### StreakCalendar props
```ts
{
  year: number
  month: number
  calendarItems: QuizCalendarItem[]
  monthlyStreak: QuizCalendarMonthlyStreak
  onMonthChange: (year: number, month: number) => void
}
```

### 셀 표시 규칙 (`DayCellContent`)

| 조건 | 표시 |
|------|------|
| `has_activity === true` | 활동 있음 (컬러 셀) |
| `current_streak_type === 'win'` | 연승 색상 (파란 계열) |
| `current_streak_type === 'lose'` | 연패 색상 (붉은 계열) |
| `streak_continues_from_previous_day` | 좌측 연결 바 |
| `streak_continues_to_next_day` | 우측 연결 바 |
| `had_game_scheduled && !has_activity` | 경기 있었으나 미참여 (회색) |
| `display_text` | 셀 내 텍스트 오버레이 |

---

## MyPicksCardItem — 픽 카드

내부적으로 `<MatchPickCard>` 공유 컴포넌트 사용.

### MatchPickCard props
```ts
{
  matchId: string
  teams: QuizMyPickTeam[]      // [{ team_id, team_initial, team_logo }]
  scores: [number, number]
  selectedTeamId: string | null
  isCorrect: boolean
  status: string               // 'upcoming' | 'running' | 'completed'
  beginDate: string
  questionText?: string
  verified: boolean
}
```

### 표시 규칙

| 상태 | MatchResultLabel |
|------|-----------------|
| `verified && is_correct` | 정답 (초록) |
| `verified && !is_correct` | 오답 (빨강) |
| `!verified && status === 'running'` | 라이브 중 |
| `!verified && status === 'upcoming'` | 예정 |
| `status === 'completed' && !verified` | Finished |
| `selectedTeamId === null` | 미선택 |

---

## 퀴즈 답변 제출 — `quiz-answer` feature

### 파일
```
features/quiz-answer/
  api/quizAnswer.ts
  model/hooks/
    useQuizAnswerMutation.ts
    useQuizAnswerCancelMutation.ts
```

### useQuizAnswerMutation
```ts
const mutation = useQuizAnswerMutation()
mutation.mutate({
  match_id: string,
  selected_team_id: string,
  game_id?: string,
})
// 성공 → 스트릭 display 업데이트, 퀴즈 윈도우 닫기
// 에러 → showModal
```

### useQuizAnswerCancelMutation
```ts
const cancelMutation = useQuizAnswerCancelMutation()
cancelMutation.mutate({ match_id: string, action: 'cancel' })
```

---

## 무한 스크롤 (`useQuizMyPicksInfinite`)

```ts
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['quiz', 'my-picks', { period_month }],
  queryFn: ({ pageParam = 0 }) =>
    quizMyPicksApi.getMyPicks({ limit: 20, offset: pageParam, period_month }),
  getNextPageParam: (lastPage, allPages) => {
    const loaded = allPages.flatMap(p => p.data?.picks ?? []).length
    return loaded < (lastPage.data?.total ?? 0) ? loaded : undefined
  },
})
```

---

## TanStack Query 키

```ts
['quiz', 'calendar', year, month]
['quiz', 'my-picks', { period_month }]
```
