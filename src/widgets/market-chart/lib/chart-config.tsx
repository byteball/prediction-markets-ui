import type { LineConfig } from "@ant-design/plots";

import i18n from "@/shared/i18n";
import { DRAW_COLOR, NO_COLOR, YES_COLOR } from "@/shared/config/colors";
import type { Team } from "@/entities/market";

export type ChartType = "prices" | "supplies" | "fee" | "apy";

export type ChartPoint = {
  date: string;
  value: number;
  chartType: ChartType;
  type?: string;
  currencySymbol?: string;
  symbol?: string;
};

export type Teams = { yes: Team | null; no: Team | null };

const formatValue = ({ chartType, value, currencySymbol }: ChartPoint) =>
  chartType === "fee" || chartType === "apy" ? `${Number(value) > 1e15 ? value.toPrecision(9) : (+Number(value).toPrecision(9)).toLocaleString("en-US")}%` : `${+value.toPrecision(9)} ${currencySymbol}`;

/** Line chart configuration of the market history chart for the chosen series. */
export const getMarketChartConfig = (chartType: ChartType, teams: Teams) =>
  ({
    xField: "date",
    yField: "value",
    seriesField: "type",
    autoFit: true,
    animation: false,
    renderer: "svg",
    smooth: true,
    appendPadding: 5,
    theme: "dark",
    map: { style: "dark" },
    color: ({ type }: { type: string }) => {
      if (chartType === "apy") return YES_COLOR;

      return type === i18n.t("common.no", "no").toUpperCase() || type === teams?.no?.name ? NO_COLOR : type === i18n.t("common.yes", "yes").toUpperCase() || type === teams?.yes?.name ? YES_COLOR : DRAW_COLOR;
    },
    yAxis: {
      label: {
        formatter: (v: string) => (chartType === "fee" || chartType === "apy" ? `${v}%` : v),
      },
    },
    tooltip: {
      customContent: (title: string, items: { color: string; data: ChartPoint }[]) => (
        <>
          <p style={{ marginTop: 16 }}>{title}</p>
          <ul style={{ paddingLeft: 0 }}>
            {items?.map((item, index) => {
              const { color, data } = item;

              return (
                <li key={`${data.chartType}-${data.type}-${data.date}`} data-index={index} style={{ marginBottom: 12, display: "flex", alignItems: "center" }}>
                  <span className="g2-tooltip-marker" style={{ backgroundColor: color }}></span>
                  <span style={{ display: "inline-flex", flex: 1, justifyContent: "space-between" }}>
                    {data.chartType === "prices" && (
                      <span className="g2-tooltip-list-item--4">
                        <div style={{ paddingRight: 15 }}>{data.symbol}</div>
                      </span>
                    )}
                    <span className="g2-tooltip-list-item-value">{formatValue(data)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      ),
    },
  }) as unknown as LineConfig;
