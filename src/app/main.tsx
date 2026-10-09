import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "moment/dist/locale/es";
import "moment/dist/locale/pt-br";
import "moment/dist/locale/zh-cn";
import "moment/dist/locale/ru";
import "moment/dist/locale/uk";

import "@/shared/i18n";
import "./styles/index.css";

import { AppProviders } from "./providers/app-providers";
import { router } from "./router/router";
import { initAnalytics } from "./analytics/init";
import { startBootstrap } from "./bootstrap";

initAnalytics(router);
startBootstrap();

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <React.StrictMode>
    <AppProviders>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </AppProviders>
  </React.StrictMode>
);
