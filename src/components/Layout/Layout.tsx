import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { memo, useEffect } from "react";
import { Helmet } from "react-helmet-async";

import { Footer } from "components/Footer/Footer";
import { Header } from "components/Header/Header";

import { getAlternateMetaList } from "utils";
import { useAppDispatch } from "store/hooks";
import { loadReserveAssets } from "store/thunks/loadReserveAssets";

export const Layout = memo(() => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadReserveAssets());
  }, [dispatch]);

  return <div>
    <Helmet>
      {getAlternateMetaList(location.pathname)}
    </Helmet>

    <div className="container" style={{ minHeight: '100vh' }}>
      <Header />
      <div style={{ marginTop: 25 }}><Outlet/></div>
    </div>

    <div className="container">
      <Footer />
    </div>

    <ScrollRestoration getKey={(location) => {
        // default behavior
        return location.pathname;
    }}
    />
  </div>
})

Layout.displayName = "Layout";
