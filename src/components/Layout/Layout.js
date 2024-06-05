import { useLocation } from "react-router-dom";
import { memo, useEffect } from "react";
import { Helmet } from "react-helmet-async";

import { Footer } from "components/Footer/Footer";
import { Header } from "components/Header/Header";


import { getAlternateMetaList } from "utils";
import { useDispatch } from "react-redux";
import { loadMarkets } from "store/thunks/loadMarkets";
import { loadReserveAssets } from "store/thunks/loadReserveAssets";

export const Layout = memo(({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadMarkets());
    dispatch(loadReserveAssets());
  }, [dispatch]);

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