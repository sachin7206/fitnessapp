#!/bin/bash
# ============================================================
# FitnessApp - Build Docker Images & Push to AWS ECR
# Run this from your LOCAL machine (project root)
# ============================================================
set -e

export AWS_PROFILE="${AWS_PROFILE:-personal}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
else
    echo "❌ aws/.env not found! Copy aws/.env.example to aws/.env and fill in values."
    exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"
REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "============================================"
echo "  Building & Pushing Docker Images to ECR"
echo "  Registry: $REGISTRY"
echo "============================================"
echo ""

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin $REGISTRY
echo ""

# Services with their Dockerfiles (all built from project root context)
declare -a SERVICES=(
    "api-gateway"
    "user-service"
    "nutrition-service"
    "exercise-service"
    "progress-service"
    "wellness-service"
    "ai-service"
    "subscription-service"
    "payment-service"
)

cd "$PROJECT_DIR"

TOTAL=${#SERVICES[@]}
COUNT=0

for svc in "${SERVICES[@]}"; do
    COUNT=$((COUNT + 1))
    echo "[$COUNT/$TOTAL] Building $svc..."

    # Build Docker image (multi-stage build from project root)
    docker build \
        -f "$svc/Dockerfile" \
        -t "fitnessapp/$svc:latest" \
        --platform linux/amd64 \
        .

    # Tag for ECR
    docker tag "fitnessapp/$svc:latest" "$REGISTRY/fitnessapp/$svc:latest"

    # Push to ECR
    echo "   Pushing $svc to ECR..."
    docker push "$REGISTRY/fitnessapp/$svc:latest"

    echo "   ✅ $svc done!"
    echo ""
done

echo "============================================"
echo "  ✅ All $TOTAL images pushed to ECR!"
echo "============================================"
echo ""
echo "  Next: Run ./aws/deploy.sh to deploy to EC2"

