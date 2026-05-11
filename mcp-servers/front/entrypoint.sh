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

if [ -f "$CLAUDE_DIR/.credentials.json" ]; then
  inotifywait -m -e close_write "$CLAUDE_DIR/.credentials.json" 2>/dev/null | \
    while read; do
      aws ssm put-parameter \
        --name "$SSM_CREDS_PATH" \
        --value "$(cat "$CLAUDE_DIR/.credentials.json")" \
        --type SecureString --overwrite --region $REGION > /dev/null 2>&1 \
        && echo "Credentials synced to SSM."
    done &
  echo "Credentials watcher started."
fi

exec node /app/index.js
