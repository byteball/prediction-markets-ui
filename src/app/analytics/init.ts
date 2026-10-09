import ReactGA from "react-ga4";
import type { createBrowserRouter } from "react-router-dom";

import { GA_ID } from "@/shared/config/env";

type AppRouter = ReturnType<typeof createBrowserRouter>;

/** Google Analytics: one pageview on load and one per push/pop navigation. No-op without a GA id. */
export const initAnalytics = (router: AppRouter) => {
  if (!GA_ID) return;

  ReactGA.initialize(GA_ID);
  ReactGA.send({ hitType: "pageview", page: router.state.location.pathname });

  router.subscribe(({ historyAction, location }) => {
    if (historyAction === "PUSH" || historyAction === "POP") {
      ReactGA.send({ hitType: "pageview", page: location.pathname });
    }
  });
};
