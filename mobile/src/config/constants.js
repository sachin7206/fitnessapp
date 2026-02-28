export const REGIONS = {
  NORTH: 'NORTH',
  SOUTH: 'SOUTH',
  EAST: 'EAST',
  WEST: 'WEST',
};

export const LANGUAGES = {
  ENGLISH: 'en',
  HINDI: 'hi',
  TAMIL: 'ta',
  TELUGU: 'te',
  MARATHI: 'mr',
  GUJARATI: 'gu',
};

export const ACTIVITY_LEVELS = {
  SEDENTARY: 'SEDENTARY',
  LIGHT: 'LIGHT',
  MODERATE: 'MODERATE',
  ACTIVE: 'ACTIVE',
  VERY_ACTIVE: 'VERY_ACTIVE',
};

export const GENDERS = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
};

export const FITNESS_GOALS = {
  WEIGHT_LOSS: 'WEIGHT_LOSS',
  MUSCLE_GAIN: 'MUSCLE_GAIN',
  GENERAL_FITNESS: 'GENERAL_FITNESS',
  FLEXIBILITY: 'FLEXIBILITY',
  ENDURANCE: 'ENDURANCE',
  STRESS_RELIEF: 'STRESS_RELIEF',
};

export const EXERCISE_CATEGORIES = {
  YOGA: 'YOGA',
  STRENGTH: 'STRENGTH',
  CARDIO: 'CARDIO',
  FLEXIBILITY: 'FLEXIBILITY',
  BALANCE: 'BALANCE',
};

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
};

export const DIETARY_PREFERENCES = {
  VEGETARIAN: 'VEGETARIAN',
  VEGAN: 'VEGAN',
  JAIN: 'JAIN',
  NON_VEGETARIAN: 'NON_VEGETARIAN',
  EGGETARIAN: 'EGGETARIAN',
};

export const HEALTH_CONDITIONS = {
  NONE: 'NONE',
  DIABETES: 'DIABETES',
  HYPERTENSION: 'HYPERTENSION',
  HEART_DISEASE: 'HEART_DISEASE',
  THYROID: 'THYROID',
  ASTHMA: 'ASTHMA',
  BACK_PAIN: 'BACK_PAIN',
  KNEE_PAIN: 'KNEE_PAIN',
};

export const REGIONAL_INFO = {
  NORTH: {
    name: 'North India',
    cuisines: ['Punjabi', 'Mughlai', 'Rajasthani', 'UP', 'Haryanvi'],
    languages: ['Hindi', 'Punjabi', 'Haryanvi'],
    fitnessStyles: ['Yoga', 'Gym', 'Walking', 'Bhangra Dance'],
  },
  SOUTH: {
    name: 'South India',
    cuisines: ['Tamil', 'Telugu', 'Kerala', 'Karnataka'],
    languages: ['Tamil', 'Telugu', 'Kannada', 'Malayalam'],
    fitnessStyles: ['Yoga', 'Kalaripayattu', 'Walking', 'Bharatanatyam'],
  },
  EAST: {
    name: 'East India',
    cuisines: ['Bengali', 'Odia', 'Assamese'],
    languages: ['Bengali', 'Odia', 'Assamese'],
    fitnessStyles: ['Yoga', 'Walking', 'Traditional Sports'],
  },
  WEST: {
    name: 'West India',
    cuisines: ['Maharashtrian', 'Gujarati', 'Goan'],
    languages: ['Marathi', 'Gujarati', 'Konkani'],
    fitnessStyles: ['Yoga', 'Garba', 'Dandiya', 'Gym'],
  },
};

export default {
  REGIONS,
  LANGUAGES,
  ACTIVITY_LEVELS,
  GENDERS,
  FITNESS_GOALS,
  EXERCISE_CATEGORIES,
  DIFFICULTY_LEVELS,
  DIETARY_PREFERENCES,
  HEALTH_CONDITIONS,
  REGIONAL_INFO,
};

