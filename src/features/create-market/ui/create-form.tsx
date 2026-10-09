import { useState, type ChangeEvent } from "react";
import { isEmpty } from "lodash-es";
import moment, { type Moment } from "moment";
import { track } from "@/shared/lib/analytics/track";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";

import { QRButton } from "@/shared/ui/qr-button/qr-button";
import { FormLabel } from "@/shared/ui/form-label";
import { MarketCard } from "@/entities/market";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { saveCreationOrder } from "../model/creation-order-slice";
import { selectReserveAssets } from "@/entities/reserve-asset";
import { capitalizeFirstLetter } from "@/shared/lib/capitalize-first-letter";
import { generateLink } from "@/shared/lib/generate-link";
import { CURRENT_FACTORY_AA } from "@/shared/config/env";
import { getCategoryName } from "@/entities/championship";
import { CATEGORIES, getOracleName } from "@/entities/oracle";

import { getParamList, type Param, type ParamKey } from "../lib/create-params";
import type { CreationOrderData } from "../model/types";

import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Combobox } from "@/shared/ui/combobox";
import { DateTimePicker } from "@/shared/ui/datetime-picker";
import { FormItem, type FormItemStatus } from "@/shared/ui/form-item";
import { Input } from "@/shared/ui/input";
import { InputGroup } from "@/shared/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";

type Field<T = string | number> = { value: T; valid: boolean };

const statusOf = (field: Field<string | number | undefined>): FormItemStatus => (field.value !== "" && field.value !== undefined ? (field.valid ? "success" : "error") : undefined);

export const CreateForm = () => {
  const paramList = getParamList();
  // states
  const [allowDraw, setAllowDraw] = useState<Field<boolean | "">>({ value: "", valid: true });
  const [issueTokens, setIssueTokens] = useState(false);
  const [oracle, setOracle] = useState<Field<string>>({ value: "", valid: false });
  const [feedName, setFeedName] = useState<Field<string>>({ value: "", valid: false });
  const [reserveAsset, setReserveAsset] = useState<Field<string>>({ value: paramList.reserve_asset.initValue as string, valid: true });
  const [comparison, setComparison] = useState<Field<string>>({ value: paramList.comparison.initValue as string, valid: true });
  const [datafeedValue, setDataFeedValue] = useState<Field<string>>({ value: "", valid: false });
  const [datafeedDrawValue, setDataFeedDrawValue] = useState<Field<string>>({ value: "", valid: false });
  const [eventDate, setEventDate] = useState<Field<number | "">>({ value: "", valid: false });
  const [waitingPeriodLength, setWaitingPeriodLength] = useState<Field<string | number>>({ value: paramList.waiting_period_length.initValue as number, valid: true });
  const [issueFee, setIssueFee] = useState<Field<string | number>>({ value: paramList.issue_fee.initValue as number, valid: true });
  const [redeemFee, setRedeemFee] = useState<Field<string | number>>({ value: paramList.redeem_fee.initValue as number, valid: true });
  const [arbProfitFee, setArbProfitFee] = useState<Field<string | number>>({ value: paramList.arb_profit_fee.initValue as number, valid: true });
  const [category, setCategory] = useState<Field<string>>({ value: "sport", valid: true });
  const [quietPeriod, setQuietPeriod] = useState<Field<string | number>>({ value: paramList.quiet_period.initValue as number, valid: true });

  const reserveAssets: Record<string, { symbol: string; decimals: number }> = useAppSelector(selectReserveAssets);

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  // handles
  const handleChangeValue = (evOrValue: ChangeEvent<HTMLInputElement> | Moment | string | boolean, type: ParamKey) => {
    let value: string | number | boolean;

    if (["allow_draw", "reserve_asset", "comparison", "oracle", "feed_name"].includes(type)) {
      value = evOrValue as string | boolean;
    } else if (type === "event_date") {
      value = (evOrValue as Moment).unix();
    } else {
      value = (evOrValue as ChangeEvent<HTMLInputElement>).target.value;
    }

    const param = paramList[type] as Param;
    const valid = param.validator ? !!param.validator(value) : true;

    if (type === "allow_draw") {
      setAllowDraw({ value: value as boolean, valid });
    } else if (type === "oracle") {
      setOracle({ value: value as string, valid });
    } else if (type === "feed_name") {
      setFeedName({ value: value as string, valid });
    } else if (type === "reserve_asset") {
      setReserveAsset({ value: value as string, valid });
    } else if (type === "comparison") {
      setComparison({ value: value as string, valid });
    } else if (type === "datafeed_value") {
      setDataFeedValue({ value: value as string, valid });
    } else if (type === "datafeed_draw_value") {
      setDataFeedDrawValue({ value: value as string, valid });
    } else if (type === "event_date") {
      setEventDate({ value: value as number, valid });
    } else if (type === "quiet_period") {
      setQuietPeriod({ value: value as string, valid });
    } else if (type === "waiting_period_length") {
      setWaitingPeriodLength({ value: value as string, valid });
    } else if (type === "issue_fee") {
      setIssueFee({ value: value as string, valid });
    } else if (type === "redeem_fee") {
      setRedeemFee({ value: value as string, valid });
    } else if (type === "arb_profit_fee") {
      setArbProfitFee({ value: value as string, valid });
    }
  };

  const minDate = moment().hours(0).minutes(0).seconds(0).milliseconds(0);

  const isValidForm = oracle.valid && feedName.valid && datafeedValue.valid && eventDate.valid && waitingPeriodLength.valid && issueFee.valid && redeemFee.valid && quietPeriod.valid && (allowDraw.value ? datafeedDrawValue.valid : 1) && arbProfitFee.valid;

  const data: CreationOrderData = {
    oracle: oracle.value,
    feed_name: feedName.value,
    reserve_asset: reserveAsset.value,
    comparison: comparison.value,
    datafeed_value: datafeedValue.value,
    event_date: moment.unix(Number(eventDate.value)).utc().seconds(0).format("YYYY-MM-DDTHH:mm:ss"),
    waiting_period_length: Number(waitingPeriodLength.value) * 24 * 3600,
    issue_fee: Number(issueFee.value) / 100,
    redeem_fee: Number(redeemFee.value) / 100,
    arb_profit_tax: Number(arbProfitFee.value) / 100,
    reserve_decimals: reserveAssets[reserveAsset.value]?.decimals,
    quiet_period: Number(quietPeriod.value) * 3600,
  };

  if (allowDraw.value) {
    data.allow_draw = 1;
    data.datafeed_draw_value = datafeedDrawValue.value;
  }

  if (!issueTokens) {
    data.is_tokenless = true;
  }

  const save = () => {
    if (!isValidForm) return null;

    track({
      category: "Create",
      action: `Create ${category.value} market` as const,
      label: data.oracle,
    });

    dispatch(saveCreationOrder(data));
  };

  const categories = CATEGORIES as Record<string, { oracles?: { address: string; feedNames?: string[] }[] }>;
  const infoByCurrentCategory = categories[category.value] || {};

  const handleChangeCategory = (value: string) => {
    const infoByCurrentCategory = categories[value] || {};

    if (value === "misc") {
      setOracle({ value: "", valid: false });
    } else if (value === "currency") {
      setFeedName({ value: "", valid: false });
    }

    if (value !== "misc" && !isEmpty(infoByCurrentCategory.oracles)) {
      const value = infoByCurrentCategory.oracles![0].address;
      setOracle({ value, valid: true });
    }

    setCategory({ value, valid: true });
  };

  const feedNames = infoByCurrentCategory?.oracles?.find(({ address }) => address === oracle.value)?.feedNames;

  const link = generateLink({ amount: 2e4, data: { ...data, reserve_decimals: undefined }, aa: CURRENT_FACTORY_AA });

  const timeZone = moment().utcOffset() / 60;

  const categoryOptions = [
    ...Object.keys(categories).map((category) => ({ value: category, label: capitalizeFirstLetter(getCategoryName(category)), text: getCategoryName(category) })),
    { value: "misc", label: t("common.misc", "Misc"), text: "misc" },
  ];

  const percentInput = (field: Field<string | number>, key: ParamKey, placeholder?: string) => (
    <FormItem status={statusOf(field)} label={<FormLabel info={(paramList[key] as Param).description as string}>{paramList[key].name}</FormLabel>}>
      {(control) => <InputGroup {...control} suffix={<span>%</span>} placeholder={placeholder} value={field.value} onChange={(ev) => handleChangeValue(ev, key)} />}
    </FormItem>
  );

  return (
    <form className="text-base" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
        <FormItem label={<FormLabel info={t("forms.create.category_desc", "Type of the market. There are custom interfaces for sport and currencies.")}>{t("forms.create.category", "Category")}</FormLabel>}>
          {(control) => (
            <Select value={category.value} onValueChange={handleChangeCategory}>
              <SelectTrigger {...control} className="w-full capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="capitalize">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormItem>
      </div>

      {category.value === "currency" && (
        <FormItem>
          <Alert className="border-draw/40 bg-draw/10 text-foreground">
            <TriangleAlert className="text-draw" />
            <AlertDescription className="text-foreground">
              <Trans i18nKey="forms.create.calendar_currency_desc">
                Creating markets for currency events is easier by finding them in the <Link to="/currency#calendar">calendar</Link> on the main page
              </Trans>
            </AlertDescription>
          </Alert>
        </FormItem>
      )}

      {category.value !== "sport" && (
        <>
          <FormItem>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
              <div className="flex items-center gap-2.5">
                <FormLabel info={paramList.allow_draw.description}>{paramList.allow_draw.name}</FormLabel>
                <Switch defaultChecked={!!allowDraw.value} onCheckedChange={(checked) => handleChangeValue(checked, "allow_draw")} />
              </div>
              <div className="flex items-center gap-2.5">
                <FormLabel info={paramList.issue_tokens.description}>{paramList.issue_tokens.name}</FormLabel>
                <Switch checked={issueTokens} onCheckedChange={setIssueTokens} aria-label={paramList.issue_tokens.name} />
              </div>
            </div>
          </FormItem>

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <FormItem help={oracle.value !== "" && !oracle.valid ? paramList.oracle.errorMessage : ""} status={statusOf(oracle)} label={<FormLabel info={paramList.oracle.description}>{paramList.oracle.name}</FormLabel>}>
              {(control) =>
                infoByCurrentCategory.oracles ? (
                  <Select value={oracle.value} onValueChange={(value) => handleChangeValue(value, "oracle")}>
                    <SelectTrigger {...control} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {infoByCurrentCategory.oracles.map(({ address }) => (
                        <SelectItem key={address} value={address}>
                          {getOracleName(category.value, address)} ({address})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input {...control} onChange={(ev) => handleChangeValue(ev.target.value, "oracle")} value={oracle.value} placeholder={paramList.oracle.placeholder} />
                )
              }
            </FormItem>

            <FormItem help={feedName.value !== "" && !feedName.valid ? (paramList.feed_name as Param).errorMessage : ""} status={statusOf(feedName)} label={<FormLabel info={paramList.feed_name.description}>{paramList.feed_name.name}</FormLabel>}>
              {(control) =>
                category.value !== "currency" || !feedNames || feedNames.length === 0 ? (
                  <Input {...control} onChange={(ev) => handleChangeValue(ev.target.value, "feed_name")} value={feedName.value} placeholder={paramList.feed_name.placeholder} />
                ) : (
                  <Combobox {...control} value={feedName.value} onValueChange={(value) => handleChangeValue(value, "feed_name")} options={feedNames.map((feedName) => ({ value: feedName, label: feedName }))} placeholder={paramList.feed_name.placeholder} />
                )
              }
            </FormItem>
          </div>

          <div className={`grid grid-cols-1 gap-x-4 ${allowDraw.value ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            <FormItem status="success" label={<FormLabel info={paramList.comparison.description}>{paramList.comparison.name}</FormLabel>}>
              {(control) => (
                <Select value={comparison.value} onValueChange={(value) => handleChangeValue(value, "comparison")}>
                  <SelectTrigger {...control} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="==">=</SelectItem>
                    <SelectItem value=">">{">"}</SelectItem>
                    <SelectItem value="<">{"<"}</SelectItem>
                    <SelectItem value=">=">{">="}</SelectItem>
                    <SelectItem value="<=">{"<="}</SelectItem>
                    <SelectItem value="!=">!=</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FormItem>

            <FormItem status={statusOf(datafeedValue)} label={<FormLabel info={paramList.datafeed_value.description}>{paramList.datafeed_value.name}</FormLabel>}>
              {(control) => <Input {...control} onChange={(ev) => handleChangeValue(ev, "datafeed_value")} value={datafeedValue.value} placeholder={paramList.datafeed_value.placeholder} />}
            </FormItem>

            {allowDraw.value && (
              <FormItem status={statusOf(datafeedDrawValue)} label={<FormLabel info={paramList.datafeed_draw_value.description}>{paramList.datafeed_draw_value.name}</FormLabel>}>
                {(control) => <Input {...control} onChange={(ev) => handleChangeValue(ev, "datafeed_draw_value")} value={datafeedDrawValue.value} placeholder={paramList.datafeed_draw_value.placeholder} />}
              </FormItem>
            )}
          </div>

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

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
            <FormItem
              help={eventDate.value !== "" && !eventDate.valid ? paramList.event_date.errorMessage : ""}
              status={statusOf(eventDate)}
              label={
                <FormLabel info={paramList.event_date.description}>
                  {paramList.event_date.name} (UTC{timeZone >= 0 ? "+" : "-"}
                  {timeZone})
                </FormLabel>
              }
            >
              {(control) => <DateTimePicker {...control} min={minDate} value={eventDate.value ? moment.unix(Number(eventDate.value)) : undefined} onChange={(value) => handleChangeValue(value, "event_date")} placeholder={paramList.event_date.placeholder} />}
            </FormItem>

            <FormItem status={statusOf(quietPeriod)} label={<FormLabel value={quietPeriod.valid ? quietPeriod.value : 0} info={paramList.quiet_period.description}>{paramList.quiet_period.name}</FormLabel>}>
              {(control) => <Input {...control} placeholder={paramList.quiet_period.placeholder} onChange={(ev) => handleChangeValue(ev, "quiet_period")} value={quietPeriod.value} />}
            </FormItem>

            <FormItem status={statusOf(waitingPeriodLength)} label={<FormLabel info={paramList.waiting_period_length.description}>{paramList.waiting_period_length.name}</FormLabel>}>
              {(control) => <Input {...control} placeholder={paramList.waiting_period_length.placeholder} onChange={(ev) => handleChangeValue(ev, "waiting_period_length")} value={waitingPeriodLength.value} />}
            </FormItem>
          </div>

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
            {percentInput(issueFee, "issue_fee", paramList.issue_fee.placeholder)}
            {percentInput(redeemFee, "redeem_fee", paramList.redeem_fee.placeholder)}
            {percentInput(arbProfitFee, "arb_profit_fee", paramList.arb_profit_fee.placeholder)}
          </div>

          {isValidForm && (
            <div style={{ maxWidth: 780 }}>
              <div style={{ marginBottom: 10 }}>
                <FormLabel info={t("forms.create.preview_desc", "This is how the market you want to create will look like")}>{t("forms.create.preview", "Preview")}</FormLabel>
              </div>

              <MarketCard
                preview
                previewValues={[0, 3, 5, 6.6, 7.8, 8.62]}
                market={{
                  oracle: oracle.value,
                  feed_name: feedName.value,
                  event_date: Number(eventDate.value),
                  waiting_period_length: Number(waitingPeriodLength.value),
                  allow_draw: !!allowDraw.value,
                  comparison: comparison.value,
                  reserve_symbol: reserveAssets[reserveAsset.value].symbol,
                  datafeed_value: datafeedValue.value,
                  quiet_period: Number(quietPeriod.value),
                }}
                />
            </div>
          )}
        </>
      )}

      {category.value === "sport" && (
        <FormItem>
          <Alert className="border-draw/40 bg-draw/10 text-foreground">
            <TriangleAlert className="text-draw" />
            <AlertDescription className="text-foreground">
              <Trans i18nKey="forms.create.calendar_sport_desc">
                To create markets for sports events find them in the <Link to="/soccer/all#calendar">calendar</Link> on the main page
              </Trans>
            </AlertDescription>
          </Alert>
        </FormItem>
      )}

      {category.value !== "sport" && (
        <FormItem>
          <QRButton disabled={!isValidForm || category.value === "sport"} size="lg" onClick={save} href={link}>
            {t("forms.common.create", "Create")}
          </QRButton>
        </FormItem>
      )}
    </form>
  );
};
