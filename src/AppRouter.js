import { CreatePage, MainPage, MarketPage } from "pages";
import { Routes, Route, BrowserRouter } from "react-router-dom";

const AppRouter = () => {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/market" element={<MarketPage />} />
    </Routes>
  </BrowserRouter>
}

export default AppRouter;