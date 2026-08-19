import { I18nManager } from 'react-native';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';
import { getString, storage, StorageKeys } from '../lib/storage';

export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const savedLanguage = getString(StorageKeys.language, 'en');

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function isRTL(lang) {
  return RTL_LANGUAGES.includes(lang);
}

/**
 * Switches app language and aligns the native RTL flag.
 * NOTE: flipping RTL requires an app reload to fully re-layout native views;
 * callers should prompt the user to restart when direction changes.
 */
export function setLanguage(lang) {
  storage.set(StorageKeys.language, lang);
  i18n.changeLanguage(lang);
  const shouldBeRTL = isRTL(lang);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    return { needsRestart: true };
  }
  return { needsRestart: false };
}

// Ensure the native RTL flag matches the persisted language on cold start.
I18nManager.allowRTL(true);
if (I18nManager.isRTL !== isRTL(savedLanguage)) {
  I18nManager.forceRTL(isRTL(savedLanguage));
}

export default i18n;
