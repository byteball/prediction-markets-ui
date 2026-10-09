import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Img } from "react-image";
import moment, { type Moment } from "moment";
import { debounce, isNaN } from "lodash-es";
import { track } from "@/shared/lib/analytics/track";
import { useTranslation } from "react-i18next";

import { FormLabel } from "@/shared/ui/form-label";
import { QRButton } from "@/shared/ui/qr-button/qr-button";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { saveCreationOrder } from "../model/creation-order-slice";
import { selectReserveAssets } from "@/entities/reserve-asset";
import { generateLink } from "@/shared/lib/generate-link";
import { CURRENT_FACTORY_AA } from "@/shared/config/env";
import { NO_COLOR, YES_COLOR } from "@/shared/config/colors";
import { generateTextEvent, isDrawAllowed } from "@/entities/market";
import { CATEGORIES, isSportOracle } from "@/entities/oracle";
import client from "@/shared/api/obyte-client";

import { getParamList, type Param, type ParamKey } from "../lib/create-params";
import type { CreationOrderData } from "../model/types";

import { Combobox } from "@/shared/ui/combobox";
import { DateTimePicker } from "@/shared/ui/datetime-picker";
import { FormItem, type FormItemStatus } from "@/shared/ui/form-item";
import { Input } from "@/shared/ui/input";
import { InputGroup } from "@/shared/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";

import styles from "./create-now-form.module.css";

const f = (x: unknown) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

type Field<T = string | number> = { value: T; valid: boolean };

const statusOf = (field: Field<string | number | undefined>): FormItemStatus => (field.value !== "" && field.value !== undefined ? (field.valid ? "success" : "error") : undefined);

export type CreateNowFormProps = {
  feed_name?: string;
  event_date: number;
  expect_datafeed_value?: string | number;
  yes_team?: string;
  no_team?: string;
  oracle?: string;
  expect_comparison?: string;
  waiting_period_length?: number;
  quiet_period?: number;
  yes_crest_url?: string | null;
  no_crest_url?: string | null;
  league?: string;
};

export const CreateNowForm = ({ feed_name, event_date, expect_datafeed_value, yes_team, no_team, oracle, expect_comparison, waiting_period_length = 0, quiet_period = 0, yes_crest_url = null, no_crest_url = null, league }: CreateNowFormProps) => {
  const paramList = getParamList();

  const [issueFee, setIssueFee] = useState<Field<string | number>>({ value: paramList.issue_fee.initValue as number, valid: true });
  const [redeemFee, setRedeemFee] = useState<Field<string | number>>({ value: paramList.redeem_fee.initValue as number, valid: true });
  const [arbProfitFee, setArbProfitFee] = useState<Field<string | number>>({ value: paramList.arb_profit_fee.initValue as number, valid: true });
  const [reserveAsset, setReserveAsset] = useState<Field<string>>({ value: paramList.reserve_asset.initValue as string, valid: true });
  const [comparison, setComparison] = useState<Field<string>>({ value: expect_comparison || ">", valid: true });
  const [issueTokens, setIssueTokens] = useState(false);

  const [eventDate, setEventDate] = useState<Field<number>>({ value: event_date, valid: true });
  const [feedName, setFeedName] = useState<Field<string | undefined>>({ value: feed_name, valid: true });

  const [customOracle, setCustomOracle] = useState<Field<string | undefined>>({ value: oracle, valid: true });
  const [currentFeedValue, setCurrentFeedValue] = useState<{ value: unknown; valid: boolean; loading: boolean }>({ value: undefined, valid: true, loading: true });

  const [datafeedValue, setDataFeedValue] = useState<Field<string | number | undefined>>({ value: expect_datafeed_value, valid: true });
  const [quietPeriod, setQuietPeriod] = useState<Field<string | number>>({ value: +Number(quiet_period / 3600).toFixed(6), valid: true });
  const [waitingPeriodLength, setWaitingPeriodLength] = useState<Field<string | number>>({ value: +Number(waiting_period_length / (24 * 3600)).toFixed(6), valid: true });

  const minDate = moment().hours(0).minutes(0).seconds(0).milliseconds(0);

  const reserveAssets: Record<string, { symbol: string; decimals: number }> = useAppSelector(selectReserveAssets);

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleChangeValue = (evOrValue: ChangeEvent<HTMLInputElement> | Moment | string, type: ParamKey) => {
    let value: string | number;

    if (["reserve_asset", "feed_name", "comparison"].includes(type)) {
      value = evOrValue as string;
    } else if (type === "event_date") {
      value = (evOrValue as Moment).utc().unix();
    } else {
      value = (evOrValue as ChangeEvent<HTMLInputElement>).target.value;
    }

    const param = paramList[type] as Param;
    const valid = param.validator ? !!param.validator(value) : true;

    if (type === "issue_fee") {
      setIssueFee({ value, valid });
    } else if (type === "redeem_fee") {
      setRedeemFee({ value, valid });
    } else if (type === "arb_profit_fee") {
      setArbProfitFee({ value, valid });
    } else if (type === "reserve_asset") {
      setReserveAsset({ value: value as string, valid });
    } else if (type === "event_date") {
      setEventDate({ value: value as number, valid });
    } else if (type === "datafeed_value" && f(value) <= 9) {
      setDataFeedValue({ value, valid: valid && !isNaN(Number(value)) });
    } else if (type === "waiting_period_length" && f(value) <= 7) {
      setWaitingPeriodLength({ value, valid });
    } else if (type === "quiet_period") {
      setQuietPeriod({ value, valid });
    } else if (type === "feed_name") {
      setFeedName({ value: value as string, valid });
    } else if (type === "comparison") {
      setComparison({ value: value as string, valid });
    }
  };

  const type = isSportOracle(oracle) ? "sport" : "currency";

  const data = {
    oracle: type === "sport" ? oracle : customOracle.value,
    event_date: moment.unix(type === "sport" ? event_date : eventDate.value).utc().format("YYYY-MM-DDTHH:mm:ss"),
    feed_name: String(type === "sport" ? feed_name : feedName.value).toUpperCase(),
    comparison: type === "sport" ? "==" : comparison.value,
    datafeed_value: type === "sport" ? expect_datafeed_value : datafeedValue.value,
    waiting_period_length: type === "sport" ? 3 * 24 * 3600 : Math.ceil(Number(waitingPeriodLength.value) * 24 * 3600),
    issue_fee: Number(issueFee.value) / 100,
    redeem_fee: Number(redeemFee.value) / 100,
    arb_profit_tax: Number(arbProfitFee.value) / 100,
    allow_draw: type === "sport" && isDrawAllowed(league, event_date) ? 1 : undefined,
    datafeed_draw_value: type === "sport" ? "draw" : undefined,
    reserve_asset: reserveAsset.value,
    quiet_period: (type === "sport" ? 0 : Number(quietPeriod.value)) * 3600,
    is_tokenless: issueTokens ? undefined : true,
  };

  const create = () => {
    dispatch(saveCreationOrder({ ...data, yes_team, no_team, reserve_decimals: reserveAssets[reserveAsset.value].decimals } as CreationOrderData));

    track({
      category: "Create",
      action: `Create ${type} market` as const,
      label: data.oracle,
    });
  };

  const link = generateLink({ amount: 2e4, data, aa: CURRENT_FACTORY_AA });

  let event: string | undefined;

  if (type !== "sport") {
    event = generateTextEvent({
      oracle: customOracle.value,
      event_date: eventDate.valid ? eventDate.value : event_date,
      feed_name: feedName.value,
      datafeed_value: datafeedValue.valid ? datafeedValue.value : expect_datafeed_value,
      comparison: comparison.value,
      yes_team_name: undefined,
      no_team_name: undefined,
    });
  }

  let dataFeedCurrency = "";

  if (type === "currency") {
    if (feedName.value) {
      const split = String(feedName.value)?.split("_");

      if (split.length === 2) {
        dataFeedCurrency = split[split.length - 1];
      }
    }
  }

  const handleChangeFeedName = (value: string | undefined) => {
    handleChangeValue(String(value).toUpperCase(), "feed_name");
    setCurrentFeedValue({ value: undefined, valid: false, loading: true });

    const oracle = CATEGORIES.currency.oracles.find(({ feedNames }) => feedNames?.includes(value as string));

    if (oracle) {
      setCustomOracle({ value: oracle.address, valid: true });
    }

    getDataFeed(String(value));
  };

  const currencyFeedNameList = useMemo(() => {
    const feedNameList: string[] = [];
    CATEGORIES.currency.oracles.forEach(({ feedNames }) => feedNameList.push(...(feedNames ?? [])));

    return feedNameList;
  }, []);

  const getDataFeed = debounce(async (feed_name: string, foundOracle?: string) => {
    let value: unknown = undefined;
    let oracle = foundOracle;

    if (foundOracle) {
      const data = await client.api.getDataFeed({ oracles: [foundOracle], feed_name: String(feed_name).toUpperCase(), ifnone: false });
      if (data) {
        value = data;
      }
    } else {
      for (const { address } of CATEGORIES.currency.oracles) {
        const data = await client.api.getDataFeed({ oracles: [address], feed_name: String(feed_name).toUpperCase(), ifnone: false });

        if (data) {
          value = data;
          oracle = address;
          break;
        }
      }
    }

    setCustomOracle({ value: oracle, valid: !!oracle });
    setCurrentFeedValue({ value, valid: true, loading: false });
  }, 1200);

  useEffect(() => {
    handleChangeFeedName(feed_name);
  }, [feed_name]);

  const percentInput = (field: Field<string | number>, key: ParamKey, placeholder?: string) => (
    <FormItem status={statusOf(field)} label={<FormLabel info={(paramList[key] as Param).description as string}>{paramList[key].name}</FormLabel>}>
      {(control) => <InputGroup {...control} suffix={<span>%</span>} placeholder={placeholder} value={field.value} onChange={(ev) => handleChangeValue(ev, key)} />}
    </FormItem>
  );

  const rowLabel = (text: string) => (
    <div className="flex h-[38px] w-[150px] shrink-0 items-center text-lg">
      <span>{text}</span>
    </div>
  );

  return (
    <form className="text-base" onSubmit={(e) => e.preventDefault()}>
      {type === "sport" ? (
        <div className="grid grid-cols-1 items-center gap-x-2 sm:grid-cols-3" style={{ marginBottom: 20 }}>
          <div className="text-center">
            <Img src={yes_crest_url ?? ""} className={styles.crests} />
            <div className={styles.teamWrap}>
              <span style={{ color: YES_COLOR }} className="block truncate">
                <small>{yes_team}</small>
              </span>
            </div>
          </div>

          <div className={`text-center ${styles.draw}`}>
            <b style={{ fontSize: 24 }}>{t("common.vs", "VS")}</b>
            <div>
              <small>{moment.unix(event_date).format("lll")}</small>
            </div>
          </div>

          <div className="text-center">
            <Img src={no_crest_url ?? ""} className={styles.crests} />
            <div className={styles.teamWrap}>
              <span style={{ color: NO_COLOR }} className="block truncate">
                <small>{no_team}</small>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ minHeight: 77 }}>
          <h5 className="text-base font-semibold">{event}</h5>
        </div>
      )}

      <div className="flex flex-col">
        {type === "currency" && (
          <>
            <div className="flex gap-2">
              {rowLabel(t("forms.create_now.market_pair", "Market pair"))}
              <div className="min-w-0 flex-1">
                <FormItem
                  extra={
                    currentFeedValue.loading ? (
                      t("forms.create_now.loading_rate", "Loading rate...")
                    ) : (
                      <span style={{ color: currentFeedValue.value ? "green" : "red" }}>
                        {currentFeedValue.value ? t("forms.create_now.current_rate", "Current rate: {{value}} {{symbol}}", { value: currentFeedValue.value, symbol: dataFeedCurrency }) : t("forms.create_now.no_pair", "Pair not found")}
                      </span>
                    )
                  }
                  status={statusOf(feedName)}
                >
                  {(control) => (
                    <Combobox
                      {...control}
                      allowCustomValue
                      placeholder={paramList.feed_name.placeholder}
                      value={feedName.value ?? ""}
                      onValueChange={handleChangeFeedName}
                      options={currencyFeedNameList.map((feedName) => ({ value: feedName, label: feedName }))}
                    />
                  )}
                </FormItem>
              </div>
            </div>

            <div className="flex gap-2">
              {rowLabel(t("forms.create_now.be_above", "to be above"))}
              <div className="min-w-0 flex-1">
                <FormItem status={statusOf(datafeedValue)}>
                  {(control) => <InputGroup {...control} suffix={dataFeedCurrency} onChange={(ev) => handleChangeValue(ev, "datafeed_value")} value={datafeedValue.value ?? ""} placeholder={paramList.datafeed_value.placeholder} />}
                </FormItem>
              </div>
            </div>

            <div className="flex gap-2">
              {rowLabel(t("forms.create_now.on", "on"))}
              <div className="min-w-0 flex-1">
                <FormItem help={!eventDate.valid ? paramList.event_date.errorMessage : ""} status={statusOf(eventDate)}>
                  {(control) => <DateTimePicker {...control} min={minDate} value={moment.unix(eventDate.value)} onChange={(value) => handleChangeValue(value, "event_date")} placeholder={paramList.event_date.placeholder} />}
                </FormItem>
              </div>
            </div>
          </>
        )}

        <FormItem status="success" label={<FormLabel info={paramList.reserve_asset.description}>{paramList.reserve_asset.name}</FormLabel>}>
          {(control) => (
            <Select value={reserveAsset.value} onValueChange={(value) => handleChangeValue(value, "reserve_asset")}>
              <SelectTrigger {...control} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {!reserveAssets && <SelectItem value="base">GBYTE</SelectItem>}
                {reserveAssets &&
                  Object.entries(reserveAssets).map(([asset, { symbol }]) => (
                    <SelectItem key={asset} value={asset}>
                      {symbol}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </FormItem>

        <FormItem>
          <div className="flex items-center gap-2.5">
            <FormLabel info={paramList.issue_tokens.description}>{paramList.issue_tokens.name}</FormLabel>
            <Switch checked={issueTokens} onCheckedChange={setIssueTokens} aria-label={paramList.issue_tokens.name} />
          </div>
        </FormItem>

        {percentInput(issueFee, "issue_fee", paramList.issue_fee.placeholder)}
        {percentInput(redeemFee, "redeem_fee", paramList.redeem_fee.placeholder)}
        {percentInput(arbProfitFee, "arb_profit_fee", paramList.arb_profit_fee.placeholder)}

        {type !== "sport" && (
          <FormItem status={statusOf(quietPeriod)} label={<FormLabel value={quietPeriod.valid ? quietPeriod.value : 0} info={paramList.quiet_period.description}>{paramList.quiet_period.name}</FormLabel>}>
            {(control) => <Input {...control} placeholder={paramList.quiet_period.placeholder} onChange={(ev) => handleChangeValue(ev, "quiet_period")} value={quietPeriod.value} />}
          </FormItem>
        )}
      </div>

      <QRButton href={link} disabled={!issueFee.valid || !redeemFee.valid || !arbProfitFee.valid || (type === "currency" && (!eventDate.valid || !datafeedValue.valid || !customOracle.valid || currentFeedValue.loading))} onClick={create} size="lg">
        {t("forms.common.create", "Create")}
      </QRButton>
    </form>
  );
};
