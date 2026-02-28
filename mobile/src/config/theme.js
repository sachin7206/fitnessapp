// Theme configuration for the app
export const colors = {
  primary: '#FF6B35', // Vibrant orange - energy and motivation
  secondary: '#004E89', // Deep blue - trust and stability
  accent: '#F7B801', // Golden yellow - achievement
  success: '#06D6A0', // Teal green - health and wellness
  error: '#EF476F', // Red - alerts
  warning: '#FFB703', // Amber - caution

  // Neutrals
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: {
    primary: '#212529',
    secondary: '#6C757D',
    light: '#ADB5BD',
    inverse: '#FFFFFF',
  },

  // Gradients
  gradient: {
    primary: ['#FF6B35', '#F7B801'],
    secondary: ['#004E89', '#06D6A0'],
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export default {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
};

