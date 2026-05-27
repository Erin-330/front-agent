# Boost List · Boost Wall 페이지

---

## 라우트
| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/boost-list` | `BoostListUserPage` | 내가 보낸 부스트 히스토리 |
| `/boost-list/team` | `BoostListTeamPage` | 특정 팀 부스트 피드 |
| `/boost-list/player` | `BoostListPlayerPage` | 특정 선수 부스트 피드 |
| `/boost-wall` | `BoostWallPage` | 매치별 부스트 월 (팬 랭킹) |

---

## `/boost-list` — 내 부스트 히스토리

### 파일
```
pages/boost-list/user/index.tsx
features/schedule/model/hooks/useDonationHistoryByUserInfinite.ts
shared/ui/BoostHistoryMatchCard/
```

### 동작
1. `useDonationHistoryByUserInfinite(userId)` → `donationApi.getDonationHistoryByUser`.
2. 무한 스크롤 (per_page: 20, next_rown: 마지막 아이템의 rown).
3. 좋아요: `useSetFeedLike` → `feedLikeApi.setFeedLike`.
4. 각 카드 헤더 클릭 → 해당 팀/선수 부스트 리스트 이동.

### 레이아웃
```
<PageScrollLayout>
  <AppHeader left={BackIcon → PROFILE} center="내 부스트" />
  <div className="flex flex-col gap-3 p-4">
    {items.map →
      <BoostHistoryMatchCard
        item={item}
        onLikeClick={handleLike}
        pendingLikeTransactionCode={pendingCode}
      />
    }
    [sentinel: 무한 스크롤]
  </div>
</PageScrollLayout>
```

---

## `/boost-list/team` — 팀 부스트 피드

### Location State (TeamListPage → BoostListTeam 이동 시)
```ts
{
  targetId: string       // team_id
  targetType: 'team'
  teamInitial: string
  fromPage?: string
  fromPageState?: unknown
}
```

### 동작
1. `useDonationHistoryByTeamInfinite(teamId, userId)` → `donationApi.getDonationHistoryByTeam`.
2. 나머지는 `/boost-list`와 동일.

### 레이아웃
```
<AppHeader left={BackIcon → fromPage || MAIN} center={`${teamInitial} 부스트`} />
```

---

## `/boost-list/player` — 선수 부스트 피드

### Location State
```ts
{
  targetId: string       // player_id
  targetType: 'player'
  playerNickname: string
  fromPage?: string
  fromPageState?: unknown
}
```

### 동작
1. `useDonationHistoryByPlayerInfinite(playerId, userId)` → `donationApi.getDonationHistoryByPlayer`.
2. 나머지는 `/boost-list`와 동일.

---

## `/boost-wall` — 부스트 월

### 파일
```
pages/boost-wall/index.tsx
features/schedule/model/hooks/useBoostWall.ts
shared/ui/BoostWallConfetti/BoostWallConfettiRive.tsx
```

### Location State (스케줄 상세 → BoostWall 이동 시)
```ts
{
  match_id: string
}
```

### 동작
1. `useBoostWall(matchId)` → `donationApi.getBoostWall({ match_id })`.
2. `level1` / `level2` / `level3` 분리 표시 (등급별 팬 랭킹).
3. `<BoostWallConfettiRive>` — 진입 시 Rive 파티클 애니메이션.

### level 구조
```ts
{
  level1: BoostWallBoostInfo[]   // 최고 부스터
  level2: BoostWallBoostInfo[]
  level3: BoostWallBoostInfo[]
}

BoostWallBoostInfo = {
  UserID: string
  boost_level: string
  displayname: string
  totAmount: string     // 총 부스트 에너지 (문자열)
}
```

### 레이아웃
```
<div className="relative h-[100dvh] overflow-hidden">
  <BoostWallConfettiRive />              ← 배경 애니메이션
  <AppHeader left={BackIcon} center="부스트 월" />
  <div className="flex flex-col gap-6 p-4">
    <Level1Section users={level1} />    ← 1위 특별 표시
    <Level2Section users={level2} />
    <Level3Section users={level3} />
  </div>
</div>
```

---

## BoostHistoryMatchCard 컴포넌트 상세

### 상단 강조 바 색상 규칙
| 상황 | 색상 클래스 |
|------|------------|
| `isDetailPage === true` | `border-background` (숨김) |
| `leftTeamId == null` (유저/선수/팀 목록 페이지) | `border-boostEnergy4Icon` |
| `item.TeamID === leftTeamId` (상세 페이지 왼쪽 팀) | `border-teamColorLeft` |
| 반대 팀 | `border-teamColorRight` |

### 메시지 표시 규칙
| 조건 | 표시 |
|------|------|
| `privateYN === 'Y' || BlindYN === 'Y'` + 내 글 아님 | `'PRIVATE MESSAGE'` |
| `cheeringImage` 있음 | 이미지 + 텍스트 |
| `Comment` 있음 | 텍스트 |
| `Comment` 없음 + `GameID !== null` | 랜덤 GIF (emptyCommentGifList) |
| `Comment` 없음 + `GameID === null` | 랜덤 이미지 (emptyCommentImgList) |

### 헤더 클릭 네비게이션
- `PlayerID` 있음 → `PAGES.BOOST_LIST_PLAYER`
- `TeamID` 있음 → `PAGES.BOOST_LIST_TEAM`
