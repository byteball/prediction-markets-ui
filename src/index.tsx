import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider } from 'react-router-dom';
import { Provider as StoreProvider } from 'react-redux';
import ReactGA from "react-ga4";
import { SWRConfig } from 'swr';
import axios from 'axios';

import { PersistGate } from 'redux-persist/integration/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

import { store, persistor } from 'store/store';
import appConfig from 'appConfig';

import { router } from 'router';

import 'moment/dist/locale/es';
import 'moment/dist/locale/pt-br';
import 'moment/dist/locale/zh-cn';
import 'moment/dist/locale/ru';
import 'moment/dist/locale/uk';

import './locale/index';
import './index.css';

if (appConfig.GA_ID) {
	ReactGA.initialize(appConfig.GA_ID);

	ReactGA.send({ hitType: "pageview", page: router.state.location.pathname });

	router.subscribe(({ historyAction, location }) => {
		if (historyAction === 'PUSH' || historyAction === 'POP') {
			ReactGA.send({ hitType: "pageview", page: location.pathname });
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
						<TooltipProvider delayDuration={100}>
							<RouterProvider router={router} future={{ v7_startTransition: true }} />
							<Toaster position="top-center" richColors />
						</TooltipProvider>
					</SWRConfig>
				</PersistGate>
			</HelmetProvider>
		</StoreProvider>
	</React.StrictMode>
);
