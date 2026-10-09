import { memo, useEffect } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { useAppDispatch } from "@/shared/lib/redux";
import { getAlternateMetaList } from "@/shared/lib/get-alternate-paths";
import { loadReserveAssets } from "@/entities/reserve-asset";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

/** Page frame: header, routed content, footer, plus the data every page needs (reserve assets). */
export const RootLayout = memo(() => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadReserveAssets());
  }, [dispatch]);

  return (
    <div>
      <Helmet>{getAlternateMetaList(location.pathname)}</Helmet>

      <div className="container" style={{ minHeight: "100vh" }}>
        <Header />
        <div style={{ marginTop: 25 }}>
          <Outlet />
        </div>
      </div>

      <div className="container">
        <Footer />
      </div>

      <ScrollRestoration getKey={(location) => location.pathname} />
    </div>
  );
});

RootLayout.displayName = "RootLayout";
