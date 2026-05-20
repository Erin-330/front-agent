# Boost 페이지 — 부스트 생성 3단계 플로우

## 라우트
| 경로 | 컴포넌트 | 단계 |
|------|----------|------|
| `/boost` | Navigate → `/boost/select` | — |
| `/boost/select` | `BoostCreateSelectPage` | 1단계: 팀/선수 선택 |
| `/boost/message` | `BoostCreateMessagePage` | 2단계: 메시지·수량·이미지 |
| `/boost/confirm` | `BoostCreateConfirmPage` | 3단계: 최종 확인 + 전송 |

## 진입점
`/schedule/detail` 헤더의 부스트 버튼 → `/boost/select`로 이동 (location state 전달).

---

## 공통: Location State 전달 구조

3단계 모두 React Router `location.state`로 데이터 전달.

**최초 진입 state** (`BoostLocationState`)
```ts
{
  match_id: string
  teams: ScheduleMatchTeamDto[]
  donationInfo?: ScheduleMatchDonationInfoDto[]
}
```

**플로우 누적 state** (`BoostFlowState`)
```ts
{
  match_id: string
  teams: ScheduleMatchTeamDto[]
  donationInfo?: ScheduleMatchDonationInfoDto[]
  status?: string
  leagues?: ScheduleMatchLeagueDto
  begin_date?: string | null
  // 1단계 → 이후
  target?: {
    target_id: string
    target_name: string
    target_type: 'player' | 'team'
    team_id: string
  } | null
  // 2단계 → 이후
  message?: string
  quantity?: number
  image?: File | null
  imagePreviewUrl?: string | null
  imageRotationDeg?: 0 | 90 | 180 | 270
}
```

---

## 1단계: `/boost/select` — 팀·선수 선택

### 파일
```
pages/boost/select/index.tsx
features/boost/
  api/getTeams.ts
  model/hooks/useGetTeams.ts
  lib/buildTargetOptions.ts
  ui/Step1TeamPlayer.tsx
```

### 동작
1. `location.state.teams`에서 팀 목록 획득.
2. `useGetTeams(team_id)` → `getTeamsApi.getTeams({ team_id })` (양 팀 각각 호출).
3. 팀 카드 + 소속 선수 카드 렌더.
4. 선택 → `target` 세팅 후 `/boost/message`로 navigate.

### `buildTargetOptions` 반환 구조
```ts
Array<{
  target_id: string
  target_name: string
  target_type: 'team' | 'player'
  team_id: string
  image_url: string
  lol_role?: string
}>
```

### 레이아웃
```
<AppHeader left={BackIcon} center="부스트 대상 선택" />
<div className="flex flex-col gap-4 p-4">
  {양 팀 각각}:
    팀 선택 버튼
    선수 목록 (role별 그리드)
</div>
<button disabled={!target} onClick={goToStep2}>다음</button>
```

---

## 2단계: `/boost/message` — 메시지·수량·이미지

### 파일
```
pages/boost/message/index.tsx
features/boost/ui/Step2MessageQuantityImage.tsx
features/boost/api/getOnetimeUrl.ts
features/boost/lib/getRotatedImageAsBlob.ts
features/boost/lib/uploadToPresignedUrl.ts
```

### 동작
1. 메시지 텍스트 입력 (선택).
2. 에너지 수량 입력.
3. 이미지 첨부 (선택): 갤러리 또는 카메라.
   - `getOnetimeUrlApi.getOnetimeURL` → Presigned URL 발급.
   - `uploadToPresignedUrl` → PUT 직접 업로드.
   - `getRotatedImageAsBlob` → 이미지 회전 처리.
4. privateYN 토글 (비공개 여부).
5. 다음 → `/boost/confirm`으로 누적 state 전달.

### 이미지 업로드 흐름
```
1. 사용자가 이미지 파일 선택
2. POST /uploader/getOnetimeURL → { url, key }
3. PUT {url} (binary) → S3 직접 업로드
4. key를 BoostFlowState.cheeringImage로 저장
```

### 레이아웃
```
<AppHeader left={BackIcon} center="메시지 작성" />
<div className="flex flex-col gap-4 p-4">
  <textarea placeholder="응원 메시지 입력" maxLength={200} />
  <EnergyAmountInput />     ← 수량 ±1 버튼 + 직접 입력
  <ImageUploadButton />     ← 이미지 첨부 (선택)
  [imagePreview + 회전 버튼]
  <ToggleSwitch label="비공개" />
</div>
<button onClick={goToStep3}>다음</button>
```

---

## 3단계: `/boost/confirm` — 최종 확인

### 파일
```
pages/boost/confirm/index.tsx
features/boost/
  ui/Step3Confirm.tsx
  api/setBoostPlayerForSchedules.ts
  lib/flowStateToFormState.ts
```

### 동작
1. 이전 단계 state 전체 표시 (대상, 메시지, 수량, 이미지 미리보기).
2. 확인 버튼 → `setBoostPlayerForSchedulesApi.setBoostPlayerForSchedules` 호출.
3. 성공 → `transitionStore.setSubmitRiveVisible(true)` → Rive 전환 오버레이 → `/schedule/detail` 복귀.
4. 에러 → 모달 표시.

### API 요청 구성
```ts
{
  userid: currentUserId,
  amount: flowState.quantity,
  targetid: flowState.target.target_id,
  matchid: flowState.match_id,
  comment: flowState.message,
  targetType: flowState.target.target_type,
  privateYN: flowState.privateYN ? 'Y' : 'N',
  cheeringImage: flowState.image ? uploadedKey : undefined,
}
```

### 레이아웃
```
<AppHeader left={BackIcon} center="부스트 확인" />
<div className="flex flex-col gap-4 p-4">
  <TargetCard />             ← 선택한 팀/선수
  <MessageCard />            ← 메시지 텍스트
  [cheeringImage 미리보기]
  <EnergyAmountDisplay />    ← 수량 확인
  <PrivacyIndicator />
</div>
<button onClick={handleSubmit}>부스트 보내기</button>
```

---

## 에너지 수량 규칙

- 최소: 1, 최대: 보유 에너지 잔액
- 사용자 잔액: `authApi.getUserBalance` 또는 프로필의 `cash`

---

## 에러 처리

| 상황 | 처리 |
|------|------|
| 에너지 부족 | 모달 → 충전 페이지(`/charge`) 이동 |
| 업로드 실패 | 이미지 없이 재시도 또는 에러 모달 |
| API 에러 | `showModal` 전역 모달 표시 |
