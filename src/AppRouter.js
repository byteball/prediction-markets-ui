import { Routes, Route, unstable_HistoryRouter as HistoryRouter } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';

import { CreatePage, MainPage, MarketPage, FaqPage } from "pages";
import { historyInstance } from "./historyInstance";

const AppRouter = () => {
  return <HelmetProvider>
    <HistoryRouter history={historyInstance}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/:category" element={<MainPage />} />
        <Route path="/:category/:particle" element={<MainPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/market/*" element={<MarketPage />} />
      </Routes>
    </HistoryRouter>
  </HelmetProvider>
}

export default AppRouter;