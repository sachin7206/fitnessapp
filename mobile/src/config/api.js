// API Configuration
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Production API URL - set this when deploying to cloud
const PRODUCTION_API_URL = Constants.expoConfig?.extra?.apiUrl || null;

// Local development settings
const BACKEND_IP = '192.168.1.2';
const BACKEND_PORT = '8080';

const getApiUrl = () => {
  // Use production URL if available (set via app.json extra or env)
  if (PRODUCTION_API_URL) {
    return PRODUCTION_API_URL;
  }

  // Check if running in production mode
  if (!__DEV__ && PRODUCTION_API_URL) {
    return PRODUCTION_API_URL;
  }

  if (Platform.OS === 'web') {
    // Web (Chrome) - use localhost
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
    console.log('Could not get Expo IP, using fallback');
  }

  // Fallback to hardcoded IP
  return `http://${BACKEND_IP}:${BACKEND_PORT}/api`;
};

const API_URL = getApiUrl();

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

