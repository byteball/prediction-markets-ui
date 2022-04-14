import { CreatePage, MainPage } from "pages";
import { Routes, Route, BrowserRouter } from "react-router-dom";

const AppRouter = () => {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/create" element={<CreatePage />} />
    </Routes>
  </BrowserRouter>
}

export default AppRouter;