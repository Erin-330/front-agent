#!/bin/bash
set -e

export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

ECR_URI="239460481239.dkr.ecr.us-east-1.amazonaws.com/mcp-agents-front"
CLUSTER="mcp-agents-staging-cluster"
SERVICE="mcp-agents-web"
TASK_FAMILY="mcp-agents-web"
REGION="us-east-1"

echo "🔨 Building amd64 image from front and pushing to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI
docker buildx build --platform linux/amd64 -t $ECR_URI:latest --push "$SCRIPT_DIR/../front"

echo "📝 Registering task definition (family: $TASK_FAMILY)..."
ENV_JSON=$(grep -v '^#' "$SCRIPT_DIR/.env" | grep '=' | while IFS='=' read -r key value; do
  jq -n --arg name "$key" --arg value "$value" '{"name": $name, "value": $value}'
done | jq -s '.')

CURRENT_TASK_DEF=$(aws ecs describe-services \
  --cluster $CLUSTER --services $SERVICE --region $REGION \
  --query 'services[0].taskDefinition' --output text)

NEW_TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition $CURRENT_TASK_DEF --region $REGION \
  --query 'taskDefinition' --output json | \
  jq 'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)' | \
  jq --argjson envJson "$ENV_JSON" --arg family "$TASK_FAMILY" '
    .family = $family |
    .containerDefinitions[0].environment = $envJson
  ')

NEW_TASK_DEF_ARN=$(aws ecs register-task-definition \
  --region $REGION \
  --cli-input-json "$NEW_TASK_DEF" \
  --query 'taskDefinition.taskDefinitionArn' --output text)

echo "🚀 Deploying web to ECS..."
aws ecs update-service \
  --cluster $CLUSTER --service $SERVICE \
  --task-definition $NEW_TASK_DEF_ARN \
  --region $REGION > /dev/null

echo "⏳ Waiting for deployment to stabilize..."
aws ecs wait services-stable --cluster $CLUSTER --services $SERVICE --region $REGION

echo "✅ Deploy complete! (Service: $SERVICE, Task: $TASK_FAMILY)"
