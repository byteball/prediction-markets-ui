import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Line } from "@/shared/ui/charts";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useAppSelector } from "@/shared/lib/redux";
import { selectActiveMarketParams, selectActiveMarketStateVars, selectActiveTeams } from "@/entities/market";

import { getMarketChartConfig, type ChartType } from "../lib/chart-config";
import { useMarketChartData } from "../model/use-market-chart-data";
import styles from "./market-chart.module.css";

type MarketChartProps = {
  /** Current unix time (seconds), shared with the rest of the page so every block agrees on "now". */
  now: number;
};

/** History of the opened market: prices, supplies, fee accumulation and APY, switchable by tabs. */
export const MarketChart = ({ now }: MarketChartProps) => {
  const [chartType, setChartType] = useState<ChartType>("prices");
  const { t } = useTranslation();
  const teams = useAppSelector(selectActiveTeams);
  const { result } = useAppSelector(selectActiveMarketStateVars);
  const { committed_at } = useAppSelector(selectActiveMarketParams);

  const data = useMarketChartData(chartType, now);
  const config = getMarketChartConfig(chartType, teams);

  if (data.length === 0) return null;

  return (
    <div>
      <div className={styles.typeChartSelectorWrap}>
        <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)} className={styles.typeChartSelector}>
          <TabsList>
            <TabsTrigger value="prices">{t("pages.market.chart.prices", "Prices")}</TabsTrigger>
            <TabsTrigger value="supplies">{t("pages.market.chart.supplies", "Supplies")}</TabsTrigger>
            <TabsTrigger value="fee">{t("pages.market.chart.fee", "Fee accumulation")}</TabsTrigger>
            <TabsTrigger value="apy">{!result ? t("pages.market.chart.estimated_apy", "Estimated APY") : t("pages.market.chart.apy", "APY")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <Line {...config} data={data} />
      {chartType === "apy" && (
        <div className={styles.apyChartDescWrap}>
          <div>{t("pages.market.chart.liquidity_date", "Liquidity provision date")}</div>
          <div className={styles.apyChartDesc}>
            {committed_at
              ? t("pages.market.chart.apy_desc", "APY that would be earned if an infinitesimal amount of liquidity were added on the date on the chart and held until the outcome was published.")
              : t("pages.market.chart.estimated_apy_desc", "Estimated APY that would be earned if an infinitesimal amount of liquidity were added on the date on the chart and held until the event date. The estimation assumes that trading activity stays the same as it has been so far.")}
          </div>
        </div>
      )}
    </div>
  );
};
