import { useEffect, useRef, useState, type ChangeEvent, type Dispatch, type ReactElement, type SetStateAction } from "react";
import { toast } from "sonner";
import { isNaN } from "lodash-es";
import { useTranslation, Trans } from "react-i18next";

import { QRButton } from "@/shared/ui/qr-button/qr-button";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Combobox } from "@/shared/ui/combobox";
import { FormItem } from "@/shared/ui/form-item";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { useAppSelector } from "@/shared/lib/redux";
import { track } from "@/shared/lib/analytics/track";
import { get_result_for_buying_by_type, selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars, type OutcomeType } from "@/entities/market";
import { selectWalletAddress } from "@/entities/wallet";
import { decodeFromToken, encodeFromToken, obyteReserveToken, transferCounterstake, useBridgeTokenOptions, useCounterstakeEstimate, type FromToken } from "@/entities/bridge";

import { tokenLabel } from "../lib/token-label";
import { buildBuyLink } from "../lib/trade-links";
import { useOutcomeTokens } from "../model/use-outcome-tokens";
import type { AmountState } from "./redeem-form";
import { TransactionEstimation } from "./transaction-estimation";

const countDecimals = (x: unknown) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export type BuyFormProps = {
  type?: OutcomeType;
  yes_team?: string;
  no_team?: string;
  amount: AmountState;
  setAmount: Dispatch<SetStateAction<AmountState>>;
  /** Rendered inside the "add your Obyte wallet" hint for EVM stakes (the connect-wallet action). */
  walletSlot?: ReactElement;
};

export const BuyForm = ({ type, yes_team, no_team, amount, setAmount, walletSlot }: BuyFormProps) => {
  const stateVars = useAppSelector(selectActiveMarketStateVars);
  const address = useAppSelector(selectActiveAddress);
  const params = useAppSelector(selectActiveMarketParams);
  const walletAddress = useAppSelector(selectWalletAddress);

  const btnRef = useRef<HTMLAnchorElement>(null);
  const { t } = useTranslation();

  const { reserve_asset, reserve_symbol, reserve_decimals } = params;
  const { tokens, currentToken, selectToken } = useOutcomeTokens(type);
  const reserveToken = obyteReserveToken({ asset: reserve_asset, decimals: reserve_decimals, symbol: reserve_symbol });
  const fromTokenOptions = useBridgeTokenOptions({ asset: reserve_asset, decimals: reserve_decimals, symbol: reserve_symbol });

  const [fromToken, setFromToken] = useState<FromToken>(reserveToken);
  const [meta, setMeta] = useState<ReturnType<typeof get_result_for_buying_by_type> | null>();
  const [getAmount, setGetAmount] = useState<{ value: number | string | undefined; valid: boolean }>({ value: undefined, valid: true });

  const { estimate, error: estimateError, isBridged } = useCounterstakeEstimate(fromToken, amount.value, amount.valid, reserve_asset, walletAddress);

  const network_fee = reserve_asset === "base" ? 1e4 : 0;
  const minAmount = reserve_asset === "base" ? network_fee / 1e9 : 1 / 10 ** reserve_decimals;

  useEffect(() => {
    setFromToken(obyteReserveToken({ asset: reserve_asset, decimals: reserve_decimals, symbol: reserve_symbol }));
  }, [address, reserve_asset]);

  const handleChangeAmount = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value;

    if (value === "") {
      setAmount({ value: undefined, valid: true });
    } else if (countDecimals(value) <= (fromToken?.decimals ?? 0) && Number(value) <= 9e9) {
      setAmount({ value, valid: !isNaN(Number(value)) && Number(value) > minAmount });
    }
  };

  useEffect(() => {
    if (currentToken && amount.valid && !isNaN(Number(amount.value)) && Number(amount.value) > 0) {
      const reserveAmount = Number(isBridged ? estimate : amount.value) * 10 ** reserve_decimals;
      const result = get_result_for_buying_by_type(stateVars, params, currentToken.type, reserveAmount);

      setGetAmount({ value: result.amount, valid: true });
      setMeta(result);
    } else {
      setMeta(null);
      setGetAmount({ value: "", valid: true });
    }
  }, [currentToken, amount, estimate, stateVars]);

  const link = buildBuyLink({ aa: address, reserveAsset: reserve_asset, reserveDecimals: reserve_decimals, amount: amount.value, type: currentToken?.type, walletAddress });

  const handleChangeFromToken = (value: string) => {
    const next = decodeFromToken(value);

    setFromToken(next);

    if (amount.valid && amount.value) {
      setAmount((a) => ({ ...a, value: +Number(a.value).toFixed(next.decimals) }));
    }
  };

  const buyForReserve = () => {
    track({ category: "Trade", action: "Buy", label: address as string });
  };

  const buyViaEVM = async () => {
    if (!fromToken || !address || !walletAddress) return;

    try {
      await transferCounterstake({
        amount: Number(amount.value),
        srcNetwork: fromToken.network,
        srcAsset: fromToken.asset,
        dstAsset: reserve_asset,
        recipientAddress: address,
        data: { type: currentToken?.type, to: walletAddress },
        walletAddress,
      });

      track({ category: "Trade", action: "Buy CS", label: address });
    } catch {
      toast.error(t("common.errors.transaction_fail", "The transaction would fail. Please check that you have sufficient balance"), { position: "top-center" });
    }
  };

  if (!currentToken || !fromToken) {
    return (
      <div className="flex justify-center p-5">
        <Spinner />
      </div>
    );
  }

  const metamaskInstalled = !!(window as unknown as { ethereum?: unknown }).ethereum;
  const counterstake_assistant_fee = isBridged ? Number(amount.value) * 0.01 : 0;
  const getAmountValue = Number(getAmount.value);

  return (
    <form className="text-base" onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-1 gap-x-2 md:grid-cols-3">
        <div className="md:col-span-1">
          <FormItem>
            {(control) => (
              <Input
                {...control}
                placeholder={t("forms.buy.stake_amount", "Stake amount")}
                value={amount.value ?? ""}
                onChange={handleChangeAmount}
                onKeyDown={(ev) => (ev.key === "Enter" ? btnRef.current?.click() : null)}
              />
            )}
          </FormItem>
        </div>
        <div className="md:col-span-2">
          <FormItem>{(control) => <Combobox {...control} value={encodeFromToken(fromToken)} onValueChange={handleChangeFromToken} options={fromTokenOptions} />}</FormItem>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-2 md:grid-cols-3">
        {!type ? (
          <>
            <div className="md:col-span-1">
              <FormItem>
                <span className="flex h-10 flex-wrap items-center justify-between text-lg">
                  <span>{t("forms.common.you_get", "You get")}:</span> {isBridged ? "≈" : ""}
                  {getAmountValue > 0 ? +Number(getAmountValue / 10 ** currentToken.decimals).toPrecision(currentToken.decimals) : 0}
                </span>
              </FormItem>
            </div>
            <div className="md:col-span-2">
              <FormItem>
                {(control) => (
                  <Select value={currentToken?.type} onValueChange={(toType) => selectToken(toType as OutcomeType)}>
                    <SelectTrigger {...control} className="w-full">
                      <SelectValue placeholder={t("forms.common.select_token", "Select token")} />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens.map((token) => (
                        <SelectItem key={`to_${token.type}`} value={token.type}>
                          {tokenLabel(token, yes_team, no_team)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormItem>
            </div>
          </>
        ) : getAmount.value ? (
          <div className="md:col-span-3" style={{ marginBottom: 10, fontWeight: "bold", paddingLeft: 5 }}>
            <span style={{ marginRight: 5 }}>{t("forms.common.you_get", "You get")}:</span> <span>{(getAmountValue > 0 ? getAmountValue : 0) / 10 ** currentToken.decimals}</span> {tokenLabel(currentToken, yes_team, no_team)}
          </div>
        ) : (
          ""
        )}
      </div>

      {meta && (!isBridged || !estimateError) && (
        <FormItem className="metaWrap">
          <TransactionEstimation meta={meta} params={params} tokenType={currentToken?.type} showEstimatedWinnings={true} yes_team={yes_team} no_team={no_team} />
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
                  : 1 {fromToken.symbol} ≈ {+Number(estimate / Number(amount.value)).toFixed(reserve_decimals)} {reserve_symbol}
                </div>
              ) : null}
            </div>
          ) : (
            <div />
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
          <QRButton size="lg" ref={btnRef} href={link} disabled={!amount.valid || !Number(amount.value)} onClick={buyForReserve}>
            {t("forms.common.send", "Send")}
            {amount.valid && amount.value ? ` ${amount.value}` : ""} {reserve_symbol}
          </QRButton>
        ) : (
          <Button type="button" size="lg" onClick={buyViaEVM} disabled={!metamaskInstalled || !walletAddress || !amount.valid || !Number(amount.value) || !!estimateError}>
            {t("forms.common.send", "Send")}
            {amount.valid && amount.value ? ` ${amount.value}` : ""} {fromToken.symbol}
          </Button>
        )}
      </FormItem>
    </form>
  );
};
