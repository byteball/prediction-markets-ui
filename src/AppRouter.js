import { Routes, Route, unstable_HistoryRouter as HistoryRouter } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';

import 'moment/locale/es';
import 'moment/locale/pt-br';
import 'moment/locale/zh-cn';
import 'moment/locale/ru';
import 'moment/locale/uk';

import { CreatePage, MainPage, MarketPage, FaqPage } from "pages";
import { historyInstance } from "historyInstance";

import { langs } from "components/SelectLanguage/SelectLanguage";
import { Layout } from "components/Layout/Layout";

const AppRouter = () => (<HelmetProvider>
  <HistoryRouter history={historyInstance}>
    <Layout>
      <Routes>
        {["", ...langs.map((lang) => lang.name)].map(languageCode => (<Route key={languageCode} path={`/${languageCode}`}>
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
</HelmetProvider>)

export default AppRouter;