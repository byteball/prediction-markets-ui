import { Pie } from "@ant-design/plots"
import { useEffect, useState } from "react";
import { Trans, useTranslation } from 'react-i18next';

import { getMarketPriceByType } from "utils";

import appConfig from "appConfig";

export const MarketSizePie = ({ teams, reserve_decimals, stateVars = {}, reserve_symbol, allow_draw = false, oracle }) => {
    const [dataForPie, setDataForPie] = useState([]);
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
            content: (item) => {
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

                const tokenType = haveTeamNames ? (item.type === 'YES' ? teams.yes.name : (item.type === 'NO' ? teams.no.name : t('common.draw', 'draw').toUpperCase())) : t('common.type_tokens', "{{type}} tokens", { type: typeView });

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
        color: (item) => {
            if (item.type === 'YES') {
                return appConfig.YES_COLOR;
            } else if (item.type === 'NO') {
                return appConfig.NO_COLOR;
            } else {
                return appConfig.DRAW_COLOR
            }
        },
        tooltip: {
            customContent: (_, items) => {
                const name = haveTeamNames ? (items[0]?.data.type === 'YES' ? teams.yes.name : (items[0]?.data.type === 'NO' ? teams.no.name : 'DRAW')) : items[0]?.data.type + ' tokens';
                const value = items[0]?.data.value;

                return <Trans i18nKey="market_size_pie.tooltip">
                    <div style={{ padding: 5, textAlign: 'center' }}>Capital invested in {{ name }}:
                        <div style={{ marginTop: 5 }}>{{ value }} <small>{{ reserve_symbol }}</small></div>
                    </div>
                </Trans>
            }
        },
        pieStyle: {
            stroke: "#141412",
        }
    }

    useEffect(() => {
        const data = [
            { type: 'YES', token: 'yes', value: +Number((supply_yes * yesPrice) / 10 ** reserve_decimals).toFixed(reserve_decimals) },
            { type: 'NO', token: 'no', value: +Number((supply_no * noPrice) / 10 ** reserve_decimals).toFixed(reserve_decimals) },
        ];

        if (allow_draw) {
            data.push({ type: 'DRAW', token: 'draw', value: +Number((supply_draw * drawPrice) / 10 ** reserve_decimals).toFixed(reserve_decimals) });
        }

        setDataForPie(data);
    }, [stateVars, yesPrice, noPrice, drawPrice, supply_yes, supply_no, supply_draw]);

    return <Pie data={dataForPie} {...pieConfig} />
}