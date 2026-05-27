# 메인 페이지 — 채팅 + 라이브 퀴즈 + 이벤트

## 라우트
`/` — 인증 가드: `isAuthValid()` 실패 시 `/login` 리다이렉트.

## 목적
실시간 채팅 허브. WebSocket으로 라이브 퀴즈·이벤트를 수신하고, OpenAI GPT-4o-mini를 통한 AI 채팅을 제공.

---

## 파일 구조
```
pages/main/index.tsx           → MainPage (소켓 초기화 + ChatPage 렌더)
features/chat/
  api/chatService.ts           → OpenAI 채팅 API 클라이언트
  lib/mapLlmEventCleanDataToBinding.ts
  model/hooks/useLiveEventWindow.ts
  model/types.ts
  ui/
    ChatPage.tsx               → 전체 레이아웃
    ChatInput.tsx              → 입력창
    ChatMessage.tsx            → 메시지 버블
    ChatSettingsModal.tsx      → API 키 설정 모달
    ScheduleQuizToast.tsx      → 스케줄 퀴즈 배너
    StreakWindowEvent.tsx       → LLM 이벤트 윈도우
    StreakWindowQuiz.tsx        → 라이브 퀴즈 윈도우
```

---

## MainPage 동작

```tsx
// pages/main/index.tsx
export const MainPage = () => {
  const user = useStore((s) => s.user)

  useEffect(() => {
    const userId = getUserIdFromToken()
    if (!userId) return
    const state = LoLSocket.getConnectionState()
    if (state !== 'connected' && state !== 'connecting') {
      LoLSocket.installSocket(getLolWsUrl(lolWsBaseUrl, DEFAULT_CHANNEL_ID, 'web', userId))
      LoLSocket.ConnectSocket((data) => handleSocketMessage(data))
    }
  }, [user?.id])

  return <ChatPage />
}
```

- 소켓은 싱글톤 (`LoLSocket`). 이미 연결된 경우 재연결 방지.
- `handleSocketMessage`가 CMD별 Zustand 스토어 업데이트 처리.

---

## WebSocket 이벤트 흐름

| CMD | 처리 |
|-----|------|
| 39 LIVE_START | — |
| 41 LIVE_END | — |
| 50 LIVE_QUIZ_START | `liveQuizStore.setLiveQuiz(payload)` → `StreakWindowQuiz` 표시 |
| 53 SCHEDULE_QUIZ_START | `scheduleQuizBannerStore` 업데이트 → `ScheduleQuizToast` 표시 |
| 60 LIVE_EVENT_LLM | `liveEventStore` 업데이트 → `StreakWindowEvent` 표시 |

---

## AI 채팅 (ChatInput / ChatMessage)

- `createChatService(apiKey)` 팩토리로 서비스 인스턴스 생성.
- API 키: `VITE_OPENAI_API_KEY` 환경변수 또는 `ChatSettingsModal`에서 직접 입력.
- 모델: `gpt-4o-mini`, `max_tokens: 1024`.
- 에러 코드 처리: `insufficient_quota`, `invalid_api_key`, HTTP 429.

---

## 라이브 퀴즈 창 (`StreakWindowQuiz`)

- `useLiveQuizStore`에서 `payload` 수신.
- 양 팀 버튼 표시 → 선택 시 `quizAnswerApi.submitAnswer` 호출.
- 취소: `quizAnswerApi.cancelAnswer`.
- 퀴즈 종료: `liveQuizStore.clearLiveQuiz()`.

## LLM 이벤트 창 (`StreakWindowEvent`)

- `useLiveEventStore`에서 수신.
- LLM 메시지 + 팀별 expression·actions 표시.
- Live2D 캐릭터와 연동 (expression/action 전달).

## 스케줄 퀴즈 배너 (`ScheduleQuizToast`)

- `useScheduleQuizBannerStore` 구독.
- 배너 탭 → 해당 매치 `/schedule/detail` 이동.

---

## Zustand 스토어

| 스토어 | 파일 | 역할 |
|--------|------|------|
| `liveQuizStore` | shared/lib/zustand/liveQuizStore.ts | `payload: LiveQuizPayload \| null` |
| `liveEventStore` | shared/lib/zustand/liveEventStore.ts | LLM 이벤트 데이터 |
| `scheduleQuizBannerStore` | shared/lib/zustand/scheduleQuizBannerStore.ts | 스케줄 퀴즈 배너 상태 |
| `transitionStore` | shared/lib/zustand/transitionStore.ts | 페이지 전환 Rive 오버레이 |

---

## 레이아웃 구조

```
<div className="relative min-h-dvh">          ← AppRouter 루트
  <ChatPage>
    <AppHeader />                              ← 상단 헤더 (프로필 아이콘, 에너지, 메시지 수)
    <div className="flex-1 overflow-y-auto">  ← 채팅 메시지 스크롤 영역
      <ChatMessage /> * n
    </div>
    <ScheduleQuizToast />                      ← 스케줄 퀴즈 배너 (conditional)
    <StreakWindowEvent />                       ← LLM 이벤트 창 (conditional)
    <StreakWindowQuiz />                        ← 라이브 퀴즈 창 (conditional)
    <ChatInput />                              ← 하단 고정 입력창
  </ChatPage>
  <RiveLoading overlayPosition="absolute" />   ← 페이지 전환 오버레이 (conditional)
</div>
```
