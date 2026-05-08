#!/bin/sh
# ECS Exec 쉘에서 source해서 실행: . /app/setup-env.sh
# claude /login 후 /app/ecs-backup-auth.sh 실행

export HOME=/root
echo "HOME=$HOME"
echo ""
echo "이제 아래 순서로 실행:"
echo "  1. claude /login"
echo "  2. /app/ecs-backup-auth.sh"
