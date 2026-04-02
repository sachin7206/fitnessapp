#!/bin/bash
# ============================================================
# FitnessApp - AWS Infrastructure Setup Script (Fixed)
# Run this from your LOCAL machine (macOS) with AWS CLI installed
# ============================================================

# ---- Configuration ----
export AWS_PROFILE="${AWS_PROFILE:-personal}"
AWS_REGION="${AWS_REGION:-us-east-1}"
DB_MASTER_PASSWORD="${DB_MASTER_PASSWORD:-FitnessApp2024Secure}"
DB_MASTER_USERNAME="admin"
EC2_KEY_NAME="${EC2_KEY_NAME:-fitnessapp-key}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t2.micro}"

echo "============================================"
echo "  FitnessApp AWS Setup"
echo "  Region: $AWS_REGION"
echo "  Profile: $AWS_PROFILE"
echo "============================================"
echo ""

# ---- Step 0: Check prerequisites ----
echo "🔍 Checking prerequisites..."
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Install: brew install awscli"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>&1)
if [ $? -ne 0 ]; then
    echo "❌ AWS credentials not working: $AWS_ACCOUNT_ID"
    exit 1
fi
echo "   ✅ AWS Account: $AWS_ACCOUNT_ID"
echo "   ✅ Region: $AWS_REGION"
echo ""

# ---- Step 1: VPC & Networking ----
echo "🌐 Step 1: Setting up VPC and networking..."

DEFAULT_VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" \
    --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION 2>&1)

if [ "$DEFAULT_VPC_ID" == "None" ] || [ -z "$DEFAULT_VPC_ID" ] || echo "$DEFAULT_VPC_ID" | grep -q "error"; then
    echo "   Creating default VPC..."
    aws ec2 create-default-vpc --region $AWS_REGION 2>/dev/null
    DEFAULT_VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" \
        --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION 2>&1)
fi

if echo "$DEFAULT_VPC_ID" | grep -q "error"; then
    echo "   ❌ Failed to get VPC: $DEFAULT_VPC_ID"
    exit 1
fi
echo "   ✅ VPC: $DEFAULT_VPC_ID"

# Get subnets
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$DEFAULT_VPC_ID" \
    --query 'Subnets[*].SubnetId' --output text --region $AWS_REGION 2>&1)
SUBNET_1=$(echo $SUBNETS | awk '{print $1}')
SUBNET_2=$(echo $SUBNETS | awk '{print $2}')
echo "   ✅ Subnets: $SUBNET_1, $SUBNET_2"

# ---- Step 2: Security Groups ----
echo ""
echo "🔒 Step 2: Creating Security Groups..."

EC2_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=fitnessapp-ec2-sg" "Name=vpc-id,Values=$DEFAULT_VPC_ID" \
    --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION 2>/dev/null)

if [ "$EC2_SG_ID" == "None" ] || [ -z "$EC2_SG_ID" ]; then
    EC2_SG_ID=$(aws ec2 create-security-group \
        --group-name fitnessapp-ec2-sg \
        --description "FitnessApp EC2 Security Group" \
        --vpc-id $DEFAULT_VPC_ID \
        --query 'GroupId' --output text --region $AWS_REGION 2>&1)

    if echo "$EC2_SG_ID" | grep -q "error"; then
        echo "   ❌ Failed to create EC2 SG: $EC2_SG_ID"
        exit 1
    fi

    aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID \
        --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $AWS_REGION 2>/dev/null
    aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID \
        --protocol tcp --port 8080 --cidr 0.0.0.0/0 --region $AWS_REGION 2>/dev/null
    aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID \
        --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION 2>/dev/null
    aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID \
        --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $AWS_REGION 2>/dev/null
fi
echo "   ✅ EC2 SG: $EC2_SG_ID"

RDS_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=fitnessapp-rds-sg" "Name=vpc-id,Values=$DEFAULT_VPC_ID" \
    --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION 2>/dev/null)

if [ "$RDS_SG_ID" == "None" ] || [ -z "$RDS_SG_ID" ]; then
    RDS_SG_ID=$(aws ec2 create-security-group \
        --group-name fitnessapp-rds-sg \
        --description "FitnessApp RDS Security Group" \
        --vpc-id $DEFAULT_VPC_ID \
        --query 'GroupId' --output text --region $AWS_REGION 2>&1)

    if echo "$RDS_SG_ID" | grep -q "error"; then
        echo "   ❌ Failed to create RDS SG: $RDS_SG_ID"
        exit 1
    fi

    aws ec2 authorize-security-group-ingress --group-id $RDS_SG_ID \
        --protocol tcp --port 3306 --source-group $EC2_SG_ID --region $AWS_REGION 2>/dev/null
fi
echo "   ✅ RDS SG: $RDS_SG_ID"

# ---- Step 3: RDS MySQL ----
echo ""
echo "🗄️  Step 3: Creating RDS MySQL instance (Free Tier)..."

RDS_EXISTS=$(aws rds describe-db-instances --db-instance-identifier fitnessapp-db \
    --query 'DBInstances[0].DBInstanceIdentifier' --output text --region $AWS_REGION 2>/dev/null)

if [ "$RDS_EXISTS" != "fitnessapp-db" ]; then
    echo "   Creating DB subnet group..."
    aws rds create-db-subnet-group \
        --db-subnet-group-name fitnessapp-db-subnet \
        --db-subnet-group-description "FitnessApp DB Subnet Group" \
        --subnet-ids $SUBNET_1 $SUBNET_2 \
        --region $AWS_REGION 2>/dev/null

    SUBNET_RESULT=$?
    if [ $SUBNET_RESULT -ne 0 ]; then
        echo "   ⚠️  DB subnet group may already exist, continuing..."
    fi

    echo "   Creating RDS instance (this takes 5-10 minutes)..."
    RDS_CREATE_OUTPUT=$(aws rds create-db-instance \
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
        --region $AWS_REGION 2>&1)

    if [ $? -ne 0 ]; then
        echo "   ❌ RDS creation failed:"
        echo "   $RDS_CREATE_OUTPUT"
        echo ""
        echo "   If it says 'already exists', that's OK - continuing..."
    else
        echo "   ⏳ Waiting for RDS to become available..."
        aws rds wait db-instance-available \
            --db-instance-identifier fitnessapp-db --region $AWS_REGION 2>&1
        echo "   ✅ RDS instance is ready!"
    fi
else
    echo "   ✅ RDS instance already exists."
fi

RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier fitnessapp-db \
    --query 'DBInstances[0].Endpoint.Address' --output text --region $AWS_REGION 2>&1)

if echo "$RDS_ENDPOINT" | grep -q "error"; then
    echo "   ⚠️  Could not get RDS endpoint yet (may still be creating)"
    RDS_ENDPOINT="PENDING"
else
    echo "   ✅ RDS Endpoint: $RDS_ENDPOINT"
fi

# ---- Step 4: ECR Repositories ----
echo ""
echo "📦 Step 4: Creating ECR repositories..."

SERVICES=(api-gateway user-service nutrition-service exercise-service progress-service wellness-service ai-service subscription-service payment-service)
ECR_SUCCESS=0

for svc in "${SERVICES[@]}"; do
    REPO_EXISTS=$(aws ecr describe-repositories --repository-names "fitnessapp/$svc" \
        --query 'repositories[0].repositoryName' --output text --region $AWS_REGION 2>/dev/null)

    if [ "$REPO_EXISTS" != "fitnessapp/$svc" ]; then
        RESULT=$(aws ecr create-repository --repository-name "fitnessapp/$svc" \
            --image-scanning-configuration scanOnPush=false \
            --region $AWS_REGION 2>&1)
        if [ $? -eq 0 ]; then
            echo "   ✅ Created: fitnessapp/$svc"
            ECR_SUCCESS=$((ECR_SUCCESS + 1))
        else
            echo "   ❌ Failed: fitnessapp/$svc - $RESULT"
        fi
    else
        echo "   ✅ Exists: fitnessapp/$svc"
        ECR_SUCCESS=$((ECR_SUCCESS + 1))
    fi
done
echo "   $ECR_SUCCESS/9 ECR repos ready"

# ---- Step 5: EC2 Key Pair ----
echo ""
echo "🔑 Step 5: Creating EC2 key pair..."

mkdir -p ~/.ssh

KEY_EXISTS=$(aws ec2 describe-key-pairs --key-names $EC2_KEY_NAME \
    --query 'KeyPairs[0].KeyName' --output text --region $AWS_REGION 2>/dev/null)

if [ "$KEY_EXISTS" != "$EC2_KEY_NAME" ]; then
    KEY_RESULT=$(aws ec2 create-key-pair --key-name $EC2_KEY_NAME \
        --query 'KeyMaterial' --output text --region $AWS_REGION 2>&1)
    if [ $? -eq 0 ]; then
        echo "$KEY_RESULT" > ~/.ssh/$EC2_KEY_NAME.pem
        chmod 400 ~/.ssh/$EC2_KEY_NAME.pem
        echo "   ✅ Key pair created: ~/.ssh/$EC2_KEY_NAME.pem"
    else
        echo "   ❌ Key pair creation failed: $KEY_RESULT"
    fi
else
    echo "   ✅ Key pair already exists: $EC2_KEY_NAME"
fi

# ---- Step 6: Launch EC2 Instance ----
echo ""
echo "🖥️  Step 6: Launching EC2 instance ($INSTANCE_TYPE)..."

INSTANCE_ID=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=fitnessapp-server" "Name=instance-state-name,Values=running,pending" \
    --query 'Reservations[0].Instances[0].InstanceId' --output text --region $AWS_REGION 2>/dev/null)

if [ "$INSTANCE_ID" == "None" ] || [ -z "$INSTANCE_ID" ]; then
    # Get latest Amazon Linux 2023 AMI
    AMI_ID=$(aws ec2 describe-images \
        --owners amazon \
        --filters "Name=name,Values=al2023-ami-2023*-x86_64" "Name=state,Values=available" \
        --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
        --output text --region $AWS_REGION 2>&1)

    if echo "$AMI_ID" | grep -q "error"; then
        echo "   ❌ Failed to find AMI: $AMI_ID"
        exit 1
    fi
    echo "   AMI: $AMI_ID"

    # Create user data script file
    cat > /tmp/fitnessapp-userdata.sh << 'USERDATA'
#!/bin/bash
dnf update -y
dnf install -y docker
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

DOCKER_COMPOSE_VERSION="v2.24.0"
curl -SL "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
    -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

dnf install -y mariadb105

fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
echo 'vm.swappiness=60' >> /etc/sysctl.conf
sysctl -p

mkdir -p /home/ec2-user/fitnessapp
chown ec2-user:ec2-user /home/ec2-user/fitnessapp
echo "Setup complete!" > /home/ec2-user/setup-complete.txt
USERDATA

    INSTANCE_ID=$(aws ec2 run-instances \
        --image-id "$AMI_ID" \
        --instance-type $INSTANCE_TYPE \
        --key-name $EC2_KEY_NAME \
        --security-group-ids $EC2_SG_ID \
        --subnet-id $SUBNET_1 \
        --associate-public-ip-address \
        --user-data file:///tmp/fitnessapp-userdata.sh \
        --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=fitnessapp-server}]' \
        --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":20,"VolumeType":"gp3"}}]' \
        --query 'Instances[0].InstanceId' --output text --region $AWS_REGION 2>&1)

    if echo "$INSTANCE_ID" | grep -q "error"; then
        echo "   ❌ EC2 launch failed: $INSTANCE_ID"
        exit 1
    fi

    echo "   ⏳ EC2 instance launching: $INSTANCE_ID"
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $AWS_REGION
    echo "   ✅ EC2 instance is running!"
else
    echo "   ✅ EC2 instance already exists: $INSTANCE_ID"
fi

# ---- Step 7: Elastic IP ----
echo ""
echo "📍 Step 7: Allocating Elastic IP..."

EIP_ALLOC=$(aws ec2 describe-addresses \
    --filters "Name=tag:Name,Values=fitnessapp-eip" \
    --query 'Addresses[0].AllocationId' --output text --region $AWS_REGION 2>/dev/null)

if [ "$EIP_ALLOC" == "None" ] || [ -z "$EIP_ALLOC" ]; then
    EIP_ALLOC=$(aws ec2 allocate-address --domain vpc \
        --tag-specifications 'ResourceType=elastic-ip,Tags=[{Key=Name,Value=fitnessapp-eip}]' \
        --query 'AllocationId' --output text --region $AWS_REGION 2>&1)

    if echo "$EIP_ALLOC" | grep -q "error"; then
        echo "   ❌ Elastic IP failed: $EIP_ALLOC"
        echo "   Using instance public IP instead..."
        PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID \
            --query 'Reservations[0].Instances[0].PublicIpAddress' --output text --region $AWS_REGION)
    else
        aws ec2 associate-address --allocation-id $EIP_ALLOC \
            --instance-id $INSTANCE_ID --region $AWS_REGION > /dev/null 2>&1
        PUBLIC_IP=$(aws ec2 describe-addresses --allocation-ids $EIP_ALLOC \
            --query 'Addresses[0].PublicIp' --output text --region $AWS_REGION)
        echo "   ✅ Elastic IP allocated and associated."
    fi
else
    PUBLIC_IP=$(aws ec2 describe-addresses --allocation-ids $EIP_ALLOC \
        --query 'Addresses[0].PublicIp' --output text --region $AWS_REGION)
    echo "   ✅ Elastic IP already exists."
fi
echo "   ✅ Public IP: $PUBLIC_IP"

# ---- Step 8: IAM Role for ECR access ----
echo ""
echo "👤 Step 8: Setting up IAM role for ECR access..."

ROLE_EXISTS=$(aws iam get-role --role-name fitnessapp-ec2-role \
    --query 'Role.RoleName' --output text 2>/dev/null)

if [ "$ROLE_EXISTS" != "fitnessapp-ec2-role" ]; then
    cat > /tmp/ec2-trust-policy.json << 'EOF'
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
        --assume-role-policy-document file:///tmp/ec2-trust-policy.json > /dev/null 2>&1

    aws iam attach-role-policy --role-name fitnessapp-ec2-role \
        --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly 2>&1

    aws iam create-instance-profile \
        --instance-profile-name fitnessapp-ec2-profile > /dev/null 2>&1 || true
    aws iam add-role-to-instance-profile \
        --instance-profile-name fitnessapp-ec2-profile \
        --role-name fitnessapp-ec2-role 2>/dev/null || true

    sleep 10

    aws ec2 associate-iam-instance-profile \
        --iam-instance-profile Name=fitnessapp-ec2-profile \
        --instance-id $INSTANCE_ID --region $AWS_REGION 2>/dev/null || true

    echo "   ✅ IAM role created and attached."
else
    echo "   ✅ IAM role already exists."
fi

# ---- Summary ----
echo ""
echo "============================================"
echo "  ✅ AWS Infrastructure Setup Complete!"
echo "============================================"
echo ""
echo "  Resources Created:"
echo "  ─────────────────────────────────────────"
echo "  AWS Account:   $AWS_ACCOUNT_ID"
echo "  EC2 Instance:  $INSTANCE_ID"
echo "  Public IP:     $PUBLIC_IP"
echo "  RDS Endpoint:  $RDS_ENDPOINT"
echo "  RDS Username:  $DB_MASTER_USERNAME"
echo "  RDS Password:  $DB_MASTER_PASSWORD"
echo "  VPC:           $DEFAULT_VPC_ID"
echo "  EC2 SG:        $EC2_SG_ID"
echo "  RDS SG:        $RDS_SG_ID"
echo "  ECR Repos:     9 repositories"
echo "  SSH Key:       ~/.ssh/$EC2_KEY_NAME.pem"
echo ""
echo "  ⚠️  NEXT STEPS:"
echo "  ─────────────────────────────────────────"
echo "  1. Wait 2-3 minutes for EC2 Docker setup to complete"
echo "  2. Copy aws/.env.example to aws/.env and fill in:"
echo "     AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID"
echo "     AWS_REGION=$AWS_REGION"
echo "     RDS_HOST=$RDS_ENDPOINT"
echo "     DB_USERNAME=$DB_MASTER_USERNAME"
echo "     DB_PASSWORD=$DB_MASTER_PASSWORD"
echo "  3. Run: ./aws/build-and-push.sh"
echo "  4. Run: ./aws/deploy.sh"
echo ""
echo "  SSH into EC2:"
echo "  ssh -i ~/.ssh/$EC2_KEY_NAME.pem ec2-user@$PUBLIC_IP"
echo "============================================"

