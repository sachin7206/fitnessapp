#!/bin/bash
# ============================================================
# FitnessApp - AWS Infrastructure Setup Script
# Run this from your LOCAL machine (macOS) with AWS CLI installed
# This script creates all AWS resources needed for deployment
# ============================================================
set -e

# ---- Configuration ----
export AWS_PROFILE="${AWS_PROFILE:-personal}"
AWS_REGION="${AWS_REGION:-us-east-1}"
DB_MASTER_PASSWORD="${DB_MASTER_PASSWORD:-ChangeMeNow2024!}"
DB_MASTER_USERNAME="admin"
EC2_KEY_NAME="${EC2_KEY_NAME:-fitnessapp-key}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t2.micro}"

echo "============================================"
echo "  FitnessApp AWS Setup"
echo "  Region: $AWS_REGION"
echo "============================================"
echo ""

# ---- Step 0: Check prerequisites ----
echo "🔍 Checking prerequisites..."
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Install it first:"
    echo "   brew install awscli"
    echo "   Then run: aws configure"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run: aws configure"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "   AWS Account: $AWS_ACCOUNT_ID"
echo "   Region: $AWS_REGION"
echo ""

# ---- Step 1: Create VPC & Networking ----
echo "🌐 Step 1: Setting up VPC and networking..."

# Use default VPC
DEFAULT_VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" \
    --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION)

if [ "$DEFAULT_VPC_ID" == "None" ] || [ -z "$DEFAULT_VPC_ID" ]; then
    echo "   Creating default VPC..."
    aws ec2 create-default-vpc --region $AWS_REGION 2>/dev/null || true
    DEFAULT_VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" \
        --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION)
fi
echo "   VPC: $DEFAULT_VPC_ID"

# Get subnets
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$DEFAULT_VPC_ID" \
    --query 'Subnets[*].SubnetId' --output text --region $AWS_REGION)
SUBNET_1=$(echo $SUBNETS | awk '{print $1}')
SUBNET_2=$(echo $SUBNETS | awk '{print $2}')
echo "   Subnets: $SUBNET_1, $SUBNET_2"

# ---- Step 2: Create Security Groups ----
echo ""
echo "🔒 Step 2: Creating Security Groups..."

# EC2 Security Group
EC2_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=fitnessapp-ec2-sg" "Name=vpc-id,Values=$DEFAULT_VPC_ID" \
    --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION 2>/dev/null)

if [ "$EC2_SG_ID" == "None" ] || [ -z "$EC2_SG_ID" ]; then
    EC2_SG_ID=$(aws ec2 create-security-group \
        --group-name fitnessapp-ec2-sg \
        --description "FitnessApp EC2 Security Group" \
        --vpc-id $DEFAULT_VPC_ID \
        --query 'GroupId' --output text --region $AWS_REGION)

    # Allow SSH from anywhere (restrict to your IP later!)
    aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID \
        --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $AWS_REGION 2>/dev/null || true

    # Allow HTTP (API Gateway port 8080)
    aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID \
        --protocol tcp --port 8080 --cidr 0.0.0.0/0 --region $AWS_REGION 2>/dev/null || true

    # Allow HTTP/HTTPS for future Nginx/Certbot
    aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID \
        --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION 2>/dev/null || true
    aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID \
        --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $AWS_REGION 2>/dev/null || true
fi
echo "   EC2 SG: $EC2_SG_ID"

# RDS Security Group
RDS_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=fitnessapp-rds-sg" "Name=vpc-id,Values=$DEFAULT_VPC_ID" \
    --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION 2>/dev/null)

if [ "$RDS_SG_ID" == "None" ] || [ -z "$RDS_SG_ID" ]; then
    RDS_SG_ID=$(aws ec2 create-security-group \
        --group-name fitnessapp-rds-sg \
        --description "FitnessApp RDS Security Group" \
        --vpc-id $DEFAULT_VPC_ID \
        --query 'GroupId' --output text --region $AWS_REGION)

    # Allow MySQL only from EC2 security group
    aws ec2 authorize-security-group-ingress --group-id $RDS_SG_ID \
        --protocol tcp --port 3306 --source-group $EC2_SG_ID --region $AWS_REGION 2>/dev/null || true
fi
echo "   RDS SG: $RDS_SG_ID"

# ---- Step 3: Create RDS MySQL Instance ----
echo ""
echo "🗄️  Step 3: Creating RDS MySQL instance (Free Tier - db.t3.micro)..."

RDS_EXISTS=$(aws rds describe-db-instances --db-instance-identifier fitnessapp-db \
    --query 'DBInstances[0].DBInstanceIdentifier' --output text --region $AWS_REGION 2>/dev/null || echo "None")

if [ "$RDS_EXISTS" == "None" ]; then
    # Create DB subnet group
    aws rds create-db-subnet-group \
        --db-subnet-group-name fitnessapp-db-subnet \
        --db-subnet-group-description "FitnessApp DB Subnet Group" \
        --subnet-ids $SUBNET_1 $SUBNET_2 \
        --region $AWS_REGION 2>/dev/null || true

    aws rds create-db-instance \
        --db-instance-identifier fitnessapp-db \
        --db-instance-class db.t3.micro \
        --engine mysql \
        --engine-version 8.0 \
        --master-username $DB_MASTER_USERNAME \
        --master-user-password "$DB_MASTER_PASSWORD" \
        --allocated-storage 20 \
        --storage-type gp2 \
        --vpc-security-group-ids $RDS_SG_ID \
        --db-subnet-group-name fitnessapp-db-subnet \
        --no-multi-az \
        --backup-retention-period 7 \
        --no-auto-minor-version-upgrade \
        --publicly-accessible \
        --region $AWS_REGION

    echo "   ⏳ RDS instance is being created (takes 5-10 minutes)..."
    echo "   Waiting for RDS to become available..."
    aws rds wait db-instance-available \
        --db-instance-identifier fitnessapp-db --region $AWS_REGION
    echo "   ✅ RDS instance is ready!"
else
    echo "   RDS instance already exists."
fi

RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier fitnessapp-db \
    --query 'DBInstances[0].Endpoint.Address' --output text --region $AWS_REGION)
echo "   RDS Endpoint: $RDS_ENDPOINT"

# ---- Step 4: Create databases on RDS ----
echo ""
echo "🗃️  Step 4: Creating databases..."
echo "   You need to run these SQL commands on the RDS instance."
echo "   Install mysql client if needed: brew install mysql-client"
echo ""
echo "   Run this command:"
echo "   mysql -h $RDS_ENDPOINT -u $DB_MASTER_USERNAME -p'$DB_MASTER_PASSWORD' -e \""
echo "     CREATE DATABASE IF NOT EXISTS fitnessapp_users;"
echo "     CREATE DATABASE IF NOT EXISTS fitnessapp_nutrition;"
echo "     CREATE DATABASE IF NOT EXISTS fitnessapp_exercises;"
echo "     CREATE DATABASE IF NOT EXISTS fitnessapp_progress;"
echo "     CREATE DATABASE IF NOT EXISTS fitnessapp_wellness;"
echo "     CREATE DATABASE IF NOT EXISTS fitnessapp_subscriptions;"
echo "     CREATE DATABASE IF NOT EXISTS fitnessapp_payments;"
echo "   \""

# ---- Step 5: Create ECR Repositories ----
echo ""
echo "📦 Step 5: Creating ECR repositories..."

SERVICES=(api-gateway user-service nutrition-service exercise-service progress-service wellness-service ai-service subscription-service payment-service)

for svc in "${SERVICES[@]}"; do
    REPO_EXISTS=$(aws ecr describe-repositories --repository-names "fitnessapp/$svc" \
        --query 'repositories[0].repositoryName' --output text --region $AWS_REGION 2>/dev/null || echo "None")

    if [ "$REPO_EXISTS" == "None" ]; then
        aws ecr create-repository --repository-name "fitnessapp/$svc" \
            --image-scanning-configuration scanOnPush=false \
            --region $AWS_REGION > /dev/null
        echo "   Created: fitnessapp/$svc"
    else
        echo "   Exists:  fitnessapp/$svc"
    fi
done

# ---- Step 6: Create EC2 Key Pair ----
echo ""
echo "🔑 Step 6: Creating EC2 key pair..."

KEY_EXISTS=$(aws ec2 describe-key-pairs --key-names $EC2_KEY_NAME \
    --query 'KeyPairs[0].KeyName' --output text --region $AWS_REGION 2>/dev/null || echo "None")

if [ "$KEY_EXISTS" == "None" ]; then
    aws ec2 create-key-pair --key-name $EC2_KEY_NAME \
        --query 'KeyMaterial' --output text --region $AWS_REGION > ~/.ssh/$EC2_KEY_NAME.pem
    chmod 400 ~/.ssh/$EC2_KEY_NAME.pem
    echo "   Key pair created: ~/.ssh/$EC2_KEY_NAME.pem"
else
    echo "   Key pair already exists: $EC2_KEY_NAME"
fi

# ---- Step 7: Launch EC2 Instance ----
echo ""
echo "🖥️  Step 7: Launching EC2 instance ($INSTANCE_TYPE)..."

INSTANCE_ID=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=fitnessapp-server" "Name=instance-state-name,Values=running,pending" \
    --query 'Reservations[0].Instances[0].InstanceId' --output text --region $AWS_REGION 2>/dev/null)

if [ "$INSTANCE_ID" == "None" ] || [ -z "$INSTANCE_ID" ]; then
    # Get latest Amazon Linux 2023 AMI
    AMI_ID=$(aws ec2 describe-images \
        --owners amazon \
        --filters "Name=name,Values=al2023-ami-2023*-x86_64" "Name=state,Values=available" \
        --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
        --output text --region $AWS_REGION)

    echo "   AMI: $AMI_ID"

    # User data script to set up Docker on boot
    USER_DATA=$(cat <<'USERDATA'
#!/bin/bash
# Update system
dnf update -y

# Install Docker
dnf install -y docker
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Install Docker Compose
DOCKER_COMPOSE_VERSION="v2.24.0"
curl -SL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Install MySQL client
dnf install -y mariadb105

# Create swap (4GB) - critical for running 9 Java services on t2.micro
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
echo 'vm.swappiness=60' >> /etc/sysctl.conf
sysctl -p

# Create app directory
mkdir -p /home/ec2-user/fitnessapp
chown ec2-user:ec2-user /home/ec2-user/fitnessapp

echo "Setup complete!" > /home/ec2-user/setup-complete.txt
USERDATA
)

    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id $AMI_ID \
        --instance-type $INSTANCE_TYPE \
        --key-name $EC2_KEY_NAME \
        --security-group-ids $EC2_SG_ID \
        --subnet-id $SUBNET_1 \
        --associate-public-ip-address \
        --user-data "$USER_DATA" \
        --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=fitnessapp-server}]" \
        --block-device-mappings "[{\"DeviceName\":\"/dev/xvda\",\"Ebs\":{\"VolumeSize\":20,\"VolumeType\":\"gp3\"}}]" \
        --query 'Instances[0].InstanceId' --output text --region $AWS_REGION)

    echo "   ⏳ EC2 instance launching..."
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $AWS_REGION
    echo "   ✅ EC2 instance is running!"
else
    echo "   EC2 instance already exists: $INSTANCE_ID"
fi

# ---- Step 8: Allocate Elastic IP ----
echo ""
echo "📍 Step 8: Allocating Elastic IP..."

EIP_ALLOC=$(aws ec2 describe-addresses \
    --filters "Name=tag:Name,Values=fitnessapp-eip" \
    --query 'Addresses[0].AllocationId' --output text --region $AWS_REGION 2>/dev/null)

if [ "$EIP_ALLOC" == "None" ] || [ -z "$EIP_ALLOC" ]; then
    EIP_ALLOC=$(aws ec2 allocate-address --domain vpc \
        --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=fitnessapp-eip}]" \
        --query 'AllocationId' --output text --region $AWS_REGION)

    aws ec2 associate-address --allocation-id $EIP_ALLOC \
        --instance-id $INSTANCE_ID --region $AWS_REGION > /dev/null
    echo "   Elastic IP allocated and associated."
else
    echo "   Elastic IP already exists."
fi

PUBLIC_IP=$(aws ec2 describe-addresses --allocation-ids $EIP_ALLOC \
    --query 'Addresses[0].PublicIp' --output text --region $AWS_REGION)
echo "   Public IP: $PUBLIC_IP"

# ---- Step 9: Create IAM Role for EC2 to pull from ECR ----
echo ""
echo "👤 Step 9: Setting up IAM role for ECR access..."

ROLE_EXISTS=$(aws iam get-role --role-name fitnessapp-ec2-role \
    --query 'Role.RoleName' --output text 2>/dev/null || echo "None")

if [ "$ROLE_EXISTS" == "None" ]; then
    # Create trust policy
    cat > /tmp/ec2-trust-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    aws iam create-role --role-name fitnessapp-ec2-role \
        --assume-role-policy-document file:///tmp/ec2-trust-policy.json > /dev/null

    aws iam attach-role-policy --role-name fitnessapp-ec2-role \
        --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly

    aws iam create-instance-profile --instance-profile-name fitnessapp-ec2-profile > /dev/null 2>/dev/null || true
    aws iam add-role-to-instance-profile \
        --instance-profile-name fitnessapp-ec2-profile \
        --role-name fitnessapp-ec2-role 2>/dev/null || true

    # Wait for profile to propagate
    sleep 10

    aws ec2 associate-iam-instance-profile \
        --iam-instance-profile Name=fitnessapp-ec2-profile \
        --instance-id $INSTANCE_ID --region $AWS_REGION 2>/dev/null || true

    echo "   IAM role created and attached."
else
    echo "   IAM role already exists."
fi

# ---- Summary ----
echo ""
echo "============================================"
echo "  ✅ AWS Infrastructure Setup Complete!"
echo "============================================"
echo ""
echo "  Resources Created:"
echo "  ─────────────────────────────────────────"
echo "  EC2 Instance:  $INSTANCE_ID"
echo "  Public IP:     $PUBLIC_IP"
echo "  RDS Endpoint:  $RDS_ENDPOINT"
echo "  RDS Username:  $DB_MASTER_USERNAME"
echo "  VPC:           $DEFAULT_VPC_ID"
echo "  EC2 SG:        $EC2_SG_ID"
echo "  RDS SG:        $RDS_SG_ID"
echo "  ECR Repos:     9 repositories created"
echo "  SSH Key:       ~/.ssh/$EC2_KEY_NAME.pem"
echo ""
echo "  ⚠️  NEXT STEPS:"
echo "  ─────────────────────────────────────────"
echo "  1. Wait 2-3 minutes for EC2 setup to complete"
echo "  2. Create databases on RDS (see Step 4 output above)"
echo "  3. Copy aws/.env.example to aws/.env and fill in values:"
echo "     - AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID"
echo "     - AWS_REGION=$AWS_REGION"
echo "     - RDS_HOST=$RDS_ENDPOINT"
echo "     - DB_USERNAME=$DB_MASTER_USERNAME"
echo "     - DB_PASSWORD=$DB_MASTER_PASSWORD"
echo "  4. Run: ./aws/build-and-push.sh  (build Docker images & push to ECR)"
echo "  5. Run: ./aws/deploy.sh          (deploy to EC2)"
echo ""
echo "  SSH into EC2:"
echo "  ssh -i ~/.ssh/$EC2_KEY_NAME.pem ec2-user@$PUBLIC_IP"
echo "============================================"

