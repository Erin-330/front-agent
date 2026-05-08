#!/bin/bash
# 컨테이너 안에서 실행: claude /login 후 이 스크립트 실행
SSM_CREDS_PATH="/mcp-agents-front/claude-credentials"
CLAUDE_DIR="/root/.claude"
REGION="us-east-1"

CREDS_FILE="$CLAUDE_DIR/.credentials.json"
if [ ! -f "$CREDS_FILE" ]; then
  echo "ERROR: $CREDS_FILE 파일이 없습니다. 먼저 claude /login을 실행하세요."
  exit 1
fi

aws ssm put-parameter \
  --name "$SSM_CREDS_PATH" \
  --value "$(cat "$CREDS_FILE")" \
  --type SecureString --overwrite --region $REGION > /dev/null

echo "Done! credentials 저장 완료: $SSM_CREDS_PATH"
