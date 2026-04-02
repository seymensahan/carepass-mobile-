import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import fr from "./locales/fr.json";
import en from "./locales/en.json";

const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

// Detect device language, default to French
const deviceLang = Localization.getLocales()?.[0]?.languageCode ?? "fr";
const supportedLangs = Object.keys(resources);
const fallbackLng = "fr";

i18n.use(initReactI18next).init({
  resources,
  lng: supportedLangs.includes(deviceLang) ? deviceLang : fallbackLng,
  fallbackLng,
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: "v4",
});

export default i18n;
