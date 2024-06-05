import ReactGA from "react-ga";

import { createBrowserHistory } from "history";

import appConfig from "appConfig";

export const historyInstance = createBrowserHistory({ window });

if (appConfig.GA_ID) {
    ReactGA.pageview(historyInstance.location.pathname);

    historyInstance.listen(({ location, action }) => {
        if (action === "PUSH" || action === "POP") {
            ReactGA.pageview(location.pathname);
        }
    });
}