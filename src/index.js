import React from 'react';
import ReactDOM from 'react-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { PersistGate } from "redux-persist/integration/react";
import 'antd/dist/antd.dark.less';

import getStore from "./store";
import AppRouter from 'AppRouter';
import './index.css';

export const { store, persistor } = getStore();

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <PersistGate loading={null} persistor={persistor}>
          <AppRouter />
        </PersistGate>
      </HelmetProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);