import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const LazyCreatePage = lazy(() => import("./CreatePage/CreatePage").then((m) => ({ default: m.CreatePage })));
const LazyMarketPage = lazy(() => import("./MarketPage/MarketPage").then((m) => ({ default: m.MarketPage })));
const LazyFaqPage = lazy(() => import("./FaqPage/FaqPage").then((m) => ({ default: m.FaqPage })));

const PageFallback = () => (
  <div className="flex justify-center" style={{ padding: 40 }}>
    <Loader2 className="size-8 animate-spin text-primary" aria-label="loading" />
  </div>
);

export const CreatePage = () => (
  <Suspense fallback={<PageFallback />}>
    <LazyCreatePage />
  </Suspense>
);

export const MarketPage = () => (
  <Suspense fallback={<PageFallback />}>
    <LazyMarketPage />
  </Suspense>
);

export const FaqPage = () => (
  <Suspense fallback={<PageFallback />}>
    <LazyFaqPage />
  </Suspense>
);
