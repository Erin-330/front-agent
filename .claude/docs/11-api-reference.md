# API Reference — 전체 엔드포인트 명세

베이스 URL: `VITE_BUL` 환경 변수.  
인증: `Authorization: Bearer <JWT>` (Axios 인터셉터 자동 첨부).  
공통 응답 필드: `resultCode: string`, `resultMsg: string`, `data?: ...`  
성공 코드: `API_SUCCESS_CODE` (shared/lib/constants).

---

## Auth

### POST `/users/login`
소셜 OAuth 로그인.

**Request**
```ts
{
  loginType?: 'OAuth'
  platformType: 'google' | 'apple' | 'kakao'   // SocialPlatform
  token: string          // OAuth 액세스/ID 토큰
  autoLogin?: boolean
}
```

**Response data**
```ts
{
  id: string
  email: string
  verified_email: boolean
  name: string
  picture: string
  jwt: string            // 이후 모든 요청에 사용
  boost: number
  given_name: string
  payments: {
    xsollaUseYN: string
    tossUseYN: string
  }
}
```

### POST `/msgboxes/getNewMsgCount`
미읽음 메시지 수 조회.

**Request** `{ user_id: string }`

**Response data** `Array<{ newMsgCnt: number }>`

### POST `/users/getUserBalance`
사용자 에너지(캐시) 잔액 조회.

**Request** `{ userid: string }`

**Response data** `{ cash: number }`

---

## Profile

### GET `/spark/profile`
현재 로그인 사용자 프로필.

**Response data**
```ts
{
  email: string
  displayname: string
  picture: string
  exp: number
  cash: string           // 에너지 잔액 (문자열)
  gradeId: number
  gradeName: string
  msgCnt: number         // 미읽음 메시지 수
}
```

---

## Follow

### GET `/follow/my`
내 팔로우 온보딩 여부 + 팀 목록.

**Response data**
```ts
{
  follow_onboarding_yn?: boolean
  teams?: Array<{ target_id: string }>
}
```

### GET `/follow/list`
팔로우 목록 조회.

**Query params**
```
follow_type: 'league' | 'team' | 'player'
limit?: number
offset?: number
```

**Response data**
```ts
{
  leagues?: FollowTargetItem[]
  teams?: FollowTargetItem[]
  players?: FollowTargetItem[]
}
```

**FollowTargetItem**
```ts
{
  idx: number | null
  target_id: string
  name: string
  slug: string
  image_url: string
  boostYN: 'Y' | 'N'
  team_id: string | null
  team_name: string | null
  team_image_url: string | null
  initial?: string | null     // 팀 약어
  first_name: string | null
  last_name: string | null
  fullName: string | null
  nickname: string | null     // 선수 표시명
  created_date: string | null
  updated_date: string | null
  display_order: number | null
  follow_yn: boolean
}
```

### PUT `/follow`
팔로우 일괄 제출 (league · team · player 한 번에).

**Request**
```ts
{
  league: Array<{ target_id: string }>
  team:   Array<{ target_id: string }>
  player: Array<{ target_id: string }>
}
```

**Response data**
```ts
{
  success?: boolean
  message?: string
  follow_onboarding_yn?: boolean
  league?: { success?:boolean; total?:number; created?:number; updated?:number; deleted?:number }
  team?:   { ... }
  player?: { ... }
}
```

### GET `/search`
팔로우 검색.

**Query params**
```
q: string
searchType: 'league' | 'team' | 'player'
```

**Response data** — `{ leagues?: SearchApiItem[] }` or `{ teams?: ... }` or `{ players?: ... }`

---

## Schedule (Matches)

### POST `/schedules/getAllMatchesForLoL`
경기 일정 목록 (양방향 페이지네이션).

**Request**
```ts
{
  direction: 'standard' | 'forward' | 'backward'
  league_id: string      // localStorage 'LoL_leagueS' 키 또는 기본값 'LoL_OF_98767991310872058'
  next_rown: number      // 0 → 기준점 없음 (최신 기준)
  per_page: number       // 기본 20
  prev_rown: number
}
```

**Response data** `ScheduleMatchDto[]`

**ScheduleMatchDto**
```ts
{
  match_id: string
  name: string
  status: string         // 'completed' | 'running' | 'not_started' | ...
  begin_date: string | null
  end_date: string | null
  rown: number
  number_of_games: unknown
  leagues: {
    league_id: string
    league_name: string
    image_url: string
  }
  teams: Array<{
    team_id: string
    team_name: string
    initial: string       // 팀 약어
    image_url: string
    score: number
    boostYN: string
  }>
  series: {
    serie_id: string
    serie_name: string
    begin_date: string
    end_date: string
  }
  tournaments: {
    tournament_id: string
    tournament_name: string
    begin_date: string
    end_date: string
  }
  donationInfo: Array<{
    target_id: string
    target_name: string
    target_type: 'player' | 'team'
    team_id: string
    totAmout: number
    image_url?: string
    lol_role?: string
  }>
}
```

### POST `/schedules/getLeaguesForLoL`
리그 목록 조회.

**Request** `{}`

**Response data** `LeagueForLoLDto[]`
```ts
{
  league_id: string
  name: string
  slug: string
  image_url: string
  sports_type: string
  created_date: string
  updated_date: string
  digest: string
}
```

### GET `/event`
매치 이벤트 목록 (페이지네이션).

**Query params**
```
match_id: string
page?: number
per_page?: number
```

**Response data**
```ts
{
  events: Array<{
    idx: number
    match_id: string
    game_id: string
    game_number: string
    created_date: string
    summary: string
    items: Array<{
      team_id: string
      team_name: string
      llm_msg: string
      expression: string
      actions: string
    }>
  }>
  page: string
  per_page: string
  total: string
}
```

---

## Teams

### POST `/teams/getTeams`
팀 + 소속 선수 목록 조회.

**Request** `{ team_id: string }`

**Response data** `GetTeamsTeamDto[]`
```ts
{
  team_id: string
  name: string
  slug: string
  initial: string
  location: string
  image_url: string
  boostYN: 'Y' | 'N'
  players: Array<{
    player_id: string
    nickname: string
    first_name: string
    last_name: string
    lol_role: string
    image_url: string
    age: string
    birthday: string
    nationality: string[]
    slug: string
    status: string
  }>
}
```

---

## Boost (Donation)

### POST `/uploader/getOnetimeURL`
이미지 업로드용 Presigned URL 발급.

**Request**
```ts
{
  userid: string
  filename: string
  fileType: string    // MIME type e.g. 'image/jpeg'
}
```

**Response data** `{ url: string; key: string }`
> `url`은 PUT 요청으로 파일 직접 업로드, `key`는 이후 부스트 생성 시 `cheeringImage`에 사용.

### POST `/donation/setBoostPlayerForSchedules`
부스트(도네이션) 생성.

**Request**
```ts
{
  userid: string
  amount?: number
  targetid?: string
  matchid?: string
  comment?: string
  targetType?: 'team' | 'player' | ''
  privateYN?: 'Y' | 'N'
  gameid?: string
  cheeringImage?: string   // S3 key
}
```

### POST `/donation/getDonationHistoryByMatch`
매치별 부스트 피드.

**Request**
```ts
{
  matchid: string
  next_rown: number
  per_page: number
  userid: string
}
```

**Response data** `BoostDonationFeedItem[]` (또는 `{ list: BoostDonationFeedItem[] }`)

### POST `/donation/getDonationHistoryByTeam`
팀별 부스트 히스토리.

**Request** `{ teamid: string; next_rown: number; per_page: number; userid: string }`

### POST `/donation/getDonationHistoryByPlayer`
선수별 부스트 히스토리.

**Request** `{ playerid: string; next_rown: number; per_page: number; userid: string }`

### POST `/donation/getDonationHistoryByUser`
유저별 부스트 히스토리.

**Request** `{ next_rown: number; per_page: number; userid: string }`

### POST `/donation/getBoostWall`
부스트 월 (팬 랭킹).

**Request** `{ match_id: string }`

**Response data**
```ts
{
  level1: Array<{ UserID:string; boost_level:string; displayname:string; totAmount:string }>
  level2: Array<{ ... }>
  level3: Array<{ ... }>
}
```

**BoostDonationFeedItem**
```ts
{
  Amount: number
  Comment: string
  PlayerImage: string
  PlayerNickname: string
  UserID: string
  UserName: string
  UserImage: string
  donationDate: string
  player_id: string
  team_id: string
  tranIDX: number
  TargetID: string
  TargetType: 'team' | 'player'
  BlindYN: 'Y' | 'N'
  rown: number
  privateYN: 'Y' | 'N'
  cheeringImage: string
  GameID: string
  LeagueID: string
  MatchID: string
  PlayerFirstName: string
  PlayerID: string
  PlayerLastName: string
  SeriesID: string
  StageID: string
  TeamID: string
  TeamImage: string
  TransactionCode: string
  feedLikeCount: number
  TeamInitial: string
  FeedLikeYN: 'Y' | 'N'
  LeagueName: string
  MatchDate: string
  MatchName: string
}
```

### POST `/mainfeed/setFeedLike`
부스트 피드 좋아요 토글.

**Request** `{ TransactionCode: string; user_id: string }`

---

## Quiz

### PUT `/quiz/answer`
퀴즈 정답 제출 또는 취소.

**제출 Request**
```ts
{
  match_id: string
  selected_team_id: string
  game_id?: string
}
```

**취소 Request**
```ts
{
  match_id: string
  action: 'cancel'
}
```

**Response data (제출)**
```ts
{
  match_id: string
  game_id: string
  selected_team_id: string
  updated: boolean
  created: boolean
  spark_granted: string
}
```

### GET `/quiz/calendar`
월별 스트릭 캘린더.

**Query params**
```
year: number
month: number
today?: string   // YYYY-MM-DD
```

**Response data**
```ts
{
  year: number
  month: number
  period_value: string
  calendar: Array<{
    date: string
    day: number
    has_activity?: boolean
    current_win_streak?: number
    current_lose_streak?: number
    longest_win_streak?: number
    longest_lose_streak?: number
    current_streak_type?: 'win' | 'lose' | 'none'
    display_text?: string | null
    had_loss_today?: boolean
    streak_continues_from_previous_day?: boolean
    streak_continues_to_next_day?: boolean
    had_game_scheduled?: boolean
    previous_streak?: boolean
    streak_continues_through?: boolean
  }>
  monthly_streak: {
    current_win_streak: number
    longest_win_streak: number
    current_lose_streak: number
    longest_lose_streak: number
    current_streak_type: 'win' | 'lose' | 'none'
  }
}
```

### GET `/quiz/my-picks`
내 픽 히스토리 (페이지네이션).

**Query params**
```
limit: number
offset: number
userid?: number
period_value?: string    // YYYY-MM-DD
period_month?: string    // YYYY-MM
```

**Response data**
```ts
{
  picks: Array<{
    idx: number
    match_id: string
    game_id: string | null
    game_number: string | null
    begin_date: string | Date
    selected_team_id: string | null
    pass: boolean
    teams: Array<{ team_id:string; team_initial:string; team_logo:string }>
    scores: [number, number]
    is_correct: boolean
    answered_at: string
    verified_at: string
    question_text: string
    question_type: string
    status: string
    verified: boolean
  }>
  total: number
  limit: number
  offset: number
}
```

---

## Mailbox

### POST `/msgboxes/getMsgList`
메시지 목록 (무한 스크롤).

**Request** `{ user_id: string; per_page: number; next_rown: number }`

**Response data** `MessageItem[]`
```ts
{
  msg_id: string
  user_id?: string
  title?: string
  description?: string
  createdDate?: string
  updatedDate?: string
  expired_date?: string
  videoURL?: string
  width?: number
  hight?: number
  playerid?: string
  teamid?: string
  player_firstname?: string
  player_lastname?: string
  player_nickname?: string
  player_image?: string
  team_image?: string
  coach_image?: string
  readMsgYN?: 'N' | 'Y'
  readMsgDate?: string
  watchVideoYN?: 'N' | 'Y'
  watchedVideoDate?: string
  rown?: number
}
```

### POST `/msgboxes/setMsgReadState`
전체 메시지 읽음 처리.

**Request** `{ user_id: string }`

### POST `/msgboxes/setMsgWatchState`
특정 메시지 영상 시청 처리.

**Request** `{ user_id: string; msg_id: string }`

---

## Ranking

### GET `/ranking/monthly`
월간 랭킹 조회.

**Query params**
```
period_value: string   // 조회할 기간 식별자 (available-periods 에서 획득)
page?: number
limit?: number
```

**Response data**
```ts
{
  period_value: string
  my_grade?: string
  my_gradeId?: number
  my_currentStreak?: number | string
  my_longest_win_streak?: number | string
  my_rank?: number | string
  my_userName?: string
  my_picture?: string
  my_userid?: string
  rankings: Array<{
    rank: number | string
    userid?: string
    userName: string
    picture?: string
    gradeId?: number
    grade: string
    gradeName?: string
    currentStreak: number | string
    longest_win_streak: number | string
    isMe?: boolean
    expected_reward?: number
  }>
  total?: number
  page?: number
  limit?: number
  total_pages?: number
}
```

### GET `/ranking/monthly/available-periods`
랭킹 조회 가능 기간 목록.

**Response data** `{ period_values: string[] }`

---

## Payments (Charge)

### POST `/payments/getTransactionID`
Toss 결제 트랜잭션 ID 발급.

**Request**
```ts
{
  userid: string
  appCode: string
  platform?: string
  channel?: string
}
```

**Response data** `{ transactionID: string } | null`

### POST `/payments/confirmPaymentByToss`
Toss 결제 확인.

**Request**
```ts
{
  orderId: string
  amount: string
  paymentKey: string
  userid: string
}
```

**Response data** `{ energy?: number }`

---

## Purchase History

### POST `/users/getUserDepositHistory`
에너지 충전 내역.

**Request** `{ next_rown: number; per_page: number; userid: string }`

**Response data** `UserDepositHistoryItem[]`
```ts
{
  Amount: number
  DepositType: string
  TransactionCode: string
  UserID: string
  currency: string
  energyCount: number
  expired_date: string
  payed_date: string
  pgType: string
  rown: number
}
```

---

## WebSocket

**URL 패턴**: `{VITE_LOL_WS_BASE_URL}?channelId={channelId}&type={clientType}&userId={userId}`

`clientType`: `'web'` (웹앱), `'overlay'` (영상 오버레이), `'side'` (사이드패널)

**메시지 CMD 번호**
| CMD | 의미 |
|-----|------|
| 39 | LIVE_START |
| 41 | LIVE_END |
| 50 | LIVE_QUIZ_START |
| 53 | SCHEDULE_QUIZ_START |
| 60 | LIVE_EVENT_LLM |

**CMD 50 — LiveQuizPayload**
```ts
{
  cmd: 50
  event: 'live_quiz_started'
  current_streak_display: string
  match_id: string
  game_id: string
  live_quiz_open: boolean
  opened_at: number
  matchInfo: {
    name: string
    match_id: string
    status: string
    begin_date: string
    end_date: string | null
    leagues: { league_id:string; league_name:string; image_url:string }
    teams: Array<{
      team_id: string; team_name: string; initial: string
      image_url: string; score: number; boostYN: string
      players: Array<{ player_id:string; nickname:string; lol_role:string; image_url:string; like_Score:number; ... }>
    }>
    ...
  }
}
```

**CMD 60 — LiveEventLlmSocketPayload**
```ts
{
  cmd: 60
  match_id: string
  game_id: string
  game_number: string
  summary: string
  team1_llm: { team_id:string; team_name:string; llm_msg:string; expression:string; actions:string }
  team2_llm: { ... }
  team_other_llm: { ... }
}
```
