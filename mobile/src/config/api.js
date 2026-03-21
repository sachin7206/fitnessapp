// API Configuration
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Production API URL sources (checked in order):
// 1. EXPO_PUBLIC_API_URL env var (set at build time)
// 2. app.json extra.apiUrl
// 3. Auto-detect local development
const PRODUCTION_API_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  Constants.expoConfig?.extra?.apiUrl ||
  null;

// Local development settings
const BACKEND_IP = '192.168.1.2';
const BACKEND_PORT = '8080';

const getApiUrl = () => {
  try {
    // Use production URL if available
    if (PRODUCTION_API_URL && typeof PRODUCTION_API_URL === 'string') {
      return PRODUCTION_API_URL;
    }

    if (Platform.OS === 'web') {
      // Deployed web app - check if we're NOT on localhost
      if (typeof window !== 'undefined' &&
          window.location &&
          window.location.hostname !== 'localhost' &&
          window.location.hostname !== '127.0.0.1') {
        // We're deployed but no API URL was set - show error
        
        // Fall through to localhost which will fail gracefully
      }
      return `http://localhost:${BACKEND_PORT}/api`;
    }

    // For mobile devices (iOS/Android), try to get IP from Expo
    try {
      const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
      const expoIp = debuggerHost?.split(':')[0];
      if (expoIp && expoIp !== 'localhost' && expoIp !== '127.0.0.1') {
        return `http://${expoIp}:${BACKEND_PORT}/api`;
      }
    } catch (e) {
      
    }

    // Fallback to hardcoded IP
    return `http://${BACKEND_IP}:${BACKEND_PORT}/api`;
  } catch (e) {
    
    return `http://localhost:${BACKEND_PORT}/api`;
  }
};

const API_URL = String(getApiUrl());

export default {
  API_URL,
  AUTH: {
    REGISTER: `${API_URL}/auth/register`,
    LOGIN: `${API_URL}/auth/login`,
    REFRESH: `${API_URL}/auth/refresh`,
    LOGOUT: `${API_URL}/auth/logout`,
  },
  USER: {
    PROFILE: `${API_URL}/users/profile`,
    HEALTH_METRICS: `${API_URL}/users/health-metrics`,
    GOALS: `${API_URL}/users/goals`,
  },
  TIMEOUT: 30000,
  LONG_TIMEOUT: 60000,
};

