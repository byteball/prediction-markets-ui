import { useLocation } from "react-router-dom";
import { memo } from "react";
import { Helmet } from "react-helmet-async";

import { Footer } from "components/Footer/Footer";
import { Header } from "components/Header/Header";


import { getAlternateMetaList } from "utils";

export const Layout = memo(({ children }) => {
  const location = useLocation();

  return <div>
    <Helmet>
      {getAlternateMetaList(location.pathname)}
    </Helmet>

    <div className="container" style={{ minHeight: '100vh' }}>
      <Header />
      <div style={{ marginTop: 25 }}>{children}</div>
    </div>

    <div className="container">
      <Footer />
    </div>
  </div>
})