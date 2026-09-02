import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import arTranslation from './locales/ar.json';
import frTranslation from './locales/fr.json';

const resources = {
  ar: {
    translation: arTranslation,
  },
  fr: {
    translation: frTranslation,
  },
};

const savedLanguage = localStorage.getItem('app_language') || localStorage.getItem('i18nextLng') || 'ar';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage.startsWith('fr') ? 'fr' : 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
