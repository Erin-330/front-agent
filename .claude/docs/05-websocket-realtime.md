# WebSocket & 실시간 기능

## LoLSocket 싱글톤

위치: `shared/lib/socket/`

```
socket/
├── createSocket.ts         CreateSocket 클래스 정의
├── connectSocket.ts        LoLSocket 싱글톤 export
├── handleSocketMessage.ts  메시지 파싱·라우팅
├── handleLiveEventLlmExpressionActions.ts
├── constants.ts
├── types.ts
└── index.ts
```

- **연결**: `VITE_LOL_WS_BASE_URL` 환경변수 사용
- **파괴 시점**: 401 응답 또는 로그아웃 시 자동 종료

## 실시간 상태 Zustand 연동

| 스토어           | 역할                           |
| ---------------- | ------------------------------ |
| `liveQuizStore`  | 실시간 퀴즈 데이터 수신 상태   |
| `liveEventStore` | 실시간 이벤트 (골, 킬 등) 상태 |

WebSocket 메시지 수신 → `handleSocketMessage.ts` 파싱 → Zustand 스토어 업데이트

## Chat Feature

위치: `features/chat/`

```
chat/
├── api/chatService.ts               채팅 REST API
├── model/hooks/useLiveEventWindow.ts 이벤트 윈도우 제어
├── model/types.ts
├── ui/
│   ├── ChatPage.tsx
│   ├── ChatInput.tsx
│   ├── ChatMessage.tsx
│   ├── ChatSettingsModal.tsx
│   ├── ScheduleQuizToast.tsx
│   ├── StreakWindowEvent.tsx         경기 이벤트 오버레이
│   └── StreakWindowQuiz.tsx          퀴즈 오버레이
└── lib/mapLlmEventCleanDataToBinding.ts
```

메인 페이지(`pages/main/`)에서 Chat + WebSocket 통합 사용.

## LLM 이벤트 처리

`chat/lib/mapLlmEventCleanDataToBinding.ts` — LLM이 가공한 실시간 이벤트 데이터를 UI 바인딩 형태로 변환
