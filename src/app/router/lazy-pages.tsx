import { lazyWithFallback } from "@/shared/lib/lazy-with-fallback";
import { SpinnerBlock } from "@/shared/ui/spinner";

// The main page stays in the entry chunk; the others load on demand.
const PageFallback = () => <SpinnerBlock />;

export const CreatePage = lazyWithFallback(() => import("@/pages/create").then((m) => m.CreatePage), PageFallback);
export const MarketPage = lazyWithFallback(() => import("@/pages/market").then((m) => m.MarketPage), PageFallback);
export const FaqPage = lazyWithFallback(() => import("@/pages/faq").then((m) => m.FaqPage), PageFallback);
