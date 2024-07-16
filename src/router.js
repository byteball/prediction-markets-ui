import { CreatePage, MainPage, MarketPage, FaqPage } from "pages";
import { createBrowserRouter } from "react-router-dom";

import { langs } from "components/SelectLanguage/SelectLanguage";
import { Layout } from "components/Layout/Layout";
  
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
]);
