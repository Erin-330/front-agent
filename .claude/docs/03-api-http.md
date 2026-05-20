# API & HTTP

## Axios 클라이언트

위치: `shared/api/axios.ts`  
export: `apiClient`

**설정:**

- Base URL: `VITE_BUL` 환경변수
- Request interceptor: localStorage JWT → `Authorization: Bearer <token>` 자동 부착
- Response interceptor: 401 → 토큰 제거 + `/login` 리다이렉트 + WebSocket 종료 + 모달 표시

```ts
import { apiClient } from '@/shared/api/axios'

const fetchData = () => apiClient.get<ResponseType>('/endpoint')
```

## Auth API

위치: `shared/api/auth.ts`  
소셜 로그인, 토큰 갱신 등 인증 관련 엔드포인트.

## JWT 처리

위치: `shared/lib/auth/token.ts`

- `getToken()` — localStorage에서 JWT 반환
- `setToken(token)` — 저장
- `removeToken()` — 삭제
- `isAuthValid()` — 만료 여부 체크 (exp 확인)

위치: `shared/lib/jwt.ts` — 토큰 디코드 유틸

## API 패턴

Feature 내 API 함수는 반드시 `features/<name>/api/` 에 위치:

```ts
// features/rank/api/ranking.ts
export const fetchMonthlyRanking = (month: string) => apiClient.get<RankingResponse>(`/ranking/monthly?month=${month}`)
```

hooks에서 래핑:

```ts
// features/rank/model/hooks/useMonthlyRanking.ts
export const useMonthlyRanking = (month: string) =>
  useQuery({
    queryKey: ['ranking', 'monthly', month],
    queryFn: () => fetchMonthlyRanking(month),
  })
```

## 환경변수

```
VITE_BUL=              # API Base URL
VITE_LOL_WS_BASE_URL=  # WebSocket Base URL
VITE_TCK=              # Toss Payments key
VITE_OPENAI_API_KEY=   # OpenAI API key
VITE_GAI=              # Google Analytics key
```

파일: `.env.development`, `.env.staging`, `.env.production`
