import { Routes, Route, unstable_HistoryRouter as HistoryRouter } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import moment from "moment";

import 'moment/locale/es';
import 'moment/locale/pt-br';
import 'moment/locale/zh-cn';
import 'moment/locale/ru';
import 'moment/locale/uk';

import { CreatePage, MainPage, MarketPage, FaqPage } from "pages";
import { historyInstance } from "historyInstance";
import { changeLanguage, selectLanguage } from "store/slices/settingsSlice";

import { botCheck } from "utils";

import { langs } from "components/SelectLanguage/SelectLanguage";
import { Layout } from "components/Layout/Layout";

import i18 from './locale/index';

const DEFAULT_LANGUAGE_KEY = 'en';

const AppRouter = () => {
  const lang = useSelector(selectLanguage);
  const dispatch = useDispatch()

  useEffect(() => {
    const pathname = window.location.pathname;
    const langList = langs.map((lang) => lang.name);
    const languageInUrl = langList.includes(pathname.split("/")[1]) ? pathname.split("/")[1] : null;
    let cleanedUrl = pathname;

    if (languageInUrl) {
      cleanedUrl = pathname.replace('/' + languageInUrl, "");
    }

    if (!lang) {
      const languageFromBrowserSettings = navigator.language.split("-")[0];

      const language = botCheck() ? languageInUrl : (languageInUrl || languageFromBrowserSettings);

      if (language && langList.find((lang) => lang === language)) { // if language is in the list
        dispatch(changeLanguage(language));
        moment.locale(getMomentLocaleByLanguageKey(language));

        if (language !== languageInUrl) {
          historyInstance.replace(`${language !== "en" ? '/' + language : ""}${cleanedUrl === "/" && language !== "en" ? "" : cleanedUrl}`);
        }

      } else { // if language is not in the list we use default language
        i18.changeLanguage(DEFAULT_LANGUAGE_KEY);
        historyInstance.replace(cleanedUrl);
        moment.locale(getMomentLocaleByLanguageKey(DEFAULT_LANGUAGE_KEY));
      }

    } else { // if language is already set
      i18.changeLanguage(lang);

      if (lang !== languageInUrl) {
        historyInstance.replace(`${lang !== "en" ? '/' + lang : ""}${cleanedUrl === "/" ? "" : cleanedUrl}`);
      } else if (lang === "en" && languageInUrl === "en") {
        historyInstance.replace(cleanedUrl);
      }

      moment.locale(getMomentLocaleByLanguageKey(lang));
    }

  }, [lang]);

  const langNames = langs.map((lang) => lang.name);
  langNames.push('');

  return <HelmetProvider>
    <HistoryRouter history={historyInstance}>
      <Layout>
        <Routes>
          {langNames.map(languageCode => (<Route key={languageCode} path={`/${languageCode}`}>
            <Route path="" element={<MainPage />} />
            <Route path=":category" element={<MainPage />} />
            <Route path=":category/:particle" element={<MainPage />} />
            <Route path="create" element={<CreatePage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="market/*" element={<MarketPage />} />
          </Route>))}
        </Routes>
      </Layout>
    </HistoryRouter>
  </HelmetProvider>
}

export default AppRouter;

const getMomentLocaleByLanguageKey = (languageKey) => {
  if (languageKey === 'zh') return 'zh-cn';
  if (languageKey === 'pt') return 'pt-br';

  return languageKey;
}
