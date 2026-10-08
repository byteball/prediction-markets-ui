import { lazy, Suspense, type CSSProperties } from "react";
import { Loader2 } from "lucide-react";
import type { LineConfig, PieConfig, StockConfig, TinyLineConfig } from "@ant-design/plots";

const DEFAULT_CHART_HEIGHT = 400;

const LazyLine = lazy(() => import("@ant-design/plots").then((m) => ({ default: m.Line })));
const LazyPie = lazy(() => import("@ant-design/plots").then((m) => ({ default: m.Pie })));
const LazyStock = lazy(() => import("@ant-design/plots").then((m) => ({ default: m.Stock })));
const LazyTinyLine = lazy(() => import("@ant-design/plots").then((m) => ({ default: m.TinyLine })));

const ChartFallback = ({ height }: { height: CSSProperties["height"] }) => (
  <div className="flex items-center justify-center" style={{ height, width: "100%" }}>
    <Loader2 className="size-8 animate-spin text-primary" aria-label="loading" />
  </div>
);

export const Line = (props: LineConfig) => (
  <Suspense fallback={<ChartFallback height={props.height ?? DEFAULT_CHART_HEIGHT} />}>
    <LazyLine {...props} />
  </Suspense>
);

export const Pie = (props: PieConfig) => (
  <Suspense fallback={<ChartFallback height={props.height ?? DEFAULT_CHART_HEIGHT} />}>
    <LazyPie {...props} />
  </Suspense>
);

export const Stock = (props: StockConfig) => (
  <Suspense fallback={<ChartFallback height={props.height ?? DEFAULT_CHART_HEIGHT} />}>
    <LazyStock {...props} />
  </Suspense>
);

// TinyLine fills its container, so the fallback does too
export const TinyLine = (props: TinyLineConfig) => (
  <Suspense fallback={<ChartFallback height={props.height ?? "100%"} />}>
    <LazyTinyLine {...props} />
  </Suspense>
);
