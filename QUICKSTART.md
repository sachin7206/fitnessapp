# Quick Start Guide - Month 1 Setup

This guide will help you get the Fitness Wellness Platform up and running in under 30 minutes!

## 🎯 What's Been Built (Month 1)

### Backend (Spring Boot + Java)
✅ User authentication (Register, Login, JWT)
✅ User profile management
✅ Health metrics tracking
✅ Goal setting
✅ MySQL integration
✅ Security with JWT tokens

### Mobile App (React Native + Expo)
✅ Authentication screens (Login/Register)
✅ Home dashboard
✅ Profile management with tabs
✅ Multi-language support (English, Hindi, Tamil, Telugu)
✅ Regional customization (North, South, East, West India)
✅ Redux state management
✅ Auto token refresh

---

## 🚀 Quick Start

### Step 1: Start MySQL
```bash
# macOS with Homebrew
brew services start mysql

# Verify it's running
mysql -u root -p
# Type 'exit' to quit
```

### Step 2: Start Backend
```bash
cd backend

# Run the backend (Gradle wrapper included)
./gradlew bootRun
```

Backend will be available at: **http://localhost:8080/api**

### Step 3: Start Mobile App
Open a new terminal:
```bash
cd mobile

# Install dependencies (first time only)
npm install

# Start Expo
npm start
```

Press `i` for iOS simulator or `a` for Android emulator.

---

## 📱 Testing the App

### 1. Register a New User
- Open the app
- Click "Sign Up"
- Fill in:
  - Name: Test User
  - Email: test@example.com
  - Password: password123
  - Phone: 9876543210
  - Language: English
  - Region: North India
- Click "Sign Up"
- You'll be automatically logged in!

### 2. Explore Home Screen
- View your dashboard
- See quick action cards (coming in Phase 2)

### 3. Update Your Profile
- Go to "Profile" tab
- **Personal Tab**: Update name, age, gender, phone
- **Health Tab**: Add height, weight, target weight, activity level
- **Goals Tab**: Select fitness goals (weight loss, muscle gain, etc.)
- Save each section

### 4. Test Logout and Login
- Click "Logout" on home screen
- Login again with your credentials

---

## 🧪 Testing Backend APIs (Optional)

### Test Health Endpoint
```bash
curl http://localhost:8080/api/health
```

### Test Registration
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sachin@example.com",
    "password": "secure123",
    "firstName": "Sachin",
    "lastName": "Bisht",
    "phone": "9876543210",
    "language": "hi",
    "region": "NORTH"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sachin@example.com",
    "password": "secure123"
  }'
```

Save the `accessToken` from the response and use it for authenticated requests:

### Get Profile
```bash
curl -X GET http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## 📂 Project Structure Overview

```
fitnessapp/
├── backend/                          # Spring Boot Backend
│   ├── src/main/java/com/fitnessapp/
│   │   ├── FitnessApplication.java  # Main application
│   │   ├── config/                   # Security & CORS config
│   │   ├── controller/               # REST controllers
│   │   ├── dto/                      # Data transfer objects
│   │   ├── model/                    # MongoDB entities
│   │   ├── repository/               # Database repositories
│   │   ├── security/                 # JWT & Security
│   │   ├── service/                  # Business logic
│   │   └── exception/                # Exception handling
│   ├── src/main/resources/
│   │   └── application.properties   # Configuration
│   └── pom.xml                      # Maven dependencies
│
├── mobile/                           # React Native Mobile App
│   ├── src/
│   │   ├── config/                  # API & theme config
│   │   ├── navigation/              # App navigation
│   │   ├── screens/                 # UI screens
│   │   ├── services/                # API services
│   │   └── store/                   # Redux store
│   ├── App.js                       # App entry point
│   └── package.json                 # npm dependencies
│
└── docs/                            # Documentation
    ├── MONTH1_PLAN.md
    ├── BACKEND_SETUP.md
    └── MOBILE_SETUP.md
```

---

## 🎨 App Features

### Current Features (Month 1)
- ✅ User Registration with regional preferences
- ✅ Secure Login with JWT
- ✅ Multi-language support (6 Indian languages)
- ✅ Regional customization (4 regions)
- ✅ Profile management
- ✅ Health metrics tracking
- ✅ Goal setting
- ✅ Auto token refresh
- ✅ Secure logout

### Coming in Month 2-4 (Phase 2)
- 🔄 Personalized workout plan generation
- 🔄 Exercise library with Indian fitness (Yoga, dance forms)
- 🔄 Regional diet plans (North/South/East/West Indian cuisines)
- 🔄 Progress tracking and analytics
- 🔄 AI-powered recommendations

---

## 🔒 Security Features

- Password hashing with BCrypt
- JWT token-based authentication
- Automatic token refresh
- CORS protection
- Input validation
- Session management

---

## 🌏 Regional & Cultural Features

### Languages Supported
- English (en)
- हिंदी - Hindi (hi)
- தமிழ் - Tamil (ta)
- తెలుగు - Telugu (te)
- मराठी - Marathi (mr)
- ગુજરાતી - Gujarati (gu)

### Regions
- **North India**: Punjabi, Hindi culture
- **South India**: Tamil, Telugu, Kannada, Malayalam cultures
- **East India**: Bengali, Odia, Assamese cultures
- **West India**: Marathi, Gujarati cultures

Each region will have customized:
- Diet plans with local cuisines
- Exercise recommendations
- Cultural fitness practices

---

## 🐛 Troubleshooting

### Backend won't start
1. Check Java version: `java -version` (must be 17+)
2. Check MongoDB is running: `mongosh`
3. Check port 8080 is free: `lsof -i :8080`

### Mobile app won't start
1. Clear cache: `cd mobile && npm start -- --clear`
2. Delete node_modules: `rm -rf node_modules && npm install`
3. Check Node version: `node --version` (must be 18+)

### Can't connect to backend from mobile app
1. Ensure backend is running
2. If using physical device, update API URL in `mobile/src/config/api.js` with your computer's IP
3. Check firewall settings

---

## 📞 Support

For issues or questions, refer to:
- `docs/BACKEND_SETUP.md` - Detailed backend setup
- `docs/MOBILE_SETUP.md` - Detailed mobile setup
- `docs/MONTH1_PLAN.md` - Month 1 planning and architecture

---

## ✅ Month 1 Checklist

- [ ] MongoDB installed and running
- [ ] Backend starts successfully
- [ ] Mobile app starts successfully
- [ ] Can register a new user
- [ ] Can login with registered user
- [ ] Can view and edit profile
- [ ] Can update health metrics
- [ ] Can set fitness goals
- [ ] Can logout and login again

Once all checkboxes are complete, you're ready for Phase 2!

---

## 🎯 Next Steps

After completing Month 1 setup, the roadmap for Month 2 includes:
1. Exercise library with 50+ exercises
2. Basic workout plan generator
3. Regional diet plan templates
4. Progress tracking dashboard
5. Multi-language content for exercises

Happy coding! 🚀💪

