# Login · Auth 페이지

---

## 라우트
| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/login` | `LoginPage` | 소셜 로그인 선택 |
| `/auth-verification` | `AuthVerificationPage` | OAuth 콜백 처리 + JWT 저장 |

---

## `/login` — 로그인

### 파일
```
pages/login/index.tsx
shared/ui/SocialLoginButton/
shared/api/auth.ts
```

### 제공 로그인 방식
- Google OAuth
- Apple OAuth
- Kakao OAuth

### 동작
1. `<SocialLoginButton platform="google" onClick={handleGoogleLogin} />`
2. 클릭 → 해당 OAuth 플로우 실행.
3. OAuth 성공 후 토큰 획득 → `/auth-verification`으로 이동 (token, platform 전달).

### SocialLoginButton props
```ts
{
  platform: 'google' | 'apple' | 'kakao'
  onClick: () => void
  disabled?: boolean
}
```

### 레이아웃
```
<div className="flex flex-col items-center justify-center h-[100dvh] bg-background">
  <RorrLogo />
  <div className="flex flex-col gap-3 w-full max-w-[320px] px-4 mt-8">
    <SocialLoginButton platform="google" />
    <SocialLoginButton platform="apple" />
    <SocialLoginButton platform="kakao" />
  </div>
</div>
```

---

## `/auth-verification` — 인증 검증

### 파일
```
pages/auth-verification/index.tsx
shared/lib/auth/token.ts
shared/lib/auth/index.ts
```

### 동작
1. OAuth 콜백 파라미터에서 access token 추출.
2. `authApi.login({ platformType, token, loginType: 'OAuth' })` 호출.
3. 성공:
   - `localStorage`에 JWT 저장 (`setToken(jwt)`).
   - `follow_onboarding_yn` 확인:
     - `false` → `/follow/league-list` (팔로우 온보딩)
     - `true` → `/` (메인)
4. 실패: 에러 모달 → `/login`.

### JWT 관련 함수 (`shared/lib/auth/`)

```ts
// 저장
setToken(jwt: string): void   // localStorage.setItem

// 조회
getStoredToken(): string | null

// 유효성 확인 (만료 여부)
isAuthValid(): boolean        // JWT exp 기준

// 제거
clearToken(): void

// 사용자 ID 추출
getUserIdFromToken(): string | null
```

### Rive 전환 오버레이
`/auth-verification`은 `transitionStore.transitioningTo`가 세팅된 상태로 진입.
`showLoginTransitionRive` 조건에 의해 `<RiveLoading overlayPosition="absolute">` 표시.

---

## 인증 흐름 전체

```
[로그인 없음]
  → /login
  → SocialLoginButton 클릭
  → OAuth 팝업/리다이렉트
  → /auth-verification (token, platform)
  → authApi.login
  → JWT 저장
  → 온보딩 여부 확인
    ├── Y → /
    └── N → /follow/league-list → /follow/team-list → /follow/player-list → /

[로그인 있음]
  → isAuthValid() 체크
  → 유효: 메인 페이지 접근
  → 만료: clearToken → /login

[401 응답]
  → Axios 인터셉터 자동 처리
  → clearToken
  → LoLSocket.disconnect
  → showModal
  → /login 리다이렉트
```

---

## 소셜 로그인 플랫폼별 차이

| 플랫폼 | `platformType` | 토큰 유형 |
|--------|---------------|-----------|
| Google | `'google'` | ID Token |
| Apple | `'apple'` | Identity Token |
| Kakao | `'kakao'` | Access Token |

---

## 환경별 설정

`shared/lib/types/auth.ts`:
```ts
export type SocialPlatform = 'google' | 'apple' | 'kakao'
```
