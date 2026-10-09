import obyte from "obyte";
import { isNumber } from "lodash-es";
import moment from "moment";

import i18n from "@/shared/i18n";
import { getParamDescriptions, type MarketParamKey, type ParamDescription } from "@/entities/market";

type Validator = (value: string | number | boolean | undefined) => boolean | string | number | undefined;

/** A market parameter as the create forms edit it: the entity's description plus input rules. */
export type Param = ParamDescription & {
  placeholder?: string;
  initValue?: string | number | boolean;
  validator?: Validator;
  errorMessage?: string;
};

type ParamRules = Partial<Pick<Param, "placeholder" | "initValue" | "validator" | "errorMessage">>;

const isPercent: Validator = (value) => value && isNumber(Number(value)) && Number(value) >= 0 && Number(value) < 100;
const isNonNegativeNumber: Validator = (value) => value && isNumber(Number(value)) && Number(value) >= 0;
const isNotBlank: Validator = (value) => value && String(value).trim().length > 0;

const getRules = (): Partial<Record<MarketParamKey, ParamRules>> => ({
  oracle: {
    placeholder: "MDKKPO375Q5M3GDET2X4H4ZNSO...",
    validator: (value) => value && obyte.utils.isValidAddress(value),
    errorMessage: i18n.t("forms.create.oracle.error_msg", "Oracle address isn't valid."),
  },
  feed_name: { placeholder: "ETH_USD", validator: isNotBlank },
  reserve_asset: { initValue: "base" },
  comparison: { initValue: "==" },
  datafeed_value: { placeholder: "3251", validator: isNotBlank },
  datafeed_draw_value: { placeholder: "3250", validator: isNotBlank },
  event_date: {
    placeholder: i18n.t("forms.create.event_date.placeholder", "Select a date"),
    validator: (value) => Number(value) > moment().unix(),
    errorMessage: i18n.t("forms.create.event_date.error_msg", "You have chosen the past or present day."),
  },
  waiting_period_length: { initValue: 5, placeholder: "5", validator: isNonNegativeNumber },
  issue_fee: { placeholder: "1", initValue: 1, validator: isPercent },
  redeem_fee: { placeholder: "2", initValue: 2, validator: isPercent },
  arb_profit_fee: { placeholder: "90", initValue: 90, validator: isPercent },
  quiet_period: { initValue: 0, placeholder: "0", validator: isNonNegativeNumber },
});

export type ParamKey = MarketParamKey;

/** Descriptions and input rules of every market parameter, resolved in the current language. */
export const getParamList = (): Record<ParamKey, Param> => {
  const descriptions = getParamDescriptions();
  const rules = getRules();

  return Object.fromEntries((Object.keys(descriptions) as ParamKey[]).map((key) => [key, { ...descriptions[key], ...rules[key] }])) as Record<ParamKey, Param>;
};
