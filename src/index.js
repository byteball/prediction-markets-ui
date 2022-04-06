import React from 'react';
import ReactDOM from 'react-dom';
import "antd/dist/antd.less";

import AppRouter from 'AppRouter';
import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
  document.getElementById('root')
);
