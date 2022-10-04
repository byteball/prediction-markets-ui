import { Routes, Route, unstable_HistoryRouter as HistoryRouter } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import moment from "moment";

import 'moment/locale/es';
import 'moment/locale/pt';

import { CreatePage, MainPage, MarketPage, FaqPage } from "pages";
import { historyInstance } from "historyInstance";
import { changeLanguage, selectLanguage } from "store/slices/settingsSlice";
import i18 from './locale/index';
import { langs } from "components/SelectLanguage/SelectLanguage";

const AppRouter = () => {
  const lang = useSelector(selectLanguage);
  const dispatch = useDispatch()

  useEffect(() => {
    if (!lang) {
      const firstPath = window.location.pathname.split("/")?.[1];

      if (firstPath && langs.find((lang) => lang.name === firstPath)) {
        dispatch(changeLanguage(firstPath));
        moment.locale(firstPath);
      } else {
        dispatch(changeLanguage("en"));
        moment.locale("en");
      }
    } else {
      i18.changeLanguage(lang);
      moment.locale(lang);
    }

  }, [lang]);

  const langNames = langs.map((lang) => lang.name);
  langNames.push('/');

  return <HelmetProvider>
   
      <HistoryRouter history={historyInstance}>
        <Routes>
          {langNames.map(lng => (<Route key={lng} path={`/${lng}`}>
            <Route path="" element={<MainPage />} />
            <Route path=":category" element={<MainPage />} />
            <Route path=":category/:particle" element={<MainPage />} />
            <Route path="create" element={<CreatePage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="market/*" element={<MarketPage />} />
          </Route>))}
        </Routes>
      </HistoryRouter>
  </HelmetProvider>
}

export default AppRouter;