#!/bin/sh
set -e

SSM_CREDS_PATH="/mcp-agents-front/claude-credentials"
CLAUDE_DIR="/root/.claude"
REGION="us-east-1"

# Restore claude credentials from SSM
mkdir -p "$CLAUDE_DIR"
CREDS=$(aws ssm get-parameter --name "$SSM_CREDS_PATH" --with-decryption --region $REGION \
  --query 'Parameter.Value' --output text 2>/dev/null || true)

if [ -n "$CREDS" ]; then
  echo "$CREDS" > "$CLAUDE_DIR/.credentials.json"
  echo "Claude credentials restored from SSM."
else
  echo "No credentials found in SSM."
fi

exec node /app/index.js
