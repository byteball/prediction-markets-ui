import { useLocation } from "react-router-dom";
import ReactGA from "react-ga";
import { memo, useEffect } from "react";

import { Footer } from "components/Footer/Footer";
import { Header } from "components/Header/Header";

import { historyInstance } from "historyInstance";
import appConfig from "appConfig";

export const Layout = memo(({ children }) => {
  const location = useLocation();

  useEffect(() => {
    let unlisten;

    if (appConfig.GA_ID) {
      unlisten = historyInstance.listen(({ location, action }) => {
        if (action === "PUSH" || action === "POP") {
          ReactGA.pageview(location.pathname);
        }
      });

      ReactGA.pageview(location.pathname);
    }

    return () => {
      unlisten && unlisten();
    };
  }, []);

  return <div>
    <div className="container" style={{ minHeight: '100vh' }}>
      <Header />
      <div style={{ marginTop: 25 }}>{children}</div>
    </div>

    <div className="container">
      <Footer />
    </div>
  </div>
})