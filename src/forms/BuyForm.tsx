import { useEffect, useRef, useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import { isNaN } from "lodash-es";
import ReactGA from "react-ga4";
import { useTranslation, Trans } from "react-i18next";
import { Loader2 } from "lucide-react";

import { QRButton } from "components/QRButton/QRButton";
import { TransactionEstimation } from "components/TransactionEstimation/TransactionEstimation";
import { WalletModal } from "modals";
import { useAppSelector } from "store/hooks";
import { selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars } from "store/slices/activeSlice";
import { selectWalletAddress } from "store/slices/settingsSlice";
import { get_result_for_buying_by_type } from "utils/getExchangeResult";
import { selectTokensByNetwork } from "store/slices/bridgesSlice";
import { generateLink } from "utils";

import appConfig from "appConfig";
import client from "services/obyte";

import { Alert, AlertDescription, AlertTitle } from "components/ui/alert";
import { Button } from "components/ui/button";
import { Combobox, type ComboboxOption } from "components/ui/combobox";
import { FormItem } from "components/ui/form-item";
import { Input } from "components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";

import type { AmountState } from "./RedeemForm";
import { tokenLabel } from "./tokenLabel";

const f = (x: unknown) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

type Token = { symbol: string; asset?: string; type: "yes" | "no" | "draw"; decimals: number };
type FromToken = { asset: string; decimals: number; symbol: string; foreign_asset: string; network: string };
type BridgeToken = { home_asset: string; home_asset_decimals: number; foreign_asset: string; home_symbol: string; home_network: string; bridge_id: string | number };

export type BuyFormProps = {
  type?: "yes" | "no" | "draw";
  yes_team?: string;
  no_team?: string;
  amount: AmountState;
  setAmount: Dispatch<SetStateAction<AmountState>>;
};

export const BuyForm = ({ type, yes_team, no_team, amount, setAmount }: BuyFormProps) => {
  const stateVars = useAppSelector(selectActiveMarketStateVars);
  const address = useAppSelector(selectActiveAddress);
  const params = useAppSelector(selectActiveMarketParams);
  const walletAddress = useAppSelector(selectWalletAddress);
  const tokensByNetwork: Record<string, BridgeToken[]> = useAppSelector(selectTokensByNetwork);

  const btnRef = useRef<HTMLAnchorElement>(null);
  const { t } = useTranslation();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [currentToken, setCurrentToken] = useState<Token>();
  const [meta, setMeta] = useState<ReturnType<typeof get_result_for_buying_by_type> | null>();
  const [fromToken, setFromToken] = useState<FromToken>();
  const [estimate, setEstimate] = useState<number>();
  const [estimateError, setEstimateError] = useState<string>();

  const [getAmount, setGetAmount] = useState<{ value: number | string | undefined; valid: boolean }>({ value: undefined, valid: true });

  const { reserve_asset, yes_symbol, no_symbol, draw_symbol, allow_draw, reserve_symbol, reserve_decimals, yes_decimals, no_decimals, draw_decimals } = params;

  const { yes_asset, no_asset, draw_asset } = stateVars;

  const network_fee = reserve_asset === "base" ? 1e4 : 0;

  const minAmount = reserve_asset === "base" ? network_fee / 1e9 : 1 / 10 ** reserve_decimals;

  useEffect(() => {
    setFromToken({ asset: reserve_asset, decimals: reserve_decimals, symbol: reserve_symbol, foreign_asset: "no", network: "Obyte" });
  }, [address, reserve_asset]);

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
      if (f(value) <= (fromToken?.decimals ?? 0) && Number(value) <= 9e9) {
        setAmount({ value, valid: !isNaN(Number(value)) && Number(value) > minAmount });
      }
    }
  };

  useEffect(() => {
    if (currentToken && amount.valid && !isNaN(Number(amount.value)) && Number(amount.value) > 0) {
      const reserveAmount = Number(fromToken?.network !== "Obyte" ? estimate : amount.value) * 10 ** reserve_decimals;

      const result = get_result_for_buying_by_type(stateVars, params, currentToken.type, reserveAmount);

      setGetAmount({ value: result.amount, valid: true });
      setMeta(result);
    } else {
      setMeta(null);
      setGetAmount({ value: "", valid: true });
    }
  }, [currentToken, amount, estimate, stateVars]);

  const data = { type: currentToken?.type };

  const link = generateLink({ aa: address, asset: reserve_asset, is_single: true, amount: Math.ceil(Number(amount.value) * 10 ** reserve_decimals), data, from_address: walletAddress || undefined });

  const handleChangeFromToken = (strValue: string) => {
    const [network, asset, decimals, foreign_asset, ...symbol] = strValue.split("__");

    setFromToken({ asset, decimals: Number(decimals || 0), symbol: symbol.join("__"), network, foreign_asset });

    if (amount.valid && amount.value) {
      setAmount((a) => ({ ...a, value: +Number(a.value).toFixed(Number(decimals)) }));
    }
  };

  useEffect(() => {
    const run = async () => {
      if (fromToken && fromToken.network !== "Obyte" && amount.value && amount.valid && Number(amount.value) > 0) {
        try {
          const { estimateOutput } = await import("counterstake-sdk");
          const res = await estimateOutput({
            amount: Number(amount.value),
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
  }, [fromToken, amount]);

  const buyForReserve = () => {
    ReactGA.event({
      category: "Trade",
      action: "Buy",
      label: address as string,
    });
  };

  const buyViaEVM = async () => {
    if (!fromToken) return;
    try {
      const { transferEVM2Obyte } = await import("counterstake-sdk");
      await transferEVM2Obyte({
        amount: Number(amount.value),
        src_network: fromToken.network,
        src_asset: fromToken.asset,
        dst_network: "Obyte",
        dst_asset: reserve_asset,
        recipient_address: address,
        data: { type: currentToken?.type, to: walletAddress },
        assistant_reward_percent: 1,
        testnet: appConfig.ENVIRONMENT === "testnet",
        obyteClient: client,
        oswap_change_address: walletAddress,
      });

      ReactGA.event({
        category: "Trade",
        action: "Buy CS",
        label: address as string,
      });
    } catch {
      toast.error(t("common.errors.transaction_fail", "The transaction would fail. Please check that you have sufficient balance"), { position: "top-center" });
    }
  };

  if (!currentToken || !fromToken)
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
        <Loader2 className="size-8 animate-spin text-primary" aria-label="loading" />
      </div>
    );

  const metamaskInstalled = !!(window as unknown as { ethereum?: unknown }).ethereum;

  const counterstake_assistant_fee = fromToken.network !== "Obyte" ? Number(amount.value) * 0.01 : 0;

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
          <FormItem>{(control) => <Combobox {...control} value={fromTokenValue} onValueChange={handleChangeFromToken} options={fromTokenOptions} />}</FormItem>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-2 md:grid-cols-3">
        {!type ? (
          <>
            <div className="md:col-span-1">
              <FormItem>
                <span className="flex h-10 flex-wrap items-center justify-between text-lg">
                  <span>{t("forms.common.you_get", "You get")}:</span> {fromToken.network !== "Obyte" ? "≈" : ""}
                  {getAmountValue > 0 ? +Number(getAmountValue / 10 ** currentToken.decimals).toPrecision(currentToken.decimals) : 0}
                </span>
              </FormItem>
            </div>
            <div className="md:col-span-2">
              <FormItem>
                {(control) => (
                  <Select value={currentToken?.type} onValueChange={(toType) => setCurrentToken(tokens.find(({ type }) => type === toType))}>
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
          </>
        ) : getAmount.value ? (
          <div className="md:col-span-3" style={{ marginBottom: 10, fontWeight: "bold", paddingLeft: 5 }}>
            <span style={{ marginRight: 5 }}>{t("forms.common.you_get", "You get")}:</span> <span>{(getAmountValue > 0 ? getAmountValue : 0) / 10 ** currentToken.decimals}</span> {tokenLabel(currentToken, yes_team, no_team)}
          </div>
        ) : (
          ""
        )}
      </div>

      {meta && (fromToken.network === "Obyte" || !estimateError) && (
        <FormItem className="metaWrap">
          <TransactionEstimation meta={meta} params={params} tokenType={currentToken?.type} showEstimatedWinnings={true} yes_team={yes_team} no_team={no_team} />
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
                  : 1 {fromToken.symbol} ≈ {+Number(estimate / Number(amount.value)).toFixed(reserve_decimals)} {reserve_symbol}
                </div>
              ) : null}
            </div>
          ) : (
            <div />
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
