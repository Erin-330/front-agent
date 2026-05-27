# Routing & Auth

## 라우터

위치: `app/providers/router.tsx`

- React Router v7 사용
- 모든 페이지 `React.lazy()` + `Suspense` 로 lazy-load
- 인증 가드: `isAuthValid()` 실패 시 `/login` 으로 리다이렉트

## Auth 흐름

1. **로그인**: `pages/login/` — 소셜 로그인 버튼 (카카오, 구글 등)
2. **OAuth 콜백**: `pages/auth-verification/` — 토큰 수신 후 localStorage 저장
3. **토큰 체크**: 모든 protected route 진입 시 `isAuthValid()` 호출
4. **401 처리**: Axios interceptor가 자동으로 처리 → 토큰 제거 → `/login` 이동

## 소셜 로그인 버튼

`shared/ui/SocialLoginButton/` — OAuth provider별 버튼 컴포넌트

## 페이지 전환 애니메이션

`app/providers/pageNavigation.tsx` + `shared/lib/zustand/transitionStore`

- 라우트 변경 시 Rive 오버레이 애니메이션 표시
- `transitionStore.setIsTransitioning(true/false)` 로 제어

## 주요 라우트 구조

```
/                    → main (메인 + 채팅)
/login               → login
/auth/verification   → auth-verification (OAuth 콜백)
/profile             → profile
/rank                → rank
/schedule/...        → schedule 관련
/follow/...          → follow 설정
/boost/...           → 부스트 생성 플로우
/boost-list/...      → 부스트 목록
/boost-wall          → 부스트 월
/charge/toss         → Toss 충전
/payment/verify      → 결제 확인
/mail                → 받은 편지함
/purchase/list       → 구매 이력
/streak/history      → 스트릭 히스토리
```

## 배경색 설정

`shared/config/routeRootBackground.ts` — 라우트별 배경색 매핑  
`shared/hooks/useRouteRootBackground.ts` — 현재 라우트 배경색 반환 hook
