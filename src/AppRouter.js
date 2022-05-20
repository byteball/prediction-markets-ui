import { Routes, Route, BrowserRouter } from "react-router-dom";

import { CreatePage, MainPage, MarketPage, FaqPage } from "pages";

const AppRouter = () => {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/faq" element={<FaqPage />} />
      <Route path="/market/:address" element={<MarketPage />} />
    </Routes>
  </BrowserRouter>
}

export default AppRouter;