import { MainPage } from "pages/MainPage/MainPage";
import { CreatePage, MarketPage, FaqPage } from "pages/lazy";
import { createBrowserRouter } from "react-router-dom";

import { langs } from "components/SelectLanguage/langs";
import { Layout } from "components/Layout/Layout";

const future = {
	v7_relativeSplatPath: true,
	v7_startTransition: true,
	v7_fetcherPersist: true,
	v7_normalizeFormMethod: true,
	v7_partialHydration: true,
	v7_skipActionErrorRevalidation: true,
};

export const router = createBrowserRouter([
	...(["", ...langs.map((lang) => lang.name)])
		.map(languageCode => ({
			path: `/${languageCode}`,
			element: <Layout />,
			children: [
				{
					path: "",
					element: <MainPage />,
				},
				{
					path: ":category",
					element: <MainPage />,
				},
				{
					path: ":category/:particle",
					element: <MainPage />,
				},
				{
					path: "create",
					element: <CreatePage />,
				},
				{
					path: "faq",
					element: <FaqPage />,
				},
				{
					path: "market/*",
					element: <MarketPage />,
				},
			]
		}))
], {
	future,
});
