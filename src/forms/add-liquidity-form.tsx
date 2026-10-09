import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { PieConfig } from "@ant-design/plots";
import { Pie } from "components/charts";
import { toast } from "sonner";
import { isNumber } from "lodash-es";
import ReactGA from "react-ga4";
import { Trans, useTranslation } from "react-i18next";

import appConfig from "app-config";
import client from "services/obyte";

import { QRButton } from "components/qr-button/qr-button";
import { WalletModal } from "modals";
import { useAppSelector } from "store/hooks";
import { selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars } from "store/slices/active-slice";
import { selectTokensByNetwork } from "store/slices/bridges-slice";
import { selectWalletAddress } from "store/slices/settings-slice";
import { capitalizeFirstLetter, generateLink, getExchangeResult, getMarketPriceByType } from "utils";

import { Alert, AlertDescription, AlertTitle } from "components/ui/alert";
import { Button } from "components/ui/button";
import { Combobox, type ComboboxOption } from "components/ui/combobox";
import { FormItem } from "components/ui/form-item";
import { Input } from "components/ui/input";
import { InputGroup } from "components/ui/input-group";

const f = (x: unknown) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);
const floorDecimals = (number: number, decimals: number) => Math.floor(number * 10 ** decimals) / 10 ** decimals;

type FromToken = { asset: string; decimals: number; symbol: string; foreign_asset: string; network: string };
type BridgeToken = { home_asset: string; home_asset_decimals: number; foreign_asset: string; home_symbol: string; home_network: string; bridge_id: string | number };
type Probability = { value: string | number; valid: boolean };
type Probabilities = { yes: Probability; no: Probability; draw: Probability };

export type AddLiquidityFormProps = {
  yes_team?: string;
  no_team?: string;
};

const emptyProbabilities: Probabilities = { yes: { value: "", valid: true }, no: { value: "", valid: true }, draw: { value: "", valid: true } };

const getSuggestedProbabilities = (yes_odds: number | null, no_odds: number | null, draw_odds: number | null, isFirstIssue: boolean): Probabilities => {
  if (!(yes_odds && no_odds && draw_odds && isFirstIssue)) return emptyProbabilities;

  const sum = 1 / yes_odds + 1 / no_odds + 1 / draw_odds;

  return {
    yes: { value: floorDecimals((1 / yes_odds / sum) * 100, 2), valid: true },
    no: { value: floorDecimals((1 / no_odds / sum) * 100, 2), valid: true },
    draw: { value: "", valid: true },
  };
};

export const AddLiquidityForm = ({ yes_team, no_team }: AddLiquidityFormProps) => {
  const params = useAppSelector(selectActiveMarketParams);
  const stateVars = useAppSelector(selectActiveMarketStateVars);

  const walletAddress = useAppSelector(selectWalletAddress);
  const address = useAppSelector(selectActiveAddress);
  const tokensByNetwork: Record<string, BridgeToken[]> = useAppSelector(selectTokensByNetwork);

  const { t } = useTranslation();

  const { allow_draw, reserve_asset, reserve_decimals, reserve_symbol, base_aa, yes_odds: bookmaker_yes_odds, no_odds: bookmaker_no_odds, draw_odds: bookmaker_draw_odds } = params;
  const { supply_yes = 0, supply_no = 0, supply_draw = 0, reserve = 0 } = stateVars;

  const isFirstIssue = supply_yes + supply_no + supply_draw === 0;

  const [reserveAmount, setReserveAmount] = useState<{ value: string | number | undefined; valid: boolean }>({ value: 0.1, valid: true });
  // The form remounts on every open, so the initial state replaces the old "set on mount" effects.
  const [probabilities, setProbabilities] = useState<Probabilities>(() => getSuggestedProbabilities(bookmaker_yes_odds, bookmaker_no_odds, bookmaker_draw_odds, isFirstIssue));
  const [fromToken, setFromToken] = useState<FromToken>(() => ({ asset: reserve_asset, decimals: reserve_decimals, symbol: reserve_symbol, network: "Obyte", foreign_asset: "no" }));
  const [estimate, setEstimate] = useState<number>();
  const [estimateError, setEstimateError] = useState<string>();

  const network_fee = reserve_asset === "base" ? 1e4 : 0;
  const minAmount = reserve_asset === "base" ? network_fee / 1e9 : 1 / 10 ** reserve_decimals;
  const haveTeamNames = yes_team && no_team;
  const needsIssueFeeForLiquidity = (appConfig.BASE_AAS ?? []).findIndex((address) => address === base_aa) === 0;

  let amountInPennies = 0;
  let amountInPenniesWithoutFee = 0;

  if (fromToken && reserveAmount.valid && Number(reserveAmount.value)) {
    amountInPennies = Math.ceil(Number(fromToken.network === "Obyte" ? reserveAmount.value : estimate) * 10 ** reserve_decimals);
    amountInPenniesWithoutFee = amountInPennies * (1 - (needsIssueFeeForLiquidity ? params.issue_fee : 0)) - network_fee;
  }

  const drawPercent = probabilities.yes.valid && probabilities.no.valid && Number(probabilities.no.value) + Number(probabilities.yes.value) < 100 ? 100 - Number(probabilities.no.value) - Number(probabilities.yes.value) : 0;
  const percentSum = Number(probabilities.no.value || 0) + Number(probabilities.yes.value || 0) + (allow_draw ? drawPercent : 0);

  let yesAmount: number;
  let noAmount: number;
  let drawAmount: number;

  let yesOdds = "";
  let noOdds = "";
  let drawOdds = "";

  if (isFirstIssue) {
    yesAmount = Math.floor(Math.sqrt(amountInPenniesWithoutFee ** 2 * (Number(probabilities.yes.value) / 100 || 0)));
    noAmount = Math.floor(Math.sqrt(amountInPenniesWithoutFee ** 2 * (Number(probabilities.no.value) / 100 || 0)));
    drawAmount = allow_draw ? Math.floor(Math.sqrt(amountInPenniesWithoutFee ** 2 * (drawPercent / 100 || 0))) : 0;

    const new_den = Math.sqrt(yesAmount * yesAmount + noAmount * noAmount + drawAmount * drawAmount);

    if (reserveAmount.valid && reserveAmount.value && Number(reserveAmount.value) > 0 && percentSum === 100) {
      yesOdds = Number(probabilities.yes.value) !== 0 ? `${t("common.odds", "odds")}: x${+(amountInPenniesWithoutFee / yesAmount / (yesAmount / new_den)).toFixed(4)}` : "";
      noOdds = Number(probabilities.no.value) !== 0 ? `${t("common.odds", "odds")}: x${+(amountInPenniesWithoutFee / noAmount / (noAmount / new_den)).toFixed(4)}` : "";
      drawOdds = Number(drawPercent) !== 0 ? `${t("common.odds", "odds")}: x${+(amountInPenniesWithoutFee / drawAmount / (drawAmount / new_den)).toFixed(4)}` : "";
    }
  } else {
    const ratio = (amountInPenniesWithoutFee + reserve) / reserve;

    yesAmount = Math.ceil(ratio * supply_yes - supply_yes);
    noAmount = Math.ceil(ratio * supply_no - supply_no);
    drawAmount = Math.ceil(ratio * supply_draw - supply_draw);
  }

  const yesReserveAmount = yesAmount * getMarketPriceByType(stateVars, "yes");
  const noReserveAmount = noAmount * getMarketPriceByType(stateVars, "no");
  const drawReserveAmount = drawAmount * getMarketPriceByType(stateVars, "draw");

  const handleChangeProbability = (ev: ChangeEvent<HTMLInputElement>, type: "yes" | "no") => {
    const value = ev.target.value;

    if (value === "") {
      setProbabilities((p) => ({
        ...p,
        [type]: {
          value,
          valid: true,
        },
      }));
    } else {
      if (f(value) <= 2) {
        if (allow_draw) {
          setProbabilities((p) => ({
            ...p,
            [type]: {
              value,
              valid: isNumber(Number(value)) && Number(value) >= 0 && Number(value) <= 100,
            },
          }));
        } else {
          if (type === "yes") {
            setProbabilities((p) => ({
              ...p,
              [type]: {
                value,
                valid: isNumber(Number(value)) && Number(value) >= 0 && Number(value) <= 100,
              },
              no: {
                value: Number(value) < 100 ? 100 - Number(value) : 0,
                valid: true,
              },
            }));
          } else if (type === "no") {
            setProbabilities((p) => ({
              ...p,
              [type]: {
                value,
                valid: isNumber(Number(value)) && Number(value) >= 0 && Number(value) <= 100,
              },
              yes: {
                value: Number(value) < 100 ? 100 - Number(value) : 0,
                valid: true,
              },
            }));
          }
        }
      }
    }
  };

  const handleChangeFromToken = (strValue: string) => {
    const [network, asset, decimals, foreign_asset, ...symbol] = strValue.split("__");

    setFromToken({ asset, decimals: Number(decimals || 0), symbol: symbol.join("__"), network, foreign_asset });

    if (reserveAmount.valid && reserveAmount.value) {
      setReserveAmount((a) => ({ ...a, value: +Number(a.value).toFixed(Number(decimals)) }));
    }
  };

  useEffect(() => {
    const run = async () => {
      if (fromToken && fromToken.network !== "Obyte" && reserveAmount.value && reserveAmount.valid && Number(reserveAmount.value) > 0) {
        try {
          const { estimateOutput } = await import("counterstake-sdk");
          const res = await estimateOutput({
            amount: Number(reserveAmount.value),
            src_network: fromToken.network,
            src_asset: fromToken.asset,
            dst_network: "Obyte",
            dst_asset: reserve_asset,
            recipient_address: walletAddress,
            assistant_reward_percent: 1.0,
            testnet: appConfig.ENVIRONMENT === "testnet",
            obyteClient: client,
          });

          if (res && typeof res === "number" && res > 0) {
            setEstimate(res);
          } else {
            setEstimate(0);
          }

          setEstimateError(undefined);
        } catch (e) {
          setEstimate(0);
          setEstimateError((e as Error).message);
          console.log("estimateOutput error");
        }
      } else if (estimate) {
        setEstimate(0);
      }
    };

    run();
  }, [fromToken, reserveAmount]);

  const meta = reserveAmount.valid && reserveAmount.value && (fromToken.network === "Obyte" || estimate) ? getExchangeResult(stateVars, params, yesAmount, noAmount, drawAmount) : null;

  const dataForPie = useMemo(() => {
    if (!meta) return [];

    const data = [
      { type: "YES", token: "yes", value: +Number((amountInPenniesWithoutFee * Number(probabilities.yes.value)) / 100 / 10 ** reserve_decimals).toFixed(reserve_decimals) },
      { type: "NO", token: "no", value: +Number((amountInPenniesWithoutFee * Number(probabilities.no.value)) / 100 / 10 ** reserve_decimals).toFixed(reserve_decimals) },
    ];

    if (allow_draw) {
      data.push({ type: "DRAW", token: "draw", value: +Number((amountInPenniesWithoutFee * drawPercent) / 100 / 10 ** reserve_decimals).toFixed(reserve_decimals) });
    }

    return data;
  }, [meta, amountInPenniesWithoutFee, probabilities, drawPercent, allow_draw, reserve_decimals]);

  const data: { add_liquidity: number; yes_amount_ratio?: number; no_amount_ratio?: number } = { add_liquidity: 1 };

  if (isFirstIssue) {
    data.yes_amount_ratio = Number(probabilities.yes.value) / 100;
    data.no_amount_ratio = Number(probabilities.no.value) / 100;
  }

  const link = generateLink({
    aa: address,
    asset: reserve_asset,
    is_single: true,
    amount: amountInPennies,
    data,
    from_address: walletAddress || undefined,
  });

  const valid = meta && amountInPenniesWithoutFee && amountInPenniesWithoutFee > 0 && reserveAmount.valid && (percentSum === 100 || !isFirstIssue);

  const handleChangeReserveAmount = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value;

    if (value === "") {
      setReserveAmount({ value: undefined, valid: true });
    } else {
      if (f(value) <= (fromToken?.decimals ?? 0) && Number(value) <= 1e9) {
        setReserveAmount({ value, valid: !isNaN(Number(value)) && Number(value) > minAmount });
      }
    }
  };

  const pieConfig = {
    angleField: "value",
    colorField: "type",
    legend: false,
    animation: false,
    autoFit: true,
    label: {
      type: "inner",
      content: (item: { percent: number; type: string; value: number }) =>
        item.percent > 0.1
          ? `${haveTeamNames ? (item.type === "YES" ? yes_team : item.type === "NO" ? no_team : "DRAW") : item.type + " tokens"}
      ${item.value} ${reserve_symbol}
      ${Number(item.percent * 100).toPrecision(4)}%
      `
          : "",
      style: {
        fontSize: 12,
        textAlign: "center",
        fill: "#fff",
        fontWeight: "bold",
      },
      autoHide: true,
      autoRotate: false,
    },
    appendPadding: 10,
    radius: 0.8,
    renderer: "svg",
    color: (item: { type: string }) => {
      if (item.type === "YES") {
        return appConfig.YES_COLOR;
      } else if (item.type === "NO") {
        return appConfig.NO_COLOR;
      } else {
        return appConfig.DRAW_COLOR;
      }
    },
    tooltip: {
      customContent: (_: string, items: { data: { type: string; value: number } }[]) => {
        return (
          <div style={{ padding: 5, textAlign: "center" }}>
            Invested capital in {haveTeamNames ? (items[0]?.data.type === "YES" ? yes_team : items[0]?.data.type === "NO" ? no_team : "DRAW") : items[0]?.data.type + " tokens"}:
            <div style={{ marginTop: 5 }}>
              {items[0]?.data.value} <small>{reserve_symbol}</small>
            </div>
          </div>
        );
      },
    },
    pieStyle: {
      stroke: "#1F1F1E",
    },
  } as unknown as PieConfig;

  const counterstake_assistant_fee = fromToken.network !== "Obyte" ? Number(reserveAmount.value) * 0.01 : 0;
  const metamaskInstalled = !!(window as unknown as { ethereum?: unknown }).ethereum;

  const buyViaEVM = async () => {
    try {
      const { transferEVM2Obyte } = await import("counterstake-sdk");
      await transferEVM2Obyte({
        amount: Number(reserveAmount.value),
        src_network: fromToken.network,
        src_asset: fromToken.asset,
        dst_network: "Obyte",
        dst_asset: reserve_asset,
        recipient_address: address,
        data: { ...data, to: walletAddress },
        assistant_reward_percent: 1,
        testnet: appConfig.ENVIRONMENT === "testnet",
        obyteClient: client,
        oswap_change_address: walletAddress,
      });

      ReactGA.event({
        category: "Trade",
        action: "Add liquidity CS",
        label: address as string,
      });
    } catch (e) {
      console.error(e);

      toast.error(t("common.errors.transaction_fail", "The transaction would fail. Please check that you have sufficient balance"), { position: "top-center" });
    }
  };

  const probabilitiesAreValid = !isFirstIssue || (probabilities.yes.value && (!allow_draw || probabilities.no.value));

  const addLiquidity = () => {
    ReactGA.event({
      category: "Trade",
      action: "Add liquidity",
      label: address as string,
    });
  };

  const fromTokenValue = `${fromToken.network}__${fromToken.asset}__${fromToken.decimals}__${fromToken.foreign_asset}__${fromToken.symbol}`;
  const fromTokenOptions: ComboboxOption[] = [
    { value: `Obyte__${reserve_asset}__${reserve_decimals}__no__${reserve_symbol}`, label: reserve_symbol, text: reserve_symbol, group: "Obyte" },
    ...Object.entries(tokensByNetwork).flatMap(([network, items]) =>
      items.map((item) => ({
        value: `${network}__${item.home_asset}__${item.home_asset_decimals}__${item.foreign_asset}__${item.home_symbol}`,
        label: item.home_symbol,
        text: item.home_symbol,
        group: network,
      }))
    ),
  ];

  return (
    <form className="text-base" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-1 gap-x-2 md:grid-cols-3">
        <div className="md:col-span-1">
          <FormItem>{(control) => <Input {...control} value={reserveAmount.value ?? ""} placeholder={t("forms.common.amount", "Amount")} onChange={handleChangeReserveAmount} />}</FormItem>
        </div>

        <div className="md:col-span-2">
          <FormItem>{(control) => <Combobox {...control} value={fromTokenValue} onValueChange={handleChangeFromToken} options={fromTokenOptions} />}</FormItem>
        </div>
      </div>

      {isFirstIssue && (
        <>
          <p className="mb-2">{t("forms.liquidity.outcome_probabilities", "Outcome probabilities")}</p>
          <div className={`grid grid-cols-1 gap-x-2 ${allow_draw ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            <FormItem
              extra={<span style={{ color: appConfig.YES_COLOR }}>{yesOdds}</span>}
              label={
                <span className="block truncate">
                  <small>{haveTeamNames ? `${yes_team}` : "YES"}</small>
                </span>
              }
            >
              {(control) => <InputGroup {...control} value={probabilities.yes.value} placeholder="ex. 65" suffix="%" onChange={(ev) => handleChangeProbability(ev, "yes")} />}
            </FormItem>

            {allow_draw && (
              <FormItem extra={<span style={{ color: appConfig.DRAW_COLOR }}>{drawOdds}</span>} label={<small>{t("common.draw", "draw").toUpperCase()}</small>}>
                {(control) => <InputGroup {...control} disabled={true} value={floorDecimals(drawPercent, 2)} placeholder="ex. 20" suffix="%" readOnly />}
              </FormItem>
            )}

            <FormItem
              extra={<span style={{ color: appConfig.NO_COLOR }}>{noOdds}</span>}
              label={
                <span className="block truncate">
                  <small>{haveTeamNames ? `${no_team}` : "NO"}</small>
                </span>
              }
            >
              {(control) => <InputGroup {...control} value={probabilities.no.value} placeholder={`ex. ${allow_draw ? 15 : 35}`} suffix="%" onChange={(ev) => handleChangeProbability(ev, "no")} />}
            </FormItem>
          </div>
          {bookmaker_yes_odds !== null && bookmaker_no_odds !== null && bookmaker_draw_odds !== null ? <span className="text-muted-foreground">{t("forms.liquidity.suggested_probabilities", "Suggested probabilities are based on the current bookmaker odds")}</span> : null}
        </>
      )}

      {meta && (
        <FormItem>
          {!isFirstIssue && (
            <div style={{ marginBottom: 15 }}>
              <b>{t("forms.liquidity.net_amounts", "Net added amounts")}: </b>
              <div style={{ color: appConfig.YES_COLOR }}>
                {haveTeamNames ? yes_team : t("common.yes", "yes").toUpperCase()}: {Number(isFirstIssue ? (amountInPenniesWithoutFee * Number(probabilities.yes.value)) / 100 / 10 ** reserve_decimals : yesReserveAmount / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}{" "}
                {!isFirstIssue && <>({Number((yesReserveAmount / amountInPenniesWithoutFee) * 100).toFixed(2)}%)</>}
              </div>

              <div style={{ color: appConfig.NO_COLOR }}>
                {haveTeamNames ? no_team : t("common.no", "no").toUpperCase()}: {Number(isFirstIssue ? (amountInPenniesWithoutFee * Number(probabilities.no.value)) / 100 / 10 ** reserve_decimals : noReserveAmount / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}{" "}
                {!isFirstIssue && <>({Number((noReserveAmount / amountInPenniesWithoutFee) * 100).toFixed(2)}%)</>}
              </div>

              {allow_draw && (
                <div style={{ color: appConfig.DRAW_COLOR }}>
                  {haveTeamNames ? capitalizeFirstLetter(t("common.draw", "draw")) : t("common.draw", "draw").toUpperCase()}: {Number(isFirstIssue ? (amountInPenniesWithoutFee * drawPercent) / 100 / 10 ** reserve_decimals : drawReserveAmount / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}{" "}
                  {!isFirstIssue && <>({Number((drawReserveAmount / amountInPenniesWithoutFee) * 100).toFixed(2)}%)</>}
                </div>
              )}
            </div>
          )}

          <div className="metaWrap">
            {meta?.issue_fee !== 0 && needsIssueFeeForLiquidity ? (
              <div>
                <span className="metaLabel">{t("transaction_estimation.issue_fee", "Issue fee")}</span>: {+Number(meta.issue_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}
              </div>
            ) : null}
            {fromToken.network !== "Obyte" && estimate ? (
              <div style={{ marginTop: 20 }}>
                {counterstake_assistant_fee ? (
                  <div>
                    <span className="metaLabel">
                      <Trans i18nKey="transaction_estimation.cs_fee">
                        <a href="https://counterstake.org" target="_blank" rel="noopener">
                          Counterstake
                        </a>{" "}
                        fee
                      </Trans>
                    </span>
                    : {+Number(counterstake_assistant_fee).toFixed(fromToken.decimals)} {fromToken.symbol}
                  </div>
                ) : null}
                {fromToken.network !== "Obyte" && estimate && fromToken.foreign_asset !== reserve_asset ? (
                  <div>
                    <span className="metaLabel">
                      <Trans i18nKey="transaction_estimation.oswap_rate">
                        <a href="https://oswap.io" target="_blank" rel="noopener">
                          Oswap
                        </a>{" "}
                        rate
                      </Trans>
                    </span>
                    : 1 {fromToken.symbol} ≈ {+Number(estimate / (Number(reserveAmount.value) * 0.99)).toFixed(reserve_decimals)} {reserve_symbol}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {isFirstIssue && percentSum !== 100 && (
            <div style={{ marginTop: 20 }}>
              <Alert variant="destructive">
                <AlertTitle>{t("forms.liquidity.sum_100", "The percentage sum must be equal to 100")}</AlertTitle>
              </Alert>
            </div>
          )}
        </FormItem>
      )}

      {!metamaskInstalled && fromToken.network !== "Obyte" && (
        <FormItem>
          <Alert variant="destructive">
            <AlertTitle>{t("forms.common.no_metamask", "MetaMask not installed!")}</AlertTitle>
            <AlertDescription>
              <Trans i18nKey="forms.common.install_metamask">
                Please{" "}
                <a href="https://metamask.io/download/" style={{ color: "#fff", textDecoration: "underline" }} target="_blank" rel="noopener">
                  install
                </a>{" "}
                it in your browser.
              </Trans>
            </AlertDescription>
          </Alert>
        </FormItem>
      )}

      {!walletAddress && fromToken.network !== "Obyte" && (
        <FormItem>
          <Alert variant="destructive">
            <AlertTitle>{t("forms.common.no_obyte_wallet", "You have not added your Obyte wallet to the site!")}</AlertTitle>
            <AlertDescription>
              <Trans i18nKey="forms.common.install_obyte">
                If you don't have it yet, please{" "}
                <a href="https://obyte.org/#download" target="_blank" rel="noopener">
                  install
                </a>{" "}
                and{" "}
                <WalletModal type="link" styles={{ fontSize: 16 }}>
                  add
                </WalletModal>{" "}
                it. It is to this wallet that the purchased assets will come.
              </Trans>
            </AlertDescription>
          </Alert>
        </FormItem>
      )}

      {estimateError && fromToken.network !== "Obyte" && (
        <FormItem>
          <Alert variant="destructive">
            <AlertTitle>{estimateError}</AlertTitle>
          </Alert>
        </FormItem>
      )}

      <FormItem>
        {fromToken.network === "Obyte" ? (
          <QRButton size="lg" disabled={!valid || !probabilitiesAreValid} onClick={addLiquidity} href={link}>
            {t("forms.common.send", "Send")}
            {reserveAmount.valid && reserveAmount.value ? ` ${reserveAmount.value} ${reserve_symbol}` : ""}
          </QRButton>
        ) : (
          <Button type="button" size="lg" onClick={buyViaEVM} disabled={!metamaskInstalled || !walletAddress || !reserveAmount.valid || !Number(reserveAmount.value) || !!estimateError || !probabilitiesAreValid}>
            {t("forms.common.send", "Send")}
            {reserveAmount.valid && reserveAmount.value ? ` ${reserveAmount.value}` : ""} {fromToken.symbol}
          </Button>
        )}
      </FormItem>

      {isFirstIssue && valid && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: "90%" }}>
            <Pie {...pieConfig} data={dataForPie} />
          </div>
        </div>
      )}
    </form>
  );
};
