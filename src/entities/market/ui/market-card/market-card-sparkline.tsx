import { useMemo } from "react";
import type { TinyLineConfig } from "@ant-design/plots";
import { useTranslation } from "react-i18next";

import { TinyLine } from "@/shared/ui/charts";

import { MAX_DISPLAY_DECIMALS } from "../../lib/get-market-card-view";
import { getSparklineData } from "../../lib/get-sparkline-data";

type MarketCardSparklineProps = {
  /** Daily YES prices (a single point is doubled so the line renders). */
  candles?: { price: number }[];
  /** Preview cards pass bare numbers instead of candles. */
  previewValues?: number[];
  height: number;
  yesLabel?: string;
  reserveSymbol?: string;
};

export const MarketCardSparkline = ({ candles, previewValues, height, yesLabel, reserveSymbol }: MarketCardSparklineProps) => {
  const { t } = useTranslation();
  const { dataForChart, minValue } = useMemo(() => getSparklineData(candles, previewValues), [candles, previewValues]);

  const config = useMemo(
    () =>
      ({
        autoFit: true,
        smooth: true,
        renderer: "svg",
        animation: false,
        theme: { background: "transparent" },
        meta: { nice: true },
        color: "#2D72F6",
        tooltip: {
          customContent: (_: string, data: { value: number }[]) => {
            if (data && data[0]) {
              const { value } = data[0];
              const tokenView = yesLabel || t("common.type_token", "{{type}} token", { type: t("common.yes", "yes").toUpperCase() });
              const valueView = +Number(+value + minValue).toFixed(MAX_DISPLAY_DECIMALS);

              return t("prediction_item.chart_tooltip", "{{token}} price - {{value}} {{symbol}}", { token: tokenView, value: valueView, symbol: reserveSymbol });
            }
            return null;
          },
        },
      }) as unknown as TinyLineConfig,
    [minValue, yesLabel, reserveSymbol, t]
  );

  if (dataForChart.length === 0) return null;

  return (
    <div style={{ height, marginTop: 10, width: "100%", boxSizing: "border-box" }}>
      <TinyLine {...config} data={dataForChart} />
    </div>
  );
};
