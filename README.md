# front-agent

Claude AI 기반 프론트 에이전트 서버.

## 실행

```bash
npm install
npm run dev        # 서버 + API 동시 실행
npm run dev:client # 정적 파일 서버만
npm run dev:api    # API 서버만
```

## 구성

- `src/server.ts` — 정적 파일 서빙 + 상태 API (포트 4001)
- `src/api.ts` — Claude AI 에이전트 API (포트 4002)
- `src/public/` — 프론트엔드 정적 파일
