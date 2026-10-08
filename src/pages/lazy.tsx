import { Loader2 } from "lucide-react";

import { lazyWithFallback } from "@/utils/lazy-with-fallback";

const PageFallback = () => (
  <div className="flex justify-center" style={{ padding: 40 }}>
    <Loader2 className="size-8 animate-spin text-primary" aria-label="loading" />
  </div>
);

export const CreatePage = lazyWithFallback(() => import("./create-page/create-page").then((m) => m.CreatePage), PageFallback);
export const MarketPage = lazyWithFallback(() => import("./market-page/market-page").then((m) => m.MarketPage), PageFallback);
export const FaqPage = lazyWithFallback(() => import("./faq-page/faq-page").then((m) => m.FaqPage), PageFallback);
