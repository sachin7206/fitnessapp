# 🏋️ Fitness Wellness Platform - Getting Started

## 📋 Prerequisites Installation

Before setting up the project, you need to install these tools:

### 1. Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Java 17
```bash
brew install openjdk@17

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
java -version  # Should show version 17+
```

### 3. Install Gradle (Optional - wrapper included)
```bash
# Gradle wrapper is included, but you can install globally
brew install gradle
gradle -version
```

### 4. Install Node.js and npm
```bash
brew install node@20

# Verify
node -version  # Should show v20+
npm -version
```

### 5. Install MySQL
```bash
brew install mysql

# Start MySQL
brew services start mysql

# Secure installation (set root password)
mysql_secure_installation

# Verify
mysql -u root -p
# Type 'exit' to quit
```

### 6. Install Expo CLI
```bash
npm install -g expo-cli
```

---

## 🚀 Project Setup

Once all prerequisites are installed:

### Option 1: Automated Setup
```bash
cd /Users/sbisht/Documents/fitnessapp
./setup.sh
```

### Option 2: Manual Setup

#### Backend Setup
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

#### Mobile Setup (in new terminal)
```bash
cd mobile
npm install
npm start
```

---

## ✅ Verification Checklist

Run these commands to verify everything is installed:

```bash
# Java
java -version  # Should be 17+

# Maven
mvn -version

# Node.js
node -version  # Should be 18+

# npm
npm -version

# MongoDB
mongosh  # Should connect, then type 'exit'

# Expo
expo --version
```

---

## 🎯 First Time Setup Steps

### Step 1: Clone/Navigate to Project
```bash
cd /Users/sbisht/Documents/fitnessapp
```

### Step 2: Install Prerequisites
Follow the "Prerequisites Installation" section above.

### Step 3: Configure MySQL Database
```bash
# Create database (it will be auto-created, but you can do it manually)
mysql -u root -p
CREATE DATABASE IF NOT EXISTS fitnessapp;
EXIT;

# Update password in backend/src/main/resources/application.properties if needed
# spring.datasource.password=your_mysql_root_password
```

### Step 4: Start Backend
```bash
cd backend
./gradlew bootRun
```

Wait for: "Started FitnessApplication in X seconds"

### Step 5: Test Backend
Open new terminal:
```bash
curl http://localhost:8080/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "UP",
    "service": "Fitness Wellness Backend",
    "version": "1.0.0"
  }
}
```

### Step 6: Start Mobile App
Open new terminal:
```bash
cd mobile
npm install
npm start
```

### Step 7: Run on Simulator
- Press `i` for iOS simulator (Mac only)
- Press `a` for Android emulator
- Or scan QR code with Expo Go app on your phone

### Step 8: Test the App
1. Click "Sign Up"
2. Fill in registration form
3. Select language and region
4. Create account
5. Explore home screen
6. Go to Profile tab
7. Update profile information
8. Add health metrics
9. Select fitness goals

---

## 📱 Mobile App Testing (Physical Device)

To test on your actual phone:

1. Install "Expo Go" app:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. Update API URL in `mobile/src/config/api.js`:
   ```javascript
   // Find your computer's IP
   // Run: ipconfig getifaddr en0
   
   const API_URL = 'http://YOUR_IP_ADDRESS:8080/api';
   // Example: 'http://192.168.1.100:8080/api'
   ```

3. Start mobile app: `npm start`

4. Scan QR code with Expo Go app

---

## 🐛 Common Issues & Solutions

### Issue: "Maven not found"
**Solution**: 
```bash
./install-maven.sh
# OR
brew install maven
```

### Issue: "Node/npm not found"
**Solution**:
```bash
brew install node@20
```

### Issue: "MongoDB connection failed"
**Solution**:
```bash
# Start MongoDB
brew services start mongodb-community@7.0

# Check status
brew services list | grep mongodb
```

### Issue: "Port 8080 already in use"
**Solution**:
```bash
# Find and kill the process
lsof -ti:8080 | xargs kill -9

# OR change port in backend/src/main/resources/application.properties
server.port=8081
```

### Issue: "Cannot connect to backend from mobile app"
**Solution**:
- Ensure backend is running: `curl http://localhost:8080/api/health`
- If testing on physical device, update API URL with your computer's IP
- Check firewall settings

### Issue: "Metro bundler cache issues"
**Solution**:
```bash
cd mobile
npm start -- --clear
```

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| `QUICKSTART.md` | Quick 30-min setup guide |
| `SETUP_COMPLETE.md` | Month 1 achievements summary |
| `docs/MONTH1_PLAN.md` | Detailed planning and architecture |
| `docs/BACKEND_SETUP.md` | Backend technical guide |
| `docs/MOBILE_SETUP.md` | Mobile app technical guide |
| `docs/API_TESTING.md` | API testing with curl |
| `docs/DEVELOPMENT_GUIDE.md` | Development best practices |

---

## 🎓 Learning Path

### For Backend Development
1. Learn Spring Boot basics
2. Understand Spring Security
3. Learn MongoDB and data modeling
4. Study JWT authentication
5. Practice REST API design

### For Mobile Development
1. Learn React and React Hooks
2. Understand React Native components
3. Learn Redux Toolkit
4. Study React Navigation
5. Practice async operations

### Resources
- Spring Boot Guide: https://spring.io/guides/gs/spring-boot/
- React Native Docs: https://reactnative.dev/
- Redux Toolkit: https://redux-toolkit.js.org/
- MongoDB University: https://university.mongodb.com/

---

## 🤝 Contributing

When adding new features:
1. Create a feature branch
2. Follow existing code patterns
3. Add tests for new functionality
4. Update documentation
5. Test thoroughly before committing

---

## 🔐 Security Notes

### Development
- Default JWT secret is fine for development
- MongoDB running without authentication is OK locally

### Production (Future)
- Use environment variables for secrets
- Enable MongoDB authentication
- Use HTTPS only
- Implement rate limiting
- Add API key for mobile app
- Set up proper CORS origins

---

## 📈 Next Development Phase

Ready to start Phase 2? Here's what to implement next:

1. **Workout Plan Generator** (Week 1-2)
   - Algorithm to generate personalized workout plans
   - Consider user goals, fitness level, available equipment
   - Regional preferences (yoga for some regions, gym for others)

2. **Exercise Library Expansion** (Week 2-3)
   - Add 50+ exercises with detailed descriptions
   - Upload exercise videos
   - Multi-language exercise instructions

3. **Regional Diet Plans** (Week 3-4)
   - Create diet templates for each region
   - North Indian: Roti, Dal, Paneer-based meals
   - South Indian: Rice, Sambhar, Idli-based meals
   - Include calorie and macro calculations

4. **Progress Tracking** (Week 4)
   - Weight tracking with graph
   - Workout completion tracking
   - Photo progress (before/after)

---

## 💪 Motivation

You've completed Month 1 successfully! This is a solid foundation for a revolutionary fitness platform tailored for India's diverse culture and needs.

**Keep building! 🚀**

---

*Last updated: February 25, 2026*

