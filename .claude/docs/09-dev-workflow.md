# 개발 워크플로우

## 명령어

```bash
# 개발 서버 (localhost:3009)
yarn dev              # development 모드
yarn dev:staging      # staging 모드

# 빌드
yarn build            # production
yarn build:staging    # staging
yarn build:develop    # development

# 품질 검사
yarn lint             # ESLint
yarn test             # Jest 전체
yarn test:watch       # watch 모드
yarn test:coverage    # 커버리지

# Storybook (localhost:6006)
yarn storybook

# Live2D vendor 설치
yarn install:vendor-live2d
```

## Git Hooks (Husky 9)

### Pre-commit

1. TypeScript 타입 체크: `tsc --noEmit`
2. lint-staged: 변경 파일에 ESLint + Prettier 적용

### Post-commit

1. Jest 전체 실행
2. Production 빌드
3. 빌드 실패 → 커밋 차단

## 코드 품질 설정

| 파일                 | 역할                                                    |
| -------------------- | ------------------------------------------------------- |
| `eslint.config.js`   | ESLint 규칙                                             |
| `.prettierrc.json`   | Prettier 포맷터                                         |
| `.lintstagedrc.json` | pre-commit 대상 파일 설정                               |
| `tsconfig.app.json`  | `strict`, `noUnusedLocals`, `noUnusedParameters` 활성화 |

## 환경 파일

```
.env.development
.env.staging
.env.production
```

## Claude 커스텀 커맨드

### `/ship [메시지]`

변경사항 commit + push. 메시지 없으면 자동 생성.

### `/shipr [메시지]`

`/ship` + `develop` 브랜치로 PR 자동 생성.

## 브랜치 전략

현재 브랜치 네이밍 패턴: `agent/YYYYMMDDHHSS-----<desc>---<techs>`  
PR target: `develop`
