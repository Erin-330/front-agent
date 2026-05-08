#!/bin/bash
TASK=$(aws ecs list-tasks --cluster mcp-agents-staging-cluster --service-name mcp-agents-front --region us-east-1 --query 'taskArns[0]' --output text | awk -F/ '{print $NF}')
echo "Connecting to task: $TASK"
aws ecs execute-command \
  --cluster mcp-agents-staging-cluster \
  --task "$TASK" \
  --container mcp-agents-front \
  --command "/bin/sh" \
  --interactive \
  --region us-east-1
