import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider } from 'react-router-dom';
import { Provider as StoreProvider } from 'react-redux';
import ReactGA from 'react-ga';
import { SWRConfig } from 'swr';
import axios from 'axios';

import { PersistGate } from 'redux-persist/integration/react';
import 'antd/dist/antd.dark.less';

import { store, persistor } from 'store/store';
import appConfig from 'appConfig';

import { router } from 'router';

// Vite resolves `moment` to the ESM build (moment/dist/moment.js); the UMD files under moment/locale/*
// would register on a second CJS copy, so the locales must come from moment/dist/locale/*.
import 'moment/dist/locale/es';
import 'moment/dist/locale/pt-br';
import 'moment/dist/locale/zh-cn';
import 'moment/dist/locale/ru';
import 'moment/dist/locale/uk';

import './locale/index';
import './index.css';

if (appConfig.GA_ID) {
	ReactGA.initialize(appConfig.GA_ID);

	ReactGA.pageview(router.state.location.pathname);

	router.subscribe(({ historyAction, location }) => {
		if (historyAction === 'PUSH' || historyAction === 'POP') {
			ReactGA.pageview(location.pathname);
		}
	});
}

const container = document.getElementById('root');

if (!container) {
	throw new Error('Root element #root not found');
}

createRoot(container).render(
	<React.StrictMode>
		<StoreProvider store={store}>
			<HelmetProvider>
				<PersistGate loading={null} persistor={persistor}>
					<SWRConfig
						value={{
							fetcher: (url: string) => axios.get(url).then((res) => res.data),
						}}
					>
						<RouterProvider router={router} />
					</SWRConfig>
				</PersistGate>
			</HelmetProvider>
		</StoreProvider>
	</React.StrictMode>
);
