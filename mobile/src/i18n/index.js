import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all locale files
import en from './locales/en';
import hi from './locales/hi';
import ta from './locales/ta';
import te from './locales/te';
import kn from './locales/kn';
import ml from './locales/ml';
import bn from './locales/bn';
import mr from './locales/mr';
import gu from './locales/gu';
import pa from './locales/pa';
import or_ from './locales/or';

// All supported languages with native names
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'कॉशुर' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो' },
];

// Translation map
const translations = {
  en, hi, ta, te, kn, ml, bn, mr, gu, pa,
  or: or_,
  // Languages without dedicated files will fall back to Hindi or English
  as: bn, // Assamese is similar to Bengali
  ur: hi, // Urdu shares vocabulary with Hindi
  mai: hi, // Maithili similar to Hindi
  sa: hi,  // Sanskrit → Hindi fallback
  kok: mr, // Konkani → Marathi fallback
  mni: bn, // Manipuri → Bengali fallback
  doi: hi, // Dogri → Hindi fallback
  ne: hi,  // Nepali → Hindi fallback
  sd: hi,  // Sindhi → Hindi fallback
  ks: hi,  // Kashmiri → Hindi fallback
  sat: hi, // Santali → Hindi fallback
  brx: hi, // Bodo → Hindi fallback
};

const STORAGE_KEY = '@fitnessapp_language';

// Deep get helper: t('home.greeting') → translations.home.greeting
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const [locale, setLocaleState] = useState('en');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved language on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved && translations[saved]) {
        setLocaleState(saved);
      }
      setIsLoaded(true);
    }).catch(() => setIsLoaded(true));
  }, []);

  const setLocale = useCallback(async (lang) => {
    const code = lang || 'en';
    setLocaleState(code);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, code);
    } catch (e) {
      
    }
  }, []);

  // Translation function: t('home.greeting') or t('home.greeting', { name: 'Sachin' })
  const t = useCallback((key, params) => {
    const currentTranslations = translations[locale] || en;
    let value = getNestedValue(currentTranslations, key);

    // Fallback to English if key not found in current locale
    if (value === undefined || value === null) {
      value = getNestedValue(en, key);
    }

    // Still not found — return the key itself
    if (value === undefined || value === null) {
      return key;
    }

    // Replace {{param}} placeholders if params provided
    if (params && typeof value === 'string') {
      Object.keys(params).forEach(param => {
        value = value.replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), params[param]);
      });
    }

    return value;
  }, [locale]);

  const contextValue = {
    locale,
    setLocale,
    t,
    isLoaded,
    languages: LANGUAGES,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

// Hook to use translations
export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

export default { I18nProvider, useTranslation, LANGUAGES };

