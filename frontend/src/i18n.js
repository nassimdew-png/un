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

export const getStoredLanguage = () => {
  if (typeof window === 'undefined') return 'ar';

  // 1. URL search param (?lang=fr or ?locale=fr)
  try {
    const params = new URLSearchParams(window.location.search);
    const queryLang = params.get('lang') || params.get('locale');
    if (queryLang) {
      return queryLang.startsWith('fr') ? 'fr' : 'ar';
    }
  } catch (e) {}

  // 2. Cookie check
  try {
    const match = document.cookie.match(/(?:^|;\s*)(?:app_language|i18nextLng|locale)=([^;]+)/);
    if (match && match[1]) {
      return match[1].startsWith('fr') ? 'fr' : 'ar';
    }
  } catch (e) {}

  // 3. LocalStorage check
  try {
    const saved = localStorage.getItem('app_language') 
      || localStorage.getItem('i18nextLng') 
      || localStorage.getItem('locale');
    if (saved) {
      return saved.startsWith('fr') ? 'fr' : 'ar';
    }
  } catch (e) {}

  return 'ar';
};

const initialLang = getStoredLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Automatically sync document direction and HTML lang attribute
export const applyDirection = (lng) => {
  const isAr = lng ? lng.startsWith('ar') : true;
  if (typeof document !== 'undefined') {
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = isAr ? 'ar' : 'fr';
  }
};

i18n.on('languageChanged', (lng) => {
  const cleanLng = lng && lng.startsWith('fr') ? 'fr' : 'ar';
  try {
    localStorage.setItem('app_language', cleanLng);
    localStorage.setItem('i18nextLng', cleanLng);
    localStorage.setItem('locale', cleanLng);
    if (typeof document !== 'undefined') {
      document.cookie = `app_language=${cleanLng};path=/;max-age=31536000;SameSite=Lax`;
      document.cookie = `locale=${cleanLng};path=/;max-age=31536000;SameSite=Lax`;
      document.cookie = `i18nextLng=${cleanLng};path=/;max-age=31536000;SameSite=Lax`;
    }
  } catch (e) {}
  applyDirection(cleanLng);
});

// Apply on initial script evaluation
if (typeof document !== 'undefined') {
  applyDirection(initialLang);
}

export default i18n;
