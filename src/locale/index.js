import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./es-ES.json";
import pt from "./pt-BR.json";
import zh from "./zh-CN.json";
import ru from "./ru-RU.json";
import uk from "./uk-UA.json";

// import  translations  from "./translations";
// the translations
// (tip move them in a JSON file and import them)

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      es: {
        translation: es
      },
      pt: {
        translation: pt
      },
      zh: {
        translation: zh
      },
      ru: {
        translation: ru
      },
      uk: {
        translation: uk
      },
    },
    lng: "en",
    keySeparator: ".", // we do not use keys in form messages.welcome

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;