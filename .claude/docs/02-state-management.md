# State Management

## 서버 상태 — TanStack Query v5

위치: `shared/lib/tanstack-query/queryClient.ts`

- API 호출은 모두 `features/*/api/` 안에 정의
- `features/*/model/hooks/` 에서 `useQuery` / `useMutation` 래핑
- `useInfiniteQuery` 사용 시 `useInfiniteScrollLoadMore` hook (`shared/hooks/`) 과 조합

```ts
// 패턴 예시
const { data } = useQuery({
  queryKey: ['rank', month],
  queryFn: () => fetchMonthlyRanking(month),
})
```

## 클라이언트 상태 — Zustand 5

### shared/lib/zustand/ 스토어 목록

| 스토어                    | 역할                                |
| ------------------------- | ----------------------------------- |
| `transitionStore`         | 페이지 전환 Rive 애니메이션 on/off  |
| `liveQuizStore`           | 실시간 퀴즈 상태 (WebSocket 연동)   |
| `liveEventStore`          | 실시간 이벤트 상태 (WebSocket 연동) |
| `scheduleQuizBannerStore` | 일정 퀴즈 배너 노출 제어            |

### shared/lib/modal/modalStore.ts

글로벌 모달 상태. 사용법:

```ts
import { showModal } from '@/shared/lib/modal'
showModal(variant, layout, message)
```

렌더링: `app/providers/modal.tsx` (RouterProvider 바깥)

### features/follow/model/store/followSelectionsStore.ts

팔로우 선택 중인 league/team/player ID 목록 관리.

## 스토어 접근 패턴

```ts
// Zustand v5 — 직접 import (useStore wrapper 없이도 가능)
import { useTransitionStore } from '@/shared/lib/zustand/transitionStore'

const isTransitioning = useTransitionStore((s) => s.isTransitioning)
```
