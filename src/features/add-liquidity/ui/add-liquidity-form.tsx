import { useMemo, useState, type ChangeEvent, type ReactElement } from "react";
import type { PieConfig } from "@ant-design/plots";
import { toast } from "sonner";
import { isNumber } from "lodash-es";
import { Trans, useTranslation } from "react-i18next";

import { Pie } from "@/shared/ui/charts";
import { QRButton } from "@/shared/ui/qr-button/qr-button";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Combobox } from "@/shared/ui/combobox";
import { FormItem } from "@/shared/ui/form-item";
import { Input } from "@/shared/ui/input";
import { InputGroup } from "@/shared/ui/input-group";
import { useAppSelector } from "@/shared/lib/redux";
import { capitalizeFirstLetter } from "@/shared/lib/capitalize-first-letter";
import { track } from "@/shared/lib/analytics/track";
import { BASE_AAS } from "@/shared/config/env";
import { DRAW_COLOR, NO_COLOR, YES_COLOR } from "@/shared/config/colors";
import { getExchangeResult, getMarketPriceByType, selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars } from "@/entities/market";
import { selectWalletAddress } from "@/entities/wallet";
import { decodeFromToken, encodeFromToken, obyteReserveToken, transferCounterstake, useBridgeTokenOptions, useCounterstakeEstimate, type FromToken } from "@/entities/bridge";

import { buildAddLiquidityData, buildAddLiquidityLink } from "../lib/liquidity-link";
import { floorDecimals, getDrawPercent, getFirstIssueOdds, getLiquidityAmounts, getLiquidityStake, getPercentSum, getSuggestedProbabilities, type Probabilities } from "../lib/liquidity-math";

const countDecimals = (x: unknown) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export type AddLiquidityFormProps = {
  yes_team?: string;
  no_team?: string;
  /** Connect-wallet action shown to EVM stakers without a linked Obyte wallet. */
  walletSlot?: ReactElement;
};

export const AddLiquidityForm = ({ yes_team, no_team, walletSlot }: AddLiquidityFormProps) => {
  const params = useAppSelector(selectActiveMarketParams);
  const stateVars = useAppSelector(selectActiveMarketStateVars);
  const walletAddress = useAppSelector(selectWalletAddress);
  const address = useAppSelector(selectActiveAddress);

  const { t } = useTranslation();

  const { allow_draw, reserve_asset, reserve_decimals, reserve_symbol, base_aa, yes_odds: bookmaker_yes_odds, no_odds: bookmaker_no_odds, draw_odds: bookmaker_draw_odds } = params;
  const { supply_yes = 0, supply_no = 0, supply_draw = 0, reserve = 0 } = stateVars;

  const isFirstIssue = supply_yes + supply_no + supply_draw === 0;

  const [reserveAmount, setReserveAmount] = useState<{ value: string | number | undefined; valid: boolean }>({ value: 0.1, valid: true });
  // The form remounts on every open, so the initial state replaces the old "set on mount" effects.
  const [probabilities, setProbabilities] = useState<Probabilities>(() => getSuggestedProbabilities(bookmaker_yes_odds, bookmaker_no_odds, bookmaker_draw_odds, isFirstIssue));
  const [fromToken, setFromToken] = useState<FromToken>(() => obyteReserveToken({ asset: reserve_asset, decimals: reserve_decimals, symbol: reserve_symbol }));
  const fromTokenOptions = useBridgeTokenOptions({ asset: reserve_asset, decimals: reserve_decimals, symbol: reserve_symbol });
  const { estimate, error: estimateError, isBridged } = useCounterstakeEstimate(fromToken, reserveAmount.value, reserveAmount.valid, reserve_asset, walletAddress);

  const network_fee = reserve_asset === "base" ? 1e4 : 0;
  const minAmount = reserve_asset === "base" ? network_fee / 1e9 : 1 / 10 ** reserve_decimals;
  const haveTeamNames = yes_team && no_team;
  const needsIssueFeeForLiquidity = (BASE_AAS ?? []).findIndex((aa) => aa === base_aa) === 0;

  const { amountInPennies, amountInPenniesWithoutFee } =
    fromToken && reserveAmount.valid && Number(reserveAmount.value)
      ? getLiquidityStake({ amount: isBridged ? estimate : reserveAmount.value, reserveDecimals: reserve_decimals, networkFee: network_fee, issueFee: params.issue_fee, needsIssueFee: needsIssueFeeForLiquidity })
      : { amountInPennies: 0, amountInPenniesWithoutFee: 0 };

  const drawPercent = getDrawPercent(probabilities);
  const percentSum = getPercentSum(probabilities, allow_draw);

  const liquidityAmounts = getLiquidityAmounts({ amountInPenniesWithoutFee, isFirstIssue, allowDraw: allow_draw, probabilities, supply_yes, supply_no, supply_draw, reserve });
  const { yesAmount, noAmount, drawAmount } = liquidityAmounts;

  const formatOdds = (odds: number | null) => (odds === null ? "" : `${t("common.odds", "odds")}: x${odds}`);
  const showFirstIssueOdds = isFirstIssue && reserveAmount.valid && reserveAmount.value && Number(reserveAmount.value) > 0 && percentSum === 100;
  const firstIssueOdds = showFirstIssueOdds ? getFirstIssueOdds(amountInPenniesWithoutFee, liquidityAmounts, probabilities) : { yes: null, no: null, draw: null };

  const yesOdds = formatOdds(firstIssueOdds.yes);
  const noOdds = formatOdds(firstIssueOdds.no);
  const drawOdds = formatOdds(firstIssueOdds.draw);

  const yesReserveAmount = yesAmount * getMarketPriceByType(stateVars, "yes");
  const noReserveAmount = noAmount * getMarketPriceByType(stateVars, "no");
  const drawReserveAmount = drawAmount * getMarketPriceByType(stateVars, "draw");

  const handleChangeProbability = (ev: ChangeEvent<HTMLInputElement>, type: "yes" | "no") => {
    const value = ev.target.value;

    if (value === "") {
      setProbabilities((p) => ({ ...p, [type]: { value, valid: true } }));
      return;
    }

    if (countDecimals(value) > 2) return;

    const valid = isNumber(Number(value)) && Number(value) >= 0 && Number(value) <= 100;

    if (allow_draw) {
      setProbabilities((p) => ({ ...p, [type]: { value, valid } }));
    } else {
      const other = type === "yes" ? "no" : "yes";

      setProbabilities((p) => ({ ...p, [type]: { value, valid }, [other]: { value: Number(value) < 100 ? 100 - Number(value) : 0, valid: true } }));
    }
  };

  const handleChangeFromToken = (value: string) => {
    const next = decodeFromToken(value);

    setFromToken(next);

    if (reserveAmount.valid && reserveAmount.value) {
      setReserveAmount((a) => ({ ...a, value: +Number(a.value).toFixed(next.decimals) }));
    }
  };

  const meta = reserveAmount.valid && reserveAmount.value && (!isBridged || estimate) ? getExchangeResult(stateVars, params, yesAmount, noAmount, drawAmount) : null;

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

  const data = buildAddLiquidityData({ isFirstIssue, yesPercent: probabilities.yes.value, noPercent: probabilities.no.value });
  const link = buildAddLiquidityLink({ aa: address, reserveAsset: reserve_asset, amountInPennies, data, walletAddress });

  const valid = meta && amountInPenniesWithoutFee && amountInPenniesWithoutFee > 0 && reserveAmount.valid && (percentSum === 100 || !isFirstIssue);

  const handleChangeReserveAmount = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value;

    if (value === "") {
      setReserveAmount({ value: undefined, valid: true });
    } else if (countDecimals(value) <= (fromToken?.decimals ?? 0) && Number(value) <= 1e9) {
      setReserveAmount({ value, valid: !isNaN(Number(value)) && Number(value) > minAmount });
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
    color: (item: { type: string }) => (item.type === "YES" ? YES_COLOR : item.type === "NO" ? NO_COLOR : DRAW_COLOR),
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

  const counterstake_assistant_fee = isBridged ? Number(reserveAmount.value) * 0.01 : 0;
  const metamaskInstalled = !!(window as unknown as { ethereum?: unknown }).ethereum;

  const buyViaEVM = async () => {
    if (!address || !walletAddress) return;

    try {
      await transferCounterstake({
        amount: Number(reserveAmount.value),
        srcNetwork: fromToken.network,
        srcAsset: fromToken.asset,
        dstAsset: reserve_asset,
        recipientAddress: address,
        data: { ...data, to: walletAddress },
        walletAddress,
      });

      track({ category: "Trade", action: "Add liquidity CS", label: address });
    } catch (e) {
      console.error(e);

      toast.error(t("common.errors.transaction_fail", "The transaction would fail. Please check that you have sufficient balance"), { position: "top-center" });
    }
  };

  const probabilitiesAreValid = !isFirstIssue || (probabilities.yes.value && (!allow_draw || probabilities.no.value));

  const addLiquidity = () => {
    track({ category: "Trade", action: "Add liquidity", label: address as string });
  };

  return (
    <form className="text-base" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-1 gap-x-2 md:grid-cols-3">
        <div className="md:col-span-1">
          <FormItem>{(control) => <Input {...control} value={reserveAmount.value ?? ""} placeholder={t("forms.common.amount", "Amount")} onChange={handleChangeReserveAmount} />}</FormItem>
        </div>

        <div className="md:col-span-2">
          <FormItem>{(control) => <Combobox {...control} value={encodeFromToken(fromToken)} onValueChange={handleChangeFromToken} options={fromTokenOptions} />}</FormItem>
        </div>
      </div>

      {isFirstIssue && (
        <>
          <p className="mb-2">{t("forms.liquidity.outcome_probabilities", "Outcome probabilities")}</p>
          <div className={`grid grid-cols-1 gap-x-2 ${allow_draw ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            <FormItem
              extra={<span style={{ color: YES_COLOR }}>{yesOdds}</span>}
              label={
                <span className="block truncate">
                  <small>{haveTeamNames ? `${yes_team}` : "YES"}</small>
                </span>
              }
            >
              {(control) => <InputGroup {...control} value={probabilities.yes.value} placeholder="ex. 65" suffix="%" onChange={(ev) => handleChangeProbability(ev, "yes")} />}
            </FormItem>

            {allow_draw && (
              <FormItem extra={<span style={{ color: DRAW_COLOR }}>{drawOdds}</span>} label={<small>{t("common.draw", "draw").toUpperCase()}</small>}>
                {(control) => <InputGroup {...control} disabled={true} value={floorDecimals(drawPercent, 2)} placeholder="ex. 20" suffix="%" readOnly />}
              </FormItem>
            )}

            <FormItem
              extra={<span style={{ color: NO_COLOR }}>{noOdds}</span>}
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
              <div style={{ color: YES_COLOR }}>
                {haveTeamNames ? yes_team : t("common.yes", "yes").toUpperCase()}: {Number(yesReserveAmount / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol} <>({Number((yesReserveAmount / amountInPenniesWithoutFee) * 100).toFixed(2)}%)</>
              </div>

              <div style={{ color: NO_COLOR }}>
                {haveTeamNames ? no_team : t("common.no", "no").toUpperCase()}: {Number(noReserveAmount / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol} <>({Number((noReserveAmount / amountInPenniesWithoutFee) * 100).toFixed(2)}%)</>
              </div>

              {allow_draw && (
                <div style={{ color: DRAW_COLOR }}>
                  {haveTeamNames ? capitalizeFirstLetter(t("common.draw", "draw")) : t("common.draw", "draw").toUpperCase()}: {Number(drawReserveAmount / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol} <>({Number((drawReserveAmount / amountInPenniesWithoutFee) * 100).toFixed(2)}%)</>
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
            {isBridged && estimate ? (
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
                {fromToken.foreign_asset !== reserve_asset ? (
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

      {!metamaskInstalled && isBridged && (
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

      {!walletAddress && isBridged && (
        <FormItem>
          <Alert variant="destructive">
            <AlertTitle>{t("forms.common.no_obyte_wallet", "You have not added your Obyte wallet to the site!")}</AlertTitle>
            <AlertDescription>
              <Trans i18nKey="forms.common.install_obyte">
                If you don't have it yet, please{" "}
                <a href="https://obyte.org/#download" target="_blank" rel="noopener">
                  install
                </a>{" "}
                and {walletSlot ?? <span>add</span>} it. It is to this wallet that the purchased assets will come.
              </Trans>
            </AlertDescription>
          </Alert>
        </FormItem>
      )}

      {estimateError && isBridged && (
        <FormItem>
          <Alert variant="destructive">
            <AlertTitle>{estimateError}</AlertTitle>
          </Alert>
        </FormItem>
      )}

      <FormItem>
        {!isBridged ? (
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
