import { createBrowserRouter } from "react-router-dom";

import { langs } from "@/shared/config/langs";
import { MainPage } from "@/pages/main";

import { RootLayout } from "../layouts/root-layout";
import { CreatePage, FaqPage, MarketPage } from "./lazy-pages";
import { LocaleSync } from "./locale-sync";

const future = {
  v7_relativeSplatPath: true,
  v7_startTransition: true,
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  v7_partialHydration: true,
  v7_skipActionErrorRevalidation: true,
};

const pageRoutes = [
  { path: "", element: <MainPage /> },
  { path: ":category", element: <MainPage /> },
  { path: ":category/:particle", element: <MainPage /> },
  { path: "create", element: <CreatePage /> },
  { path: "faq", element: <FaqPage /> },
  { path: "market/*", element: <MarketPage /> },
];

// Every page exists at "/" (default language) and under each language prefix.
export const router = createBrowserRouter(
  [
    {
      element: <LocaleSync />,
      children: ["", ...langs.map((lang) => lang.name)].map((languageCode) => ({
        path: `/${languageCode}`,
        element: <RootLayout />,
        children: pageRoutes,
      })),
    },
  ],
  { future }
);
