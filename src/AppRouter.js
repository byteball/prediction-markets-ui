import { Routes, Route, unstable_HistoryRouter as HistoryRouter } from "react-router-dom";
import { CreatePage, MainPage, MarketPage, FaqPage } from "pages";
import { historyInstance } from "./historyInstance";

const AppRouter = () => {
  return <HistoryRouter history={historyInstance}>
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/faq" element={<FaqPage />} />
      <Route path="/market/:address" element={<MarketPage />} />
    </Routes>
  </HistoryRouter>
}

export default AppRouter;