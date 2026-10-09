import type { CSSProperties } from "react";
import { Loader2 } from "lucide-react";
import type { LineConfig, PieConfig, StockConfig, TinyLineConfig } from "@ant-design/plots";

import { lazyWithFallback } from "@/shared/lib/lazy-with-fallback";

const DEFAULT_CHART_HEIGHT = 400;

const ChartFallback = ({ height }: { height: CSSProperties["height"] }) => (
  <div className="flex items-center justify-center" style={{ height, width: "100%" }}>
    <Loader2 className="size-8 animate-spin text-primary" aria-label="loading" />
  </div>
);

// @ant-design/plots is loaded on demand so the main chunk stays without it.
export const Line = lazyWithFallback<LineConfig>(() => import("@ant-design/plots").then((m) => m.Line), (p) => <ChartFallback height={p.height ?? DEFAULT_CHART_HEIGHT} />);
export const Pie = lazyWithFallback<PieConfig>(() => import("@ant-design/plots").then((m) => m.Pie), (p) => <ChartFallback height={p.height ?? DEFAULT_CHART_HEIGHT} />);
export const Stock = lazyWithFallback<StockConfig>(() => import("@ant-design/plots").then((m) => m.Stock), (p) => <ChartFallback height={p.height ?? DEFAULT_CHART_HEIGHT} />);
// TinyLine fills its container, so the fallback does too
export const TinyLine = lazyWithFallback<TinyLineConfig>(() => import("@ant-design/plots").then((m) => m.TinyLine), (p) => <ChartFallback height={p.height ?? "100%"} />);
