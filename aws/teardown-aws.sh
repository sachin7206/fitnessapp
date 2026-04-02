#!/bin/bash
# ============================================================
# FitnessApp - AWS Teardown Script
# Removes ALL AWS resources to stop billing
# Run this from your LOCAL machine (macOS) with AWS CLI installed
# You can re-deploy later with setup-aws-v2.sh
# ============================================================

export AWS_PROFILE="${AWS_PROFILE:-personal}"
AWS_REGION="${AWS_REGION:-us-east-1}"

echo "============================================"
echo "  🗑️  FitnessApp AWS Teardown"
echo "  Region: $AWS_REGION"
echo "  Profile: $AWS_PROFILE"
echo "============================================"
echo ""
echo "⚠️  This will DELETE all AWS resources:"
echo "  - RDS MySQL instance (fitnessapp-db)"
echo "  - EC2 instance (fitnessapp-server)"
echo "  - Elastic IP (fitnessapp-eip)"
echo "  - ECR repositories (9 repos)"
echo "  - Security Groups"
echo "  - DB Subnet Group"
echo "  - IAM Role & Instance Profile"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Aborted."
    exit 0
fi
echo ""

# ---- Check AWS credentials ----
echo "🔍 Checking AWS credentials..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>&1)
if [ $? -ne 0 ]; then
    echo "❌ AWS credentials not working: $AWS_ACCOUNT_ID"
    exit 1
fi
echo "   ✅ AWS Account: $AWS_ACCOUNT_ID"
echo ""

# ============================================================
# Step 1: Delete RDS MySQL Instance (biggest cost saver)
# ============================================================
echo "🗄️  Step 1: Deleting RDS MySQL instance..."

RDS_EXISTS=$(aws rds describe-db-instances --db-instance-identifier fitnessapp-db \
    --query 'DBInstances[0].DBInstanceIdentifier' --output text --region $AWS_REGION 2>/dev/null)

if [ "$RDS_EXISTS" == "fitnessapp-db" ]; then
    echo "   Deleting RDS instance (skip final snapshot to avoid storage cost)..."
    aws rds delete-db-instance \
        --db-instance-identifier fitnessapp-db \
        --skip-final-snapshot \
        --delete-automated-backups \
        --region $AWS_REGION 2>&1
    echo "   ⏳ RDS deletion initiated (takes 5-10 minutes to fully remove)..."
    echo "   Waiting for RDS to be deleted..."
    aws rds wait db-instance-deleted \
        --db-instance-identifier fitnessapp-db --region $AWS_REGION 2>/dev/null
    echo "   ✅ RDS instance deleted!"
else
    echo "   ℹ️  RDS instance not found (already deleted or never created)."
fi

# ============================================================
# Step 2: Delete DB Subnet Group
# ============================================================
echo ""
echo "🗃️  Step 2: Deleting DB Subnet Group..."
aws rds delete-db-subnet-group \
    --db-subnet-group-name fitnessapp-db-subnet \
    --region $AWS_REGION 2>/dev/null && echo "   ✅ DB subnet group deleted!" || echo "   ℹ️  DB subnet group not found."

# ============================================================
# Step 3: Terminate EC2 Instance
# ============================================================
echo ""
echo "🖥️  Step 3: Terminating EC2 instance..."

INSTANCE_ID=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=fitnessapp-server" "Name=instance-state-name,Values=running,pending,stopped" \
    --query 'Reservations[0].Instances[0].InstanceId' --output text --region $AWS_REGION 2>/dev/null)

if [ "$INSTANCE_ID" != "None" ] && [ -n "$INSTANCE_ID" ]; then
    # First disassociate IAM instance profile if attached
    ASSOC_ID=$(aws ec2 describe-iam-instance-profile-associations \
        --filters "Name=instance-id,Values=$INSTANCE_ID" \
        --query 'IamInstanceProfileAssociations[0].AssociationId' --output text --region $AWS_REGION 2>/dev/null)
    if [ "$ASSOC_ID" != "None" ] && [ -n "$ASSOC_ID" ]; then
        aws ec2 disassociate-iam-instance-profile --association-id $ASSOC_ID --region $AWS_REGION 2>/dev/null
        echo "   Disassociated IAM instance profile."
    fi

    aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $AWS_REGION > /dev/null 2>&1
    echo "   ⏳ EC2 instance $INSTANCE_ID terminating..."
    aws ec2 wait instance-terminated --instance-ids $INSTANCE_ID --region $AWS_REGION 2>/dev/null
    echo "   ✅ EC2 instance terminated!"
else
    echo "   ℹ️  No running EC2 instance found."
fi

# ============================================================
# Step 4: Release Elastic IP
# ============================================================
echo ""
echo "📍 Step 4: Releasing Elastic IP..."

EIP_ALLOC=$(aws ec2 describe-addresses \
    --filters "Name=tag:Name,Values=fitnessapp-eip" \
    --query 'Addresses[0].AllocationId' --output text --region $AWS_REGION 2>/dev/null)

if [ "$EIP_ALLOC" != "None" ] && [ -n "$EIP_ALLOC" ]; then
    aws ec2 release-address --allocation-id $EIP_ALLOC --region $AWS_REGION 2>/dev/null
    echo "   ✅ Elastic IP released!"
else
    echo "   ℹ️  No Elastic IP found."
fi

# ============================================================
# Step 5: Delete ECR Repositories
# ============================================================
echo ""
echo "📦 Step 5: Deleting ECR repositories..."

SERVICES=(api-gateway user-service nutrition-service exercise-service progress-service wellness-service ai-service subscription-service payment-service)

for svc in "${SERVICES[@]}"; do
    aws ecr delete-repository --repository-name "fitnessapp/$svc" \
        --force --region $AWS_REGION > /dev/null 2>&1 && \
        echo "   ✅ Deleted: fitnessapp/$svc" || \
        echo "   ℹ️  Not found: fitnessapp/$svc"
done

# ============================================================
# Step 6: Delete Security Groups
# ============================================================
echo ""
echo "🔒 Step 6: Deleting Security Groups..."

# Get default VPC
DEFAULT_VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" \
    --query 'Vpcs[0].VpcId' --output text --region $AWS_REGION 2>/dev/null)

# Delete RDS Security Group first (may have reference from EC2 SG)
RDS_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=fitnessapp-rds-sg" "Name=vpc-id,Values=$DEFAULT_VPC_ID" \
    --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION 2>/dev/null)

if [ "$RDS_SG_ID" != "None" ] && [ -n "$RDS_SG_ID" ]; then
    aws ec2 delete-security-group --group-id $RDS_SG_ID --region $AWS_REGION 2>/dev/null && \
        echo "   ✅ Deleted RDS SG: $RDS_SG_ID" || \
        echo "   ⚠️  Could not delete RDS SG (may have dependencies)"
else
    echo "   ℹ️  RDS security group not found."
fi

# Delete EC2 Security Group
EC2_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=fitnessapp-ec2-sg" "Name=vpc-id,Values=$DEFAULT_VPC_ID" \
    --query 'SecurityGroups[0].GroupId' --output text --region $AWS_REGION 2>/dev/null)

if [ "$EC2_SG_ID" != "None" ] && [ -n "$EC2_SG_ID" ]; then
    aws ec2 delete-security-group --group-id $EC2_SG_ID --region $AWS_REGION 2>/dev/null && \
        echo "   ✅ Deleted EC2 SG: $EC2_SG_ID" || \
        echo "   ⚠️  Could not delete EC2 SG (may have dependencies)"
else
    echo "   ℹ️  EC2 security group not found."
fi

# ============================================================
# Step 7: Delete EC2 Key Pair
# ============================================================
echo ""
echo "🔑 Step 7: Deleting EC2 Key Pair..."

EC2_KEY_NAME="${EC2_KEY_NAME:-fitnessapp-key}"
aws ec2 delete-key-pair --key-name $EC2_KEY_NAME --region $AWS_REGION 2>/dev/null && \
    echo "   ✅ Key pair '$EC2_KEY_NAME' deleted from AWS." || \
    echo "   ℹ️  Key pair not found."

if [ -f "$HOME/.ssh/$EC2_KEY_NAME.pem" ]; then
    rm -f "$HOME/.ssh/$EC2_KEY_NAME.pem"
    echo "   ✅ Local key file removed: ~/.ssh/$EC2_KEY_NAME.pem"
fi

# ============================================================
# Step 8: Clean up IAM Role & Instance Profile
# ============================================================
echo ""
echo "👤 Step 8: Cleaning up IAM Role & Instance Profile..."

# Remove role from instance profile
aws iam remove-role-from-instance-profile \
    --instance-profile-name fitnessapp-ec2-profile \
    --role-name fitnessapp-ec2-role 2>/dev/null && \
    echo "   Removed role from instance profile." || true

# Delete instance profile
aws iam delete-instance-profile \
    --instance-profile-name fitnessapp-ec2-profile 2>/dev/null && \
    echo "   ✅ Instance profile deleted." || \
    echo "   ℹ️  Instance profile not found."

# Detach policies from role
aws iam detach-role-policy --role-name fitnessapp-ec2-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly 2>/dev/null || true

# Delete role
aws iam delete-role --role-name fitnessapp-ec2-role 2>/dev/null && \
    echo "   ✅ IAM role deleted." || \
    echo "   ℹ️  IAM role not found."

# ============================================================
# Summary
# ============================================================
echo ""
echo "============================================"
echo "  ✅ AWS Teardown Complete!"
echo "============================================"
echo ""
echo "  Deleted Resources:"
echo "  ─────────────────────────────────────────"
echo "  ✅ RDS MySQL instance (fitnessapp-db)"
echo "  ✅ DB Subnet Group (fitnessapp-db-subnet)"
echo "  ✅ EC2 instance (fitnessapp-server)"
echo "  ✅ Elastic IP (fitnessapp-eip)"
echo "  ✅ 9 ECR repositories"
echo "  ✅ Security Groups (ec2-sg, rds-sg)"
echo "  ✅ EC2 Key Pair"
echo "  ✅ IAM Role & Instance Profile"
echo ""
echo "  💰 Your AWS account should stop incurring"
echo "     charges within a few minutes."
echo ""
echo "  🔄 To re-deploy later, run:"
echo "     ./aws/setup-aws-v2.sh"
echo "============================================"

