# Shared Hooks & Utils

## Shared Hooks (`shared/hooks/`)

| Hook                        | 역할                                                     |
| --------------------------- | -------------------------------------------------------- |
| `useIntersectionObserver`   | Intersection Observer API 래퍼                           |
| `useInfiniteScrollLoadMore` | 무한 스크롤 트리거 (TanStack Query `fetchNextPage` 연동) |
| `useIsMobileDevice`         | 모바일 환경 판별                                         |
| `usePreventZoomOnInput`     | input focus 시 iOS 확대 방지                             |
| `useHeaderHeight`           | AppHeader 높이 계산                                      |
| `useRouteRootBackground`    | 현재 라우트 배경색 반환                                  |

## 날짜 유틸 (`shared/lib/date/`)

| 함수                | 역할                           |
| ------------------- | ------------------------------ |
| `getFeedTimeAgo`    | "3분 전", "1시간 전" 형태 반환 |
| `getTimeDifference` | 두 날짜 간 차이 계산           |

## 상수 (`shared/lib/constants/`)

| 파일            | 내용               |
| --------------- | ------------------ |
| `errorCodes.ts` | API 에러 코드 상수 |
| `images.ts`     | 이미지 경로 상수   |
| `pages.ts`      | 페이지명 상수      |
| `paths.ts`      | 라우트 경로 상수   |

## 기타 유틸 (`shared/lib/utils/`)

| 함수               | 역할             |
| ------------------ | ---------------- |
| `formatGameNumber` | 경기 번호 포맷   |
| `list`             | 리스트 관련 헬퍼 |
| `riveAssetFont`    | Rive 폰트 처리   |

## 무한 스크롤 패턴

```tsx
const { ref } = useIntersectionObserver(() => {
  if (hasNextPage) fetchNextPage()
})

return (
  <>
    {items.map(...)}
    <div ref={ref} />  {/* 마지막 요소에 부착 */}
  </>
)
```

## viewport 유틸 (`shared/lib/viewport.ts`)

뷰포트 높이 계산 — iOS Safari의 주소창 이슈 대응 (`--vh` CSS 변수 설정).
