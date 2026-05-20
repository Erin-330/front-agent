# Testing

## 스택

- **Jest** 29.7 + **jsdom**
- **@testing-library/react**
- Setup: `src/test/setup.ts`
- CSS Modules: `identity-obj-proxy` 로 mock

## 설정 파일

`jest.config.ts`

## 테스트 파일 위치 규칙

```
**/__tests__/**/*.{ts,tsx}
**/*.{spec,test}.{ts,tsx}
```

## 명령어

```bash
yarn test                          # 전체 실행
yarn test:watch                    # watch 모드
yarn test:coverage                 # 커버리지 포함
yarn test src/path/to/file.test.ts # 단일 파일
```

## Git Hook (post-commit)

커밋 후 자동으로 Jest 전체 + 프로덕션 빌드 실행.  
빌드 실패 시 커밋 차단됨.

## 주의사항

- 타입 체크·테스트는 코드 정확성 검증용. UI 기능 정확성은 브라우저에서 직접 확인 필요.
- `tsconfig.app.json` 에서 테스트 파일 type-check 제외 (`exclude` 설정).
