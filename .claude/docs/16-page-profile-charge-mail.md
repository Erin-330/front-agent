# Profile · Charge · Mail · Purchase 페이지

---

## `/profile` — 프로필 메인

### 파일
```
pages/profile/index.tsx
features/profile/
  api/profile.ts
  model/hooks/useProfile.ts
  ui/
    ProfileHeader/ProfileHeader.tsx
    ProfileUserCard/ProfileUserCard.tsx
    ProfileMenu/ProfileMenu.tsx, ProfileMenuRow.tsx
    ProfileGradeBorder.tsx
```

### 동작
1. `useProfile()` → `profileApi.getProfile()` → `GET /spark/profile`.
2. 로그인 무효 → `/login` 리다이렉트.
3. 매 마운트마다 `refetch()` (프로필 최신화).

### 레이아웃
```
<div className="relative h-full min-h-[100dvh] w-full bg-background">
  <ProfileHeader
    onClose={→ MAIN}
    onMailClick={→ MAIL}
    messageCount={profile.msgCnt}
  />
  <main className="flex h-[100dvh] flex-col overflow-y-auto px-4 pt-20">
    [로딩: <RiveLoading inline>]
    [완료]:
      <ProfileUserCard profile={...} />
      <hr />
      <ProfileMenu onSetPage={...} />
  </main>
  <footer>
    <hr />
    <RorrIcon />                       ← 브랜드 로고
  </footer>
</div>
```

### ProfileUserCard 표시 항목
| 필드 | 표시 |
|------|------|
| `picture` | 프로필 이미지 (원형) |
| `displayname` | 닉네임 |
| `email` | 이메일 |
| `gradeName` | 등급명 |
| `cash` | 에너지 잔액 |
| `exp` | 경험치 |

### ProfileMenu 메뉴 항목 → 경로
| 메뉴 | 경로 |
|------|------|
| 팔로우 설정 | `/follow/league-list` |
| 내 픽 히스토리 | `/streak/history` |
| 에너지 충전 | `/charge` |
| 구매 내역 | `/purchase-list` |
| 랭킹 | `/rank` |
| 로그아웃 | localStorage 토큰 제거 → `/login` |

---

## `/mail` — 메시지함

### 파일
```
pages/mail/index.tsx
features/mail/
  api/mailbox.ts
  model/hooks/useMessageList.ts, useMessageMutations.ts
  ui/
    MailHeader/
    MailList/
    MailListItem/
```

### 동작
1. `useMessageList(userId)` → `mailboxApi.getMsgList({ user_id, per_page:20, next_rown:0 })`.
2. 마운트 시 `mailboxApi.setMsgReadState({ user_id })` → 전체 읽음 처리.
3. 영상 메시지 클릭 → `mailboxApi.setMsgWatchState`.
4. 무한 스크롤: `next_rown`으로 페이지네이션.

### MailListItem 표시 항목
| 필드 | 표시 |
|------|------|
| `player_image` / `team_image` | 썸네일 |
| `player_nickname` | 선수명 |
| `title` | 제목 |
| `description` | 내용 미리보기 |
| `createdDate` | 날짜 |
| `readMsgYN === 'N'` | 미읽음 뱃지 |
| `videoURL` | 영상 재생 버튼 |
| `expired_date` | 만료 기간 |

### 레이아웃
```
<div className="flex flex-col h-[100dvh]">
  <MailHeader onClose={→ PROFILE} />
  <div className="flex-1 overflow-y-auto">
    <MailList>
      {messages.map → <MailListItem>}
    </MailList>
  </div>
</div>
```

---

## `/charge` — 에너지 충전

### 파일
```
pages/charge/index.tsx
pages/charge/toss/index.tsx              ← Toss 결제 페이지
features/charge/
  api/payment.ts
  lib/
    constants.ts                          ← 충전 패키지 목록
    payment-capabilities.ts              ← 결제 수단 가용 여부
    types.ts
  ui/
    ChargeContent/
    ChargeEnergyAmounts/
    ChargePaymentMethods/
    ChargeSubmitButton/
    TossKrwTemplate/
    PaymentVerifyContainer/
    PaymentVerifySuccess/
    PaymentVerifyFail/
```

### 충전 패키지 (constants.ts 기반)
에너지 단위로 구성된 고정 패키지 목록. 각 패키지:
```ts
{
  energyCount: number
  price: number         // KRW
  label: string
  isPopular?: boolean
}
```

### 결제 플로우 (Toss)
```
1. /charge: 패키지 선택
2. /payments/getTransactionID → transactionID 획득
3. /charge/toss: TossPayments SDK 로드 + 결제창 오픈
4. 성공 → /payment/verify?paymentKey=...&orderId=...&amount=...
5. /payment/verify: /payments/confirmPaymentByToss 호출
6. 성공 → 성공 화면 (에너지 증가량 표시)
7. 실패 → /payment/fail → /profile 리다이렉트
```

### /charge 레이아웃
```
<AppHeader left={CloseIcon → PROFILE} center="에너지 충전" />
<ChargeContent>
  <ChargeEnergyAmounts>           ← 패키지 선택 그리드
  <ChargePaymentMethods>          ← 결제 수단 선택 (현재 Toss만)
  <ChargeSubmitButton onClick={startPayment} />
</ChargeContent>
```

### /payment/verify 레이아웃
```
<PaymentVerifyContainer>
  [성공: <PaymentVerifySuccess energyAdded={data.energy}>]
  [실패: <PaymentVerifyFail message={...}>]
</PaymentVerifyContainer>
```

---

## `/purchase-list` — 구매 내역

### 파일
```
pages/purchase/list/index.tsx
features/purchase-list/
  api/depositHistory.ts
  lib/formatExpiredDate.ts, formatPayedDate.ts
  model/hooks/useUserDepositHistory.ts
  ui/
    PurchaseHistoryList/
    PurchaseListHeader/
    PurchaseListItem/
```

### 동작
1. `useUserDepositHistory(userId)` → `depositHistoryApi.getUserDepositHistory`.
2. `per_page: 20`, 무한 스크롤 (`next_rown: item.rown`).
3. 날짜 포맷: `formatPayedDate(payed_date)`, `formatExpiredDate(expired_date)`.

### PurchaseListItem 표시 항목
| 필드 | 표시 |
|------|------|
| `energyCount` | 충전 에너지 수 |
| `Amount` | 결제 금액 |
| `currency` | 통화 |
| `pgType` | 결제 수단 |
| `DepositType` | 충전 유형 |
| `payed_date` | 결제 일시 |
| `expired_date` | 에너지 만료일 |

### 레이아웃
```
<div className="flex flex-col h-[100dvh]">
  <PurchaseListHeader onClose={→ PROFILE} />
  <div className="flex-1 overflow-y-auto p-4">
    <PurchaseHistoryList>
      {items.map → <PurchaseListItem>}
    </PurchaseHistoryList>
  </div>
</div>
```
