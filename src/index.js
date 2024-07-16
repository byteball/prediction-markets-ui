import React from 'react';
import { render } from 'react-dom';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider } from 'react-router-dom';
import { Provider as StoreProvider } from 'react-redux';
import ReactGA from "react-ga";
import { SWRConfig } from 'swr'
import axios from "axios";

import { PersistGate } from "redux-persist/integration/react";
import 'antd/dist/antd.dark.less';

import getStore from "./store";
import appConfig from 'appConfig';

import { router } from 'router';

import 'moment/locale/es';
import 'moment/locale/pt-br';
import 'moment/locale/zh-cn';
import 'moment/locale/ru';
import 'moment/locale/uk';

import './locale/index';
import './index.css';

export const { store, persistor } = getStore();

if (appConfig.GA_ID) {
	ReactGA.initialize(appConfig.GA_ID);

	ReactGA.pageview(router.state.location.pathname);

	router.subscribe(({ historyAction, location }) => {
		if (historyAction === "PUSH" || historyAction === "POP") {
			ReactGA.pageview(location.pathname);
		}
	});
}

render(
	<React.StrictMode>
		<StoreProvider store={store}>
			<HelmetProvider>
				<PersistGate loading={null} persistor={persistor}>
					<SWRConfig value={{
						fetcher: (url) => axios.get(url).then(res => res.data)
					}}>
						<RouterProvider router={router} />
					</SWRConfig>
				</PersistGate>
			</HelmetProvider>
		</StoreProvider>
	</React.StrictMode>,
	document.getElementById('root')
);