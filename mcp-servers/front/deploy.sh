#!/bin/bash
set -e

# Ensure common install locations are on PATH
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

ECR_URI="239460481239.dkr.ecr.us-east-1.amazonaws.com/mcp-agents-front"
CLUSTER="mcp-agents-staging-cluster"
SERVICE="mcp-agents-front"
REGION="us-east-1"

echo "🔨 Building amd64 image and pushing to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI
docker buildx build --platform linux/amd64 -t $ECR_URI:latest --push .

echo "🚀 Deploying to ECS..."
aws ecs update-service --cluster $CLUSTER --service $SERVICE --force-new-deployment --region $REGION > /dev/null

echo "⏳ Waiting for deployment to stabilize..."
aws ecs wait services-stable --cluster $CLUSTER --services $SERVICE --region $REGION

echo "✅ Deploy complete!"
echo "   URL: http://mcp-agents-staging-alb-249976027.us-east-1.elb.amazonaws.com:5004/health"
