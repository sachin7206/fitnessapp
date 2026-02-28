# 🏋️ Personalized Fitness & Wellness Ecosystem for India

**A complete tech platform offering hyper-personalized fitness, nutrition, and wellness plans tailored to Indian users with regional and cultural customization.**

[![Status](https://img.shields.io/badge/Status-Month%201%20Complete-success)](./PROJECT_STATUS.md)
[![Backend](https://img.shields.io/badge/Backend-Spring%20Boot%203.2-green)](./backend)
[![Mobile](https://img.shields.io/badge/Mobile-React%20Native-blue)](./mobile)
[![Database](https://img.shields.io/badge/Database-MongoDB-brightgreen)](https://www.mongodb.com/)

---

## 🌟 Unique Value Proposition

Most fitness apps are generic or Western-centric. This platform:
- ✅ Respects India's diverse food culture (regional cuisines)
- ✅ Integrates traditional Indian fitness (Yoga, Pranayama, regional dances)
- ✅ Supports 6+ Indian languages
- ✅ Addresses regional health challenges (diabetes, heart disease)
- ✅ Offers culturally relevant dietary options (vegetarian, Jain, etc.)

---

## 🎯 Key Features

### Core Features (Month 1 - ✅ COMPLETE)
- 🔐 **Secure Authentication**: JWT-based login/registration
- 👤 **User Profiles**: Personal info, health metrics, fitness goals
- 🌏 **Multi-Language**: English, Hindi, Tamil, Telugu, Marathi, Gujarati
- 🗺️ **Regional Customization**: North, South, East, West India
- 💪 **Exercise Library**: Yoga, strength training, cardio, Indian traditional

### Upcoming Features (Months 2-9)
- 🤖 **AI-Powered Recommendations**: Personalized workout & diet plans
- 🥗 **Regional Diet Plans**: Authentic Indian regional cuisines
- 📊 **Progress Tracking**: Weight, measurements, workout logs
- 👥 **Community**: Challenges, leaderboards, social features
- 📹 **Live Sessions**: Expert-led workout classes
- ⌚ **Wearable Integration**: Sync with fitness devices
- 🛒 **Grocery Integration**: Order ingredients for meal plans

---

## 🏗️ Tech Stack

### Backend
- **Language**: Java 17
- **Framework**: Spring Boot 3.2.2
- **Database**: MySQL (Relational Database)
- **Security**: JWT + Spring Security
- **Build Tool**: Gradle

### Mobile
- **Framework**: React Native (cross-platform iOS & Android)
- **Tooling**: Expo
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation v6
- **API Client**: Axios with interceptors

---

## 📁 Project Structure

```
fitnessapp/
├── 📄 START_HERE.md              ← READ THIS FIRST!
├── 📄 QUICKSTART.md              Quick 30-min setup
├── 📄 GETTING_STARTED.md         Complete setup guide
├── 📄 PROJECT_STATUS.md          Current status
│
├── 🔧 setup.sh                   Automated setup
├── 🔧 start.sh                   Start all services
│
├── 🖥️  backend/                  Spring Boot API
│   ├── src/main/java/com/fitnessapp/
│   │   ├── controller/          REST endpoints
│   │   ├── service/             Business logic
│   │   ├── repository/          Database access
│   │   ├── model/               MongoDB entities
│   │   ├── security/            JWT & auth
│   │   └── dto/                 Request/Response objects
│   └── pom.xml                  Maven dependencies
│
├── 📱 mobile/                    React Native App
│   ├── src/
│   │   ├── screens/             UI screens
│   │   ├── navigation/          App navigation
│   │   ├── store/               Redux state
│   │   ├── services/            API calls
│   │   └── config/              Configuration
│   └── package.json             npm dependencies
│
└── 📚 docs/                      Documentation
    ├── MONTH1_PLAN.md
    ├── BACKEND_SETUP.md
    ├── MOBILE_SETUP.md
    ├── API_TESTING.md
    └── DEVELOPMENT_GUIDE.md
```

---

## ⚡ Quick Start

### Prerequisites
- Java 17+
- Maven 3.6+
- Node.js 18+
- MongoDB 7.0+
- Expo CLI

See `GETTING_STARTED.md` for installation instructions.

### Start Backend
```bash
cd backend
./gradlew bootRun
```

Backend will run at: **http://localhost:8080/api**

### Start Mobile App
```bash
cd mobile
npm install  # First time only
npm start
```

---

## 🎯 Development Roadmap

### ✅ Phase 1: Foundation (Month 1) - COMPLETE!
- [x] Market research and feature definition
- [x] MVP scope definition
- [x] Backend foundation with authentication
- [x] Mobile app foundation with navigation
- [x] User authentication implementation
- [x] Profile management (personal, health, goals)
- [x] Multi-language & regional support
- [x] Exercise library foundation

### 🔄 Phase 2: MVP Development (Months 2-4) - NEXT
- [ ] AI-powered workout plan generator
- [ ] Regional diet plan templates
- [ ] Exercise library expansion (50+ exercises with videos)
- [ ] Progress tracking dashboard
- [ ] Payment integration (Razorpay)
- [ ] Advanced multi-language content

### 📅 Phase 3: Beta Testing (Month 5)
- [ ] Beta release to 100 users
- [ ] Feedback collection
- [ ] Bug fixes and optimization

### 🚀 Phase 4: Feature Expansion (Months 6-8)
- [ ] Community features (challenges, leaderboards)
- [ ] Live workout sessions
- [ ] Wearable device integration
- [ ] Grocery delivery partnership

### 🎉 Phase 5: Launch (Month 9)
- [ ] Public launch on App Store & Play Store
- [ ] Marketing campaigns
- [ ] Partnership with gyms and nutritionists

### 🔄 Phase 6: Continuous Improvement (Ongoing)
- [ ] Feature enhancements based on feedback
- [ ] AI model improvements
- [ ] Scale infrastructure
- [ ] Expand to more languages and regions

---

## 📊 Current Status

**Month 1: COMPLETED ✅**

- 25+ Java backend classes
- 15+ React Native components
- 10+ exercise library entries
- 10 REST API endpoints
- Complete authentication system
- Multi-language support foundation
- 2,000+ lines of documentation

---

## 🎓 For Developers

### Backend Development
```bash
cd backend

# Run with live reload
./mvnw spring-boot:run

# Run tests
./mvnw test

# Build for production
./mvnw clean package
```

### Mobile Development
```bash
cd mobile

# Start development server
npm start

# Clear cache
npm start -- --clear

# Run on specific platform
npm run ios    # iOS only
npm run android  # Android only
```

### API Testing
See `docs/API_TESTING.md` for curl examples.

---

## 🌍 Target Market

### Primary Users
- Young professionals (25-35) in metro cities
- Health-conscious adults (35-50) managing conditions
- Fitness enthusiasts (18-30) seeking guidance
- Homemakers (25-50) wanting home workouts

### Geographic Focus
- Metro cities: Delhi, Mumbai, Bangalore, Chennai, Hyderabad
- Tier-2 cities: Pune, Jaipur, Ahmedabad, Kolkata
- Expanding to smaller towns with regional content

---

## 💰 Monetization Strategy

1. **Freemium Model**
   - Free: Basic workouts, diet plans
   - Premium (₹299/month): AI recommendations, advanced features
   - Pro (₹499/month): Live sessions, personal coaching

2. **Partnerships**
   - Local gyms: Discounted memberships
   - Nutritionists: Consultation bookings
   - Supplement brands: Affiliate commissions
   - Grocery apps: Integration revenue

3. **In-App Purchases**
   - Specialized programs (yoga, strength, etc.)
   - Celebrity trainer plans
   - Premium content

---

## 📸 Screenshots

*To be added - Run the app and take screenshots!*

---

## 🤝 Contributing

This is a proprietary project. For collaboration opportunities, please contact the owner.

---

## 📄 License

Proprietary - All Rights Reserved  
© 2026 Fitness Wellness Platform

---

## 🎉 Get Started Now!

👉 **Read [START_HERE.md](./START_HERE.md)** for the complete overview!

Or jump to:
- 🚀 [QUICKSTART.md](./QUICKSTART.md) - Get running in 30 minutes
- 📖 [GETTING_STARTED.md](./GETTING_STARTED.md) - Detailed setup guide
- 📊 [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Current status

---

**Built with ❤️ for India's fitness revolution 🇮🇳**


