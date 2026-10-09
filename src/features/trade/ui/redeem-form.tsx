import { memo, useEffect, useRef, useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { isNaN, truncate } from "lodash-es";
import { useTranslation } from "react-i18next";

import { QRButton } from "@/shared/ui/qr-button/qr-button";
import { Alert, AlertTitle } from "@/shared/ui/alert";
import { FormItem } from "@/shared/ui/form-item";
import { InputGroup } from "@/shared/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { useAppSelector } from "@/shared/lib/redux";
import { track } from "@/shared/lib/analytics/track";
import { getExchangeResult, selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars, selectUserOutcomeBalances, type OutcomeType } from "@/entities/market";
import { selectWalletAddress, selectWalletBalance } from "@/entities/wallet";

import { tokenLabel } from "../lib/token-label";
import { buildRedeemLink } from "../lib/trade-links";
import { useOutcomeTokens } from "../model/use-outcome-tokens";
import { TransactionEstimation } from "./transaction-estimation";

const countDecimals = (x: unknown) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export type AmountState = { value: string | number | undefined; valid: boolean };

export type RedeemFormProps = {
  type?: OutcomeType;
  yes_team?: string;
  no_team?: string;
  amount: AmountState;
  setAmount: Dispatch<SetStateAction<AmountState>>;
};

export const RedeemForm = memo(({ type, yes_team, no_team, amount, setAmount }: RedeemFormProps) => {
  const stateVars = useAppSelector(selectActiveMarketStateVars);
  const address = useAppSelector(selectActiveAddress);
  const params = useAppSelector(selectActiveMarketParams);
  const walletAddress = useAppSelector(selectWalletAddress);
  const walletBalance = useAppSelector(selectWalletBalance);
  const outcomeBalances = useAppSelector(selectUserOutcomeBalances);

  const { tokens, currentToken, selectToken } = useOutcomeTokens(type);
  const [meta, setMeta] = useState<ReturnType<typeof getExchangeResult> | null>();
  const [payoutAmount, setPayoutAmount] = useState<{ value: number | string | undefined; valid: boolean }>({ value: undefined, valid: true });

  const btnRef = useRef<HTMLAnchorElement>(null);
  const { t } = useTranslation();

  const { reserve_symbol, reserve_decimals, is_tokenless } = params;

  const walletBalanceOfCurrentToken: number = currentToken && walletAddress ? (is_tokenless ? outcomeBalances?.[currentToken.type] || 0 : currentToken.asset ? walletBalance?.[currentToken.asset]?.total || 0 : 0) : 0;
  const currentDecimals = currentToken?.decimals || 0;
  const walletBalanceOfCurrentTokenView = +Number(walletBalanceOfCurrentToken / 10 ** currentDecimals).toFixed(currentDecimals);

  const handleChangeAmount = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value;

    if (value === "") {
      setAmount({ value: undefined, valid: true });
    } else if (countDecimals(value) <= (currentToken?.decimals ?? 0) && Number(value) <= 9e9) {
      setAmount({ value, valid: !isNaN(Number(value)) && Number(value) > 0 });
    }
  };

  useEffect(() => {
    if (currentToken && amount.valid && !isNaN(Number(amount.value)) && Number(amount.value) > 0) {
      const tokenAmount = -1 * Number(amount.value) * 10 ** currentToken.decimals;
      const result = getExchangeResult(stateVars, params, currentToken.type === "yes" ? tokenAmount : 0, currentToken.type === "no" ? tokenAmount : 0, currentToken.type === "draw" ? tokenAmount : 0);

      if (result) {
        setPayoutAmount({ value: result.payout - result.fee, valid: true });
        setMeta(result);
      } else {
        setMeta(null);
        setPayoutAmount({ value: "", valid: true });
      }
    } else {
      setMeta(null);
      setPayoutAmount({ value: "", valid: true });
    }
  }, [currentToken, amount, stateVars]);

  const link = buildRedeemLink({ aa: address, isTokenless: !!is_tokenless, tokenType: currentToken?.type, tokenAsset: currentToken?.asset, tokenDecimals: currentToken?.decimals, amount: amount.value, walletAddress });

  if (!currentToken) return <Spinner />;

  const redeem = () => {
    track({ category: "Trade", action: "Redeem", label: address as string });
  };

  const handleChangeCurrentToken = (toType: string) => {
    selectToken(toType as OutcomeType);
    setAmount({ value: "", valid: false });
  };

  const insertToInput = () => {
    if (walletBalanceOfCurrentToken) {
      setAmount({ value: walletBalanceOfCurrentTokenView, valid: true });
    }
  };

  const suffixText = type ? tokenLabel(currentToken, yes_team, no_team) : "";
  const payoutValue = Number(payoutAmount.value);
  const canSend = is_tokenless ? !!address : !!currentToken.asset;

  return (
    <form className="text-base" onSubmit={(e) => e.preventDefault()}>
      {walletBalanceOfCurrentToken ? (
        <span className="cursor-pointer text-sm text-muted-foreground" onClick={insertToInput}>
          max {walletBalanceOfCurrentTokenView}
        </span>
      ) : null}
      <div className="grid grid-cols-1 gap-x-2 md:grid-cols-4">
        <div className={type ? "md:col-span-4" : "md:col-span-1"}>
          <FormItem>
            {(control) => (
              <InputGroup
                {...control}
                placeholder={t("forms.common.amount", "Amount")}
                suffix={<span style={{ maxWidth: "100%", overflow: "hidden" }}>{truncate(suffixText, { length: 18 })}</span>}
                value={amount.value ?? ""}
                onChange={handleChangeAmount}
                onKeyDown={(ev) => (ev.key === "Enter" ? btnRef.current?.click() : null)}
              />
            )}
          </FormItem>
        </div>

        {!type ? (
          <div className="md:col-span-3">
            <FormItem>
              {(control) => (
                <Select value={currentToken?.type} onValueChange={handleChangeCurrentToken}>
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
        ) : null}
      </div>

      {meta && payoutValue > 0 && (
        <FormItem>
          <div style={{ fontSize: 18, paddingBottom: 10 }}>
            {t("forms.common.you_get", "You get")} {+Number(payoutValue / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}
          </div>

          <TransactionEstimation meta={meta} params={params} tokenType={currentToken?.type} />
        </FormItem>
      )}

      {meta && payoutValue <= 0 ? (
        <FormItem>
          <Alert variant="destructive">
            <AlertTitle>{t("forms.redeem.price_change", "The price would change too much, try a smaller amount")}</AlertTitle>
          </Alert>
        </FormItem>
      ) : null}

      <FormItem>
        <QRButton ref={btnRef} href={link} size="lg" disabled={!canSend || !amount.valid || !Number(amount.value) || payoutValue <= 0} onClick={redeem}>
          {t("forms.common.send", "Send")} {amount.valid && Number(amount.value) ? Number(amount.value) : ""} {truncate(currentToken.symbol, { length: 14 })}
        </QRButton>
      </FormItem>
    </form>
  );
});

RedeemForm.displayName = "RedeemForm";
