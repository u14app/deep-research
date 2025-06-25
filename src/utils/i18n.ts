import i18next from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import locales from "@/constants/locales";
import { keys } from "radash";

const normalizeLocale = (locale: string) => {
  if (locale.startsWith("en")) {
    return "en-US";
  } else if (locale.startsWith("zh")) {
    return "zh-CN";
  } else if (locale.startsWith("es")) {
    return "es-ES";
  } else if (locale.startsWith("vi")) {
    return "vi-VN";
  } else{
    return locale;
  }
};

export function detectLanguage() {
  const languageDetector = new LanguageDetector();
  languageDetector.init();
  const detectedLang = languageDetector.detect();
  let lang: string = "en-US";
  const localeLang = keys(locales);
  if (Array.isArray(detectedLang)) {
    detectedLang.reverse().forEach((langCode) => {
      if (localeLang.includes(langCode)) {
        lang = langCode;
      }
    });
  } else if (typeof detectedLang === "string") {
    if (localeLang.includes(detectedLang)) {
      lang = detectedLang;
    }
  }
  return lang;
}

i18next
  .use(initReactI18next)
  .use(
    resourcesToBackend(async (lang: string) => {
      return await import(`../locales/${normalizeLocale(lang)}.json`);
    })
  )
  .init({
    supportedLngs: keys(locales),
    fallbackLng: "en-US",
  });

export default i18next;
