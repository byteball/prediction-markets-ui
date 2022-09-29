import { Space } from "antd";
import { FormLabel } from "components/FormLabel/FormLabel";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { selectPriceOrOdds } from "store/slices/settingsSlice";

import styles from "./TransactionMeta.module.css";

export const TransactionMeta = ({ meta, params, tokenType, showEstimatedWinnings = false, yes_team, no_team }) => {
    const { reserve_symbol, reserve_decimals, issue_fee } = params;
    const [visibleFee, setVisibleFee] = useState(false);
    const priceOrOdds = useSelector(selectPriceOrOdds);
    const { t } = useTranslation();

    if (!meta || !tokenType) return null;

    const new_price = tokenType === 'yes' ? meta.new_yes_price : (tokenType === 'no' ? meta.new_no_price : meta.new_draw_price);
    const old_price = tokenType === 'yes' ? meta.old_yes_price : (tokenType === 'no' ? meta.old_no_price : meta.old_draw_price);

    const percentagePriceDifference = new_price !== 0 && old_price !== 0 ? 100 * (new_price - old_price) / old_price : 0;

    const old_supply = tokenType === 'yes' ? meta.old_supply_yes : (tokenType === 'no' ? meta.old_supply_no : meta.old_supply_draw);
    const new_supply = tokenType === 'yes' ? meta.new_supply_yes : (tokenType === 'no' ? meta.new_supply_no : meta.new_supply_draw);

    const odds = old_price !== 0 ? (meta.old_reserve / old_supply) / old_price : 1;
    const new_odds = (meta.new_reserve / new_supply) / new_price;

    const percentageOddsDifference = 100 * (new_odds - odds) / odds;

    const estimatedWinnings = (meta.new_reserve / new_supply) * meta.amount;
    const estimatedWinningsView = +Number(estimatedWinnings / 10 ** reserve_decimals).toFixed(reserve_decimals);
    const percentageEstimatedProfit = Number((((estimatedWinnings - meta.reserve_amount) / meta.reserve_amount) * 100)).toFixed(4);

    const tokenName = tokenType === 'yes' ? (yes_team || 'YES') : (tokenType === 'no' ? (no_team || 'NO') : 'DRAW')

    let descriptionOfWinningOutcome = '';

    if (yes_team && no_team) {
        if (tokenType === 'draw') {
            descriptionOfWinningOutcome = t('meta_trans.outcome_sp_draw_desc', "if the game ends with a draw");
        } else {
            descriptionOfWinningOutcome = t('meta_trans.outcome_sp_desc', "if {{team_name}} wins", { team_name: tokenName });
        }
    } else {
        descriptionOfWinningOutcome = t('meta_trans.outcome_other_desc', `if the outcome is {{token_name}}`, { token_name: tokenName });
    }

    return <div className={styles.wrap}>
        {(showEstimatedWinnings && meta.old_reserve) ? <div>
            {t("meta_trans.estimated_winnings", "Estimated winnings")} <FormLabel info={descriptionOfWinningOutcome} /> : {estimatedWinningsView} {reserve_symbol} ({percentageEstimatedProfit > 0 ? '+' : '-'}{Math.abs(percentageEstimatedProfit)}%)
        </div> : null}
        {percentagePriceDifference !== 0 && <div>
            {priceOrOdds === 'price'
                ? <><span className="metaLabel">{t("meta_trans.new_price", "New price")}</span>: <span style={{ color: getColorByValue(percentagePriceDifference) }}>{+Number(new_price).toPrecision(8)} {reserve_symbol} (<span>{percentagePriceDifference > 0 ? "+" : ''}{Number(percentagePriceDifference).toFixed(2)}%)</span></span></>
                : <><span className="metaLabel">{t("meta_trans.new_odds", "New odds")}</span>: <span style={{ color: getColorByValue(percentageOddsDifference) }}>x{+Number(new_odds).toPrecision(6)} ({percentageOddsDifference > 0 ? "+" : ''}{Number(percentageOddsDifference).toFixed(2)}%)</span></>}
        </div>}
        <div>
            <Space wrap={true}>
                <span>{t("meta_trans.total_fee", "Total fee")}: <span style={{ color: getColorByValue(meta.percentage_total_fee) }}>{+Number((meta.total_fee) / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol} ({Number(meta.percentage_total_fee).toFixed(2)}%)</span></span>
                <span onClick={() => setVisibleFee((v) => !v)} className={styles.detailsBtn}>{visibleFee ? t("meta_trans.hide_details", "hide details") : t("meta_trans.show_details", "show details")}</span>
            </Space>
            {visibleFee && <div className={styles.detailsWrap}>
                {meta.arb_profit_tax !== 0 && <div><span className="metaLabel">{t("meta_trans.arb_profit_tax", "Arb profit tax")}</span>: <span style={{ color: getColorByValue(meta.percentage_arb_profit_tax) }}>{+Number(meta.arb_profit_tax / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol} ({Number(meta.percentage_arb_profit_tax).toFixed(2)}%) {meta.percentage_arb_profit_tax > 5 && <FormLabel info="The more you change the price, the more commissions you pay." />}</span></div>}
                {meta.issue_fee !== 0 && <div><span className="metaLabel">{t("meta_trans.issue_fee", "Issue fee")}</span>: {+Number((meta.issue_fee) / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol} ({issue_fee * 100}%)</div>}
                {meta.redeem_fee !== 0 && <div><span className="metaLabel">{t("meta_trans.sell_fee", "Sell fee")}</span>: {+Number((meta.redeem_fee) / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol} ({meta.percentage_redeem_fee}%)</div>}
                {meta.network_fee !== 0 && <div>{t("meta_trans.network_fee", "Network fee")}: {+Number(meta.network_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
            </div>}
        </div>
    </div>
}

const getColorByValue = (v) => {
    const value = Math.abs(Number(v));

    if (value < 5) {
        return '#ccc'
    } else if (value >= 5 && value < 15) {
        return "#FFC148"
    } else {
        return "#FD5E56"
    }
}