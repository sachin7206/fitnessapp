# 🚀 FitnessApp AWS Deployment Guide

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        AWS Cloud (Free Tier)                      │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    EC2 (t2.micro) + 4GB Swap                │ │
│  │                                                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│  │  │API Gateway│  │  User    │  │Nutrition │  │Exercise  │   │ │
│  │  │  :8080   │  │ Service  │  │ Service  │  │ Service  │   │ │
│  │  └──────────┘  │  :8081   │  │  :8082   │  │  :8083   │   │ │
│  │       ↕        └──────────┘  └──────────┘  └──────────┘   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│  │  │Progress  │  │Wellness  │  │   AI     │  │Subscript.│   │ │
│  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │ │
│  │  │  :8084   │  │  :8085   │  │  :8086   │  │  :8087   │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │ │
│  │  ┌──────────┐                                              │ │
│  │  │Payment   │      All running via Docker Compose          │ │
│  │  │ Service  │                                              │ │
│  │  │  :8088   │                                              │ │
│  │  └──────────┘                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              RDS MySQL (db.t3.micro) - Free Tier            │ │
│  │  7 databases: users, nutrition, exercises, progress,        │ │
│  │               wellness, subscriptions, payments             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────┐                                                │
│  │  ECR         │ 9 Docker image repositories                    │
│  └──────────────┘                                                │
└──────────────────────────────────────────────────────────────────┘

Mobile App → (Expo Go / EAS Build) → connects to http://<EC2-IP>:8080/api
```

## AWS Free Tier Resources Used

| Service | Tier | Limits |
|---------|------|--------|
| EC2 t2.micro | 12 months free | 750 hrs/month |
| RDS db.t3.micro | 12 months free | 750 hrs/month, 20GB storage |
| ECR | Always free | 500MB storage |
| Elastic IP | Free when attached | 1 IP |
| Data Transfer | 12 months free | 15GB/month outbound |

**Estimated cost: $0/month** (within free tier limits for 12 months)

---

## Prerequisites

1. **AWS Account** (free tier) — ✅ You have this
2. **AWS CLI** installed and configured on your Mac
3. **Docker Desktop** installed on your Mac
4. **MySQL client** (optional, for direct DB access)

### Install Prerequisites

```bash
# Install AWS CLI
brew install awscli

# Configure AWS CLI (enter your Access Key ID and Secret)
aws configure
# → AWS Access Key ID: [your-key]
# → AWS Secret Access Key: [your-secret]
# → Default region: us-east-1
# → Default output: json

# Install Docker Desktop (if not installed)
brew install --cask docker

# Install MySQL client (optional)
brew install mysql-client
```

### Get Your AWS Access Keys

1. Go to **AWS Console** → **IAM** → **Users** → your user
2. Click **Security credentials** tab
3. Click **Create access key**
4. Choose **Command Line Interface (CLI)**
5. Save the Access Key ID and Secret Access Key

---

## Deployment Steps

### Step 1: Create AWS Infrastructure (One-Time)

```bash
cd /Users/sbisht/Documents/fitnessapp

# Set your desired DB password (change this!)
export DB_MASTER_PASSWORD="YourSecurePassword123!"

# Run the setup script
./aws/setup-aws.sh
```

This creates:
- VPC + Security Groups
- RDS MySQL instance (takes ~5-10 min)
- ECR repositories (9 total)
- EC2 instance with Docker pre-installed
- Elastic IP (static public address)
- IAM role for ECR access

**⚠️ Save the output!** You'll need the RDS endpoint and Public IP.

### Step 2: Configure Environment Variables

```bash
# Copy the example env file
cp aws/.env.example aws/.env

# Edit with your values from Step 1 output
nano aws/.env
```

Fill in these values:
```env
AWS_ACCOUNT_ID=123456789012         # From: aws sts get-caller-identity
AWS_REGION=us-east-1
RDS_HOST=fitnessapp-db.xxxxx.us-east-1.rds.amazonaws.com  # From setup output
DB_USERNAME=admin
DB_PASSWORD=YourSecurePassword123!  # Same as DB_MASTER_PASSWORD
JWT_SECRET=generate-a-long-random-string-here-at-least-64-characters-long-for-security
GEMINI_API_KEYS=your-gemini-api-key  # From Google AI Studio
```

### Step 3: Build & Push Docker Images

```bash
# This builds all 9 services and pushes to ECR
# Takes ~15-20 minutes on first run
./aws/build-and-push.sh
```

**Note:** Images are built for `linux/amd64` (EC2 architecture). If you're on an M1/M2 Mac, Docker handles the cross-compilation automatically.

### Step 4: Create Databases on RDS

```bash
# SSH into EC2 first
ssh -i ~/.ssh/fitnessapp-key.pem ec2-user@<YOUR_EC2_PUBLIC_IP>

# On the EC2 instance, create databases
mysql -h <YOUR_RDS_ENDPOINT> -u admin -p'YourSecurePassword123!' -e "
  CREATE DATABASE IF NOT EXISTS fitnessapp_users;
  CREATE DATABASE IF NOT EXISTS fitnessapp_nutrition;
  CREATE DATABASE IF NOT EXISTS fitnessapp_exercises;
  CREATE DATABASE IF NOT EXISTS fitnessapp_progress;
  CREATE DATABASE IF NOT EXISTS fitnessapp_wellness;
  CREATE DATABASE IF NOT EXISTS fitnessapp_subscriptions;
  CREATE DATABASE IF NOT EXISTS fitnessapp_payments;
"

# Exit EC2
exit
```

### Step 5: Deploy to EC2

```bash
# Deploy all services
./aws/deploy.sh
```

This will:
1. Copy docker-compose.yml and .env to EC2
2. Pull Docker images from ECR
3. Start all 9 services
4. Show service status

### Step 6: Verify Deployment

```bash
# Check API Gateway health
curl http://<YOUR_EC2_PUBLIC_IP>:8080/api/health

# Check all services via SSH
ssh -i ~/.ssh/fitnessapp-key.pem ec2-user@<YOUR_EC2_PUBLIC_IP>
cd fitnessapp
docker compose ps        # Should show 9 services running
docker compose logs -f   # Watch logs
```

### Step 7: Connect Mobile App

Update your mobile app to point to the AWS backend:

```bash
# Option A: Set environment variable before building
export EXPO_PUBLIC_API_URL=http://<YOUR_EC2_PUBLIC_IP>:8080/api

# Option B: Update app.json
# In mobile/app.json, set:
#   "extra": { "apiUrl": "http://<YOUR_EC2_PUBLIC_IP>:8080/api" }
```

For Expo Go development:
```bash
cd mobile
EXPO_PUBLIC_API_URL=http://<YOUR_EC2_PUBLIC_IP>:8080/api npx expo start
```

For production APK/IPA builds:
```bash
# Build with EAS (uses Expo's free cloud build)
cd mobile
eas build --platform android --profile production
eas build --platform ios --profile production
```

---

## Management Commands

### SSH into EC2
```bash
ssh -i ~/.ssh/fitnessapp-key.pem ec2-user@<YOUR_EC2_PUBLIC_IP>
```

### View Logs
```bash
# All services
ssh -i ~/.ssh/fitnessapp-key.pem ec2-user@<IP> 'cd fitnessapp && docker compose logs -f'

# Specific service
ssh -i ~/.ssh/fitnessapp-key.pem ec2-user@<IP> 'cd fitnessapp && docker compose logs -f user-service'
```

### Restart Services
```bash
# Restart all
ssh -i ~/.ssh/fitnessapp-key.pem ec2-user@<IP> 'cd fitnessapp && docker compose restart'

# Restart one service
ssh -i ~/.ssh/fitnessapp-key.pem ec2-user@<IP> 'cd fitnessapp && docker compose restart user-service'
```

### Update Deployment
```bash
# After code changes, rebuild and redeploy
./aws/build-and-push.sh   # Build new images
./aws/deploy.sh            # Deploy to EC2
```

### Stop Everything
```bash
ssh -i ~/.ssh/fitnessapp-key.pem ec2-user@<IP> 'cd fitnessapp && docker compose down'
```

---

## Troubleshooting

### Services crash with OutOfMemoryError
The t2.micro has only 1GB RAM. With 4GB swap, all 9 services should fit, but they'll be slow under load. Options:
1. Reduce services — stop payment/subscription if not needed
2. Upgrade to **t3.small** (2GB RAM, ~$15/month) — much smoother

### Can't connect to RDS from EC2
- Check Security Group: RDS SG must allow port 3306 from EC2 SG
- Check RDS is in same VPC as EC2

### Docker images fail to pull on EC2
- IAM role might not be attached. Run:
  ```bash
  aws ec2 associate-iam-instance-profile \
    --iam-instance-profile Name=fitnessapp-ec2-profile \
    --instance-id <INSTANCE_ID>
  ```

### Services take long to start
- Normal on t2.micro. Each Java service takes 30-60 seconds
- All 9 services may take 3-5 minutes to fully start
- Check: `docker compose ps` — wait until all show "Up"

### EC2 is slow / unresponsive
- Check swap usage: `free -h` (should show 4GB swap)
- Check disk: `df -h` (20GB volume)
- CPU credits: t2.micro has burst credits, may throttle under sustained load

---

## Cost Monitoring

Set up a billing alarm to avoid surprises:

1. Go to **AWS Console** → **Billing** → **Budgets**
2. Click **Create budget**
3. Choose **Zero spend budget** (alerts when any charges occur)
4. Add your email for notifications

**⚠️ Important:** The free tier is valid for **12 months**. After that, set a reminder to either:
- Terminate resources
- Or budget ~$30-40/month for continued hosting

---

## Files Created

```
aws/
├── .env.example            # Environment variable template
├── docker-compose.prod.yml # Docker Compose for all 9 services
├── setup-aws.sh            # One-time AWS infrastructure setup
├── build-and-push.sh       # Build Docker images & push to ECR
└── deploy.sh               # Deploy to EC2 instance
```

