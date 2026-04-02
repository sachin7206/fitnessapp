#!/bin/bash
# ============================================================
# FitnessApp - Deploy to EC2 Instance
# Run this from your LOCAL machine
# Copies compose file to EC2 and starts all services
# ============================================================
set -e

export AWS_PROFILE="${AWS_PROFILE:-personal}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load environment variables
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
else
    echo "❌ aws/.env not found! Copy aws/.env.example to aws/.env and fill in values."
    exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"
EC2_KEY="${EC2_KEY:-$HOME/.ssh/fitnessapp-key.pem}"
REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Get EC2 public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=fitnessapp-server" "Name=instance-state-name,Values=running" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text --region $AWS_REGION)

if [ "$PUBLIC_IP" == "None" ] || [ -z "$PUBLIC_IP" ]; then
    echo "❌ No running EC2 instance found with tag 'fitnessapp-server'"
    exit 1
fi

echo "============================================"
echo "  Deploying FitnessApp to EC2"
echo "  Server: $PUBLIC_IP"
echo "============================================"
echo ""

SSH_CMD="ssh -i $EC2_KEY -o StrictHostKeyChecking=no ec2-user@$PUBLIC_IP"
SCP_CMD="scp -i $EC2_KEY -o StrictHostKeyChecking=no"

# Step 1: Copy files to EC2
echo "📁 Copying deployment files to EC2..."
$SCP_CMD "$SCRIPT_DIR/docker-compose.prod.yml" "ec2-user@$PUBLIC_IP:~/fitnessapp/docker-compose.yml"
$SCP_CMD "$SCRIPT_DIR/.env" "ec2-user@$PUBLIC_IP:~/fitnessapp/.env"

# Step 2: Create database init script on EC2
echo "🗃️  Creating database init script..."
$SSH_CMD << REMOTE_SCRIPT
cat > ~/fitnessapp/init-databases.sql << 'SQL'
CREATE DATABASE IF NOT EXISTS fitnessapp_users;
CREATE DATABASE IF NOT EXISTS fitnessapp_nutrition;
CREATE DATABASE IF NOT EXISTS fitnessapp_exercises;
CREATE DATABASE IF NOT EXISTS fitnessapp_progress;
CREATE DATABASE IF NOT EXISTS fitnessapp_wellness;
CREATE DATABASE IF NOT EXISTS fitnessapp_subscriptions;
CREATE DATABASE IF NOT EXISTS fitnessapp_payments;
SQL
REMOTE_SCRIPT

# Step 3: Initialize databases on RDS
echo "🗄️  Initializing databases on RDS..."
$SSH_CMD << REMOTE_SCRIPT
if command -v mysql &> /dev/null || command -v mariadb &> /dev/null; then
    MYSQL_CMD=\$(command -v mysql || command -v mariadb)
    \$MYSQL_CMD -h $RDS_HOST -u $DB_USERNAME -p'$DB_PASSWORD' < ~/fitnessapp/init-databases.sql && \
        echo "   ✅ Databases created!" || \
        echo "   ⚠️  Database creation had issues (may already exist)"
else
    echo "   ⚠️  MySQL client not installed yet. Will retry after Docker starts."
fi
REMOTE_SCRIPT

# Step 4: Login to ECR and pull images on EC2
echo ""
echo "🐳 Pulling Docker images on EC2..."
$SSH_CMD << REMOTE_SCRIPT
# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin $REGISTRY

# Pull all images
cd ~/fitnessapp
set -a && source .env && set +a
docker-compose pull
REMOTE_SCRIPT

# Step 5: Start services
echo ""
echo "🚀 Starting all services..."
$SSH_CMD << REMOTE_SCRIPT
cd ~/fitnessapp
set -a && source .env && set +a

# Stop existing services
docker-compose down 2>/dev/null || true

# Start all services
docker-compose up -d

echo ""
echo "Waiting 30 seconds for services to start..."
sleep 30

echo ""
echo "Service Status:"
docker-compose ps
REMOTE_SCRIPT

echo ""
echo "============================================"
echo "  ✅ Deployment Complete!"
echo "============================================"
echo ""
echo "  🌐 API Gateway:  http://$PUBLIC_IP:8080"
echo "  📱 Test endpoint: http://$PUBLIC_IP:8080/api/health"
echo ""
echo "  📋 Check logs:  ssh -i $EC2_KEY ec2-user@$PUBLIC_IP 'cd fitnessapp && docker-compose logs -f'"
echo "  🔄 Restart:     ssh -i $EC2_KEY ec2-user@$PUBLIC_IP 'cd fitnessapp && docker-compose restart'"
echo "  ⏹️  Stop:        ssh -i $EC2_KEY ec2-user@$PUBLIC_IP 'cd fitnessapp && docker-compose down'"
echo "============================================"

