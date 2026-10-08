import { Loader2 } from "lucide-react";

import { lazyWithFallback } from "utils/lazyWithFallback";

const PageFallback = () => (
  <div className="flex justify-center" style={{ padding: 40 }}>
    <Loader2 className="size-8 animate-spin text-primary" aria-label="loading" />
  </div>
);

export const CreatePage = lazyWithFallback(() => import("./CreatePage/CreatePage").then((m) => m.CreatePage), PageFallback);
export const MarketPage = lazyWithFallback(() => import("./MarketPage/MarketPage").then((m) => m.MarketPage), PageFallback);
export const FaqPage = lazyWithFallback(() => import("./FaqPage/FaqPage").then((m) => m.FaqPage), PageFallback);
