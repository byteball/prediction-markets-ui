import type { PieConfig } from "@ant-design/plots"
import { Pie } from "@/components/charts"
import { useMemo } from "react";
import { Trans, useTranslation } from 'react-i18next';

import type { MarketStateVars, Team } from "@/store/types";
import { getMarketPriceByType } from "@/utils";

import appConfig from "@/app-config";

export interface MarketSizePieProps {
    teams?: { yes?: Team | null; no?: Team | null };
    reserve_decimals: number;
    stateVars?: MarketStateVars;
    reserve_symbol?: string;
    allow_draw?: boolean | number;
    oracle?: string;
}

type PieDatum = { type: 'YES' | 'NO' | 'DRAW'; token: 'yes' | 'no' | 'draw'; value: number };

type PieLabelItem = PieDatum & { percent: number };

export const MarketSizePie = ({ teams, reserve_decimals, stateVars = {} as MarketStateVars, reserve_symbol, allow_draw = false, oracle }: MarketSizePieProps) => {
    const { t } = useTranslation();

    const isSportMarket = !!appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === oracle);
    const haveTeamNames = isSportMarket && teams?.yes?.name && teams?.no?.name;

    const { supply_yes = 0, supply_no = 0, supply_draw = 0 } = stateVars;

    const yesPrice = +getMarketPriceByType(stateVars, 'yes').toFixed(reserve_decimals);
    const noPrice = +getMarketPriceByType(stateVars, 'no').toFixed(reserve_decimals);
    const drawPrice = +getMarketPriceByType(stateVars, 'draw').toFixed(reserve_decimals);

    const pieConfig = {
        angleField: 'value',
        colorField: 'type',
        legend: false,
        animation: false,
        label: {
            type: 'inner',
            content: (item: PieLabelItem) => {
                if (item.percent <= 0.1) return '';
                let typeView = '';

                if (!haveTeamNames) {
                    if (item.type === 'YES') {
                        typeView = t('common.yes', 'yes').toUpperCase();
                    } else if (item.type === 'NO') {
                        typeView = t('common.no', 'no').toUpperCase();
                    } else {
                        typeView = t('common.draw', 'draw').toUpperCase();
                    }
                }

                const tokenType = haveTeamNames ? (item.type === 'YES' ? teams!.yes!.name : (item.type === 'NO' ? teams!.no!.name : t('common.draw', 'draw').toUpperCase())) : t('common.type_tokens', "{{type}} tokens", { type: typeView });

                return t('market_size.label', "{{type}}\n{{value}} {{symbol}}\n{{percent}}%", { type: tokenType, value: +Number(item.value).toFixed(4), symbol: reserve_symbol, percent: Number(item.percent * 100).toPrecision(4) });
            },
            style: {
                fontSize: 12,
                textAlign: "center",
                fill: "#fff",
                fontWeight: 'bold',
                textStroke: '2px red'
            },
            autoHide: true,
            autoRotate: false
        },
        appendPadding: 10,
        radius: 0.8,
        renderer: "svg",
        theme: 'dark',
        color: (item: Pick<PieDatum, 'type'>) => {
            if (item.type === 'YES') {
                return appConfig.YES_COLOR;
            } else if (item.type === 'NO') {
                return appConfig.NO_COLOR;
            } else {
                return appConfig.DRAW_COLOR
            }
        },
        tooltip: {
            customContent: (_: string, items: { data: PieDatum }[]) => {
                const name = haveTeamNames ? (items[0]?.data.type === 'YES' ? teams!.yes!.name : (items[0]?.data.type === 'NO' ? teams!.no!.name : 'DRAW')) : items[0]?.data.type + ' tokens';
                const value = items[0]?.data.value;

                return <Trans i18nKey="market_size_pie.tooltip" values={{ name, value, reserve_symbol }}>
                    <div style={{ padding: 5, textAlign: 'center' }}>Capital invested in {"{{name}}"}:
                        <div style={{ marginTop: 5 }}>{"{{value}}"} <small>{"{{reserve_symbol}}"}</small></div>
                    </div>
                </Trans>
            }
        },
        pieStyle: {
            stroke: "#141412",
        }
    } as unknown as Omit<PieConfig, "data">;

    const dataForPie = useMemo(() => {
        const data: PieDatum[] = [
            { type: 'YES', token: 'yes', value: +Number((supply_yes * yesPrice) / 10 ** reserve_decimals).toFixed(reserve_decimals) },
            { type: 'NO', token: 'no', value: +Number((supply_no * noPrice) / 10 ** reserve_decimals).toFixed(reserve_decimals) },
        ];

        if (allow_draw) {
            data.push({ type: 'DRAW', token: 'draw', value: +Number((supply_draw * drawPrice) / 10 ** reserve_decimals).toFixed(reserve_decimals) });
        }

        return data;
    }, [yesPrice, noPrice, drawPrice, supply_yes, supply_no, supply_draw, reserve_decimals, allow_draw]);

    return <Pie data={dataForPie} {...pieConfig} />
}
