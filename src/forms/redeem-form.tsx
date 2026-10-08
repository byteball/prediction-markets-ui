import { memo, useEffect, useRef, useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { isNaN } from "lodash-es";
import ReactGA from "react-ga4";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import { QRButton } from "components/qr-button/qr-button";
import { TransactionEstimation } from "components/transaction-estimation/transaction-estimation";
import { useAppSelector } from "store/hooks";
import { selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars, selectUserOutcomeBalances } from "store/slices/active-slice";
import { selectWalletAddress } from "store/slices/settings-slice";
import { selectWalletBalance } from "store/slices/user-wallet-slice";
import { generateLink, getExchangeResult, truncate } from "utils";

import { Alert, AlertTitle } from "components/ui/alert";
import { FormItem } from "components/ui/form-item";
import { InputGroup } from "components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";

import { tokenLabel } from "./token-label";

const f = (x: unknown) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export type AmountState = { value: string | number | undefined; valid: boolean };

type Token = { symbol: string; asset?: string; type: "yes" | "no" | "draw"; decimals: number };

export type RedeemFormProps = {
  type?: "yes" | "no" | "draw";
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

  const [tokens, setTokens] = useState<Token[]>([]);
  const [currentToken, setCurrentToken] = useState<Token>();
  const [meta, setMeta] = useState<ReturnType<typeof getExchangeResult> | null>();

  const [payoutAmount, setPayoutAmount] = useState<{ value: number | string | undefined; valid: boolean }>({ value: undefined, valid: true });

  const btnRef = useRef<HTMLAnchorElement>(null);
  const { t } = useTranslation();

  const { yes_symbol, no_symbol, draw_symbol, allow_draw, reserve_symbol, reserve_decimals, yes_decimals, no_decimals, draw_decimals, is_tokenless } = params;
  const { yes_asset, no_asset, draw_asset } = stateVars;

  const walletBalanceOfCurrentToken: number = currentToken && walletAddress ? (is_tokenless ? outcomeBalances?.[currentToken.type] || 0 : currentToken.asset ? walletBalance?.[currentToken.asset]?.total || 0 : 0) : 0;
  const currentDecimals = currentToken?.decimals || 0;

  const walletBalanceOfCurrentTokenView = +Number(walletBalanceOfCurrentToken / 10 ** currentDecimals).toFixed(currentDecimals);

  useEffect(() => {
    const tokens: Token[] = [
      { symbol: yes_symbol, asset: yes_asset, type: "yes", decimals: yes_decimals },
      { symbol: no_symbol, asset: no_asset, type: "no", decimals: no_decimals },
    ];

    if (allow_draw) {
      tokens.push({ symbol: draw_symbol!, asset: draw_asset, decimals: draw_decimals, type: "draw" });
    }

    setTokens(tokens);

    const tokenIndex = type ? tokens.findIndex((item) => item.type === type) : 0;
    setCurrentToken(tokens[tokenIndex]);
  }, [address, type]);

  const handleChangeAmount = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value;

    if (value === "") {
      setAmount({ value: undefined, valid: true });
    } else {
      if (f(value) <= (currentToken?.decimals ?? 0) && Number(value) <= 9e9) {
        setAmount({ value, valid: !isNaN(Number(value)) && Number(value) > 0 });
      }
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

  const tokenAmountInSmallestUnits = Math.round(Number(amount.value) * 10 ** (currentToken?.decimals ?? 0));

  const link = is_tokenless
    ? generateLink({ aa: address, amount: 1e4, data: { [`${currentToken?.type}_amount`]: -tokenAmountInSmallestUnits }, is_single: true, from_address: walletAddress || undefined })
    : generateLink({ aa: address, asset: currentToken?.asset, is_single: true, amount: Math.ceil(Number(amount.value) * 10 ** (currentToken?.decimals ?? 0)), from_address: walletAddress || undefined });

  if (!currentToken) return <Loader2 className="size-8 animate-spin text-primary" aria-label="loading" />;

  const redeem = () => {
    ReactGA.event({
      category: "Trade",
      action: "Redeem",
      label: address as string,
    });
  };

  const handleChangeCurrentToken = (toType: string) => {
    setCurrentToken(tokens.find(({ type }) => type === toType));
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
                    {tokens?.map((token) => (
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
