import obyte from "obyte";
import { isNumber } from "lodash-es";
import moment from "moment";

import i18n from "locale";

type Validator = (value: string | number | boolean | undefined) => boolean | string | number | undefined;

export type Param = {
  name: string;
  description: string | ((value: unknown) => string);
  placeholder?: string;
  initValue?: string | number | boolean;
  validator?: Validator;
  errorMessage?: string;
};

export const getParamList = () =>
  ({
    allow_draw: {
      name: i18n.t("forms.create.allow_draw.name", "Allow draw"),
      description: i18n.t("forms.create.allow_draw.desc", "Whether to allow a 3rd outcome along with Yes and No. It’s common in some sports."),
    },
    issue_tokens: {
      name: i18n.t("forms.create.issue_tokens.name", "Issue tokens"),
      description: i18n.t("forms.create.issue_tokens.desc", "Issue Yes/No/Draw tokens for the outcomes. Without tokens the positions are kept as balances inside the market and cannot be transferred or traded elsewhere."),
    },
    oracle: {
      name: i18n.t("forms.create.oracle.name", "Oracle"),
      description: i18n.t("forms.create.oracle.desc", "Address of the oracle that will post the result"),
      placeholder: "MDKKPO375Q5M3GDET2X4H4ZNSO...",
      validator: (value) => {
        return value && obyte.utils.isValidAddress(value);
      },
      errorMessage: i18n.t("forms.create.oracle.error_msg", "Oracle address isn't valid."),
    },
    feed_name: {
      name: i18n.t("forms.create.feed_name.name", "Feed name"),
      description: i18n.t("forms.create.feed_name.desc", "Name of the data feed posted by the oracle"),
      placeholder: "ETH_USD",
      validator: (value) => {
        return value && String(value).trim().length > 0;
      },
    },
    reserve_asset: {
      name: i18n.t("forms.create.reserve_asset.name", "Reserve asset"),
      initValue: "base",
      description: i18n.t("forms.create.reserve_asset.desc", "The asset used to make bets on the outcomes. Profits are paid in the same asset."),
    },
    comparison: {
      name: i18n.t("forms.create.comparison.name", "Comparison"),
      initValue: "==",
      description: i18n.t("forms.create.comparison.desc", "How the actual data feed value posted by the oracle will be compared against the “Data feed value”"),
    },
    datafeed_value: {
      name: i18n.t("forms.create.datafeed_value.name", "Data feed value"),
      description: i18n.t("forms.create.datafeed_value.desc", "The benchmark value that will be compared with the actual data feed value"),
      placeholder: "3251",
      validator: (value) => {
        return value && String(value).trim().length > 0;
      },
    },
    datafeed_draw_value: {
      name: i18n.t("forms.create.datafeed_draw_value.name", "Draw data feed value"),
      description: i18n.t("forms.create.datafeed_draw_value.desc", "The draw value that will be compared with the actual data feed value"),
      placeholder: "3250",
      validator: (value) => {
        return value && String(value).trim().length > 0;
      },
    },
    event_date: {
      name: i18n.t("forms.create.event_date.name", "Date of the event"),
      description: i18n.t("forms.create.event_date.desc", "The future date when the event (such as a sports event, elections, or a measurement of a currency exchange rate) is supposed to happen. Trading stops at this date and hour."),
      placeholder: i18n.t("forms.create.event_date.placeholder", "Select a date"),
      validator: (value) => {
        return Number(value) > moment().unix();
      },
      errorMessage: i18n.t("forms.create.event_date.error_msg", "You have chosen the past or present day."),
    },
    waiting_period_length: {
      name: i18n.t("forms.create.waiting_period_length.name", "Duration of the waiting period (in days)"),
      initValue: 5,
      description: i18n.t("forms.create.waiting_period_length.desc", "How many days after the date of the event to wait for the oracle to post the result. If the oracle doesn’t post during this period, trading resumes."),
      placeholder: "5",
      validator: (value) => {
        return value && isNumber(Number(value)) && Number(value) >= 0;
      },
    },
    issue_fee: {
      name: i18n.t("forms.create.issue_fee.name", "Issue fee"),
      description: i18n.t("forms.create.issue_fee.desc", "The fee charged when buying tokens. The tokens represent bets on specific outcomes. The fee is added to the pool and adds to the income of the holders of the winning token."),
      placeholder: "1",
      initValue: 1,
      validator: (value) => {
        return value && isNumber(Number(value)) && Number(value) >= 0 && Number(value) < 100;
      },
    },
    redeem_fee: {
      name: i18n.t("forms.create.redeem_fee.name", "Redeem fee"),
      description: i18n.t("forms.create.redeem_fee.desc", "The fee charged when selling tokens while trading is active (normally, before the event). Like the issue fee, the fee is added to the pool and adds to the income of the holders of the winning token."),
      placeholder: "2",
      initValue: 2,
      validator: (value) => {
        return value && isNumber(Number(value)) && Number(value) >= 0 && Number(value) < 100;
      },
    },
    arb_profit_fee: {
      name: i18n.t("forms.create.arb_profit_fee.name", "Arbitrageur profit fee"),
      description: i18n.t("forms.create.arb_profit_fee.desc", "The fee charged from the implied arbitrageur profit, assuming they buy or sell tokens to arbitrage against other markets where the same event is traded. The implied profit is proportional to the price change caused by the trade. Like other fees, this fee is added to the pool and adds to the income of the holders of the winning token."),
      placeholder: "90",
      initValue: 90,
      validator: (value) => {
        return value && isNumber(Number(value)) && Number(value) >= 0 && Number(value) < 100;
      },
    },
    quiet_period: {
      name: i18n.t("forms.create.quiet_period.name", "Quiet period (in hours)"),
      initValue: 0,
      description: (value: unknown) => i18n.t("forms.create.quiet_period.desc", "Trading stops {{hours}} hours before the event", { hours: value }),
      placeholder: "0",
      validator: (value) => {
        return value && isNumber(Number(value)) && Number(value) >= 0;
      },
    },
  }) satisfies Record<string, Param>;

export type ParamKey = keyof ReturnType<typeof getParamList>;
