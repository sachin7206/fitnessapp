# Mobile App Setup Guide

## Prerequisites
- Node.js 18+ and npm
- Expo CLI
- iOS Simulator (for Mac) or Android Studio (for Android development)

## Installation Steps

### 1. Install Node.js and npm
Check if already installed:
```bash
node --version
npm --version
```

If not installed, download from: https://nodejs.org/

### 2. Install Expo CLI globally
```bash
npm install -g expo-cli
```

### 3. Install Project Dependencies
```bash
cd mobile
npm install
```

### 4. Start the Development Server

```bash
npm start
```

This will open Expo DevTools in your browser.

### 5. Run on Device/Simulator

#### For iOS (Mac only):
- Press `i` in the terminal, or
- Click "Run on iOS simulator" in Expo DevTools

#### For Android:
- Press `a` in the terminal, or
- Click "Run on Android device/emulator" in Expo DevTools

#### For Physical Device:
- Install "Expo Go" app from App Store (iOS) or Play Store (Android)
- Scan the QR code shown in the terminal

## Configuration

### Update API URL
If your backend is not running on localhost:8080, update the API URL in:
`mobile/src/config/api.js`

For physical device testing, replace `localhost` with your computer's IP address:
```javascript
const API_URL = 'http://192.168.1.XXX:8080/api';
```

To find your IP:
```bash
# macOS
ipconfig getifaddr en0
```

## Project Structure

```
mobile/
├── src/
│   ├── config/          # Configuration files
│   │   ├── api.js       # API endpoints
│   │   └── theme.js     # Theme and styling
│   ├── navigation/      # Navigation setup
│   │   └── AppNavigator.js
│   ├── screens/         # App screens
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── HomeScreen.js
│   │   └── ProfileScreen.js
│   ├── services/        # API services
│   │   ├── apiClient.js
│   │   ├── authService.js
│   │   └── userService.js
│   └── store/           # Redux store
│       ├── store.js
│       └── slices/
│           ├── authSlice.js
│           └── userSlice.js
├── App.js               # App entry point
├── app.json            # Expo configuration
├── package.json        # Dependencies
└── babel.config.js     # Babel configuration
```

## Features Implemented

### Authentication
- ✅ User Registration with regional preferences
- ✅ User Login with JWT tokens
- ✅ Auto token refresh
- ✅ Logout functionality

### User Profile
- ✅ View and edit personal information
- ✅ Update health metrics (height, weight, activity level)
- ✅ Set fitness goals
- ✅ Multi-language and region selection

### Navigation
- ✅ Auth screens (Login/Register)
- ✅ Main app tabs (Home/Profile)
- ✅ Automatic navigation based on auth state

## Testing the App

### Test User Registration Flow:
1. Launch the app
2. Click "Sign Up" on login screen
3. Fill in registration form
4. Select language (English/Hindi/Tamil/Telugu)
5. Select region (North/South/East/West India)
6. Click "Sign Up"
7. You should be automatically logged in

### Test Login Flow:
1. After registration, logout from home screen
2. Enter email and password on login screen
3. Click "Login"
4. You should see the home screen

### Test Profile Management:
1. Navigate to Profile tab
2. Update personal information in "Personal" tab
3. Add health metrics in "Health" tab
4. Select fitness goals in "Goals" tab
5. Save each section

## Troubleshooting

### Metro Bundler Issues
Clear cache:
```bash
npm start -- --clear
```

### Connection Refused Error
- Ensure backend is running on localhost:8080
- If testing on physical device, update API_URL with your computer's IP

### Module Not Found
Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

## Next Steps (Phase 2)
- Implement workout plan generation
- Add exercise library with videos
- Create regional diet plan templates
- Implement progress tracking dashboard
- Add community features

