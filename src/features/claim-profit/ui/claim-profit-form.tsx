import { useState, useEffect, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import { QRButton } from "@/shared/ui/qr-button/qr-button";
import { truncate } from "lodash-es";
import { buildClaimProfitLink } from "../lib/claim-link";
import { useAppSelector } from "@/shared/lib/redux";
import { selectWalletBalance } from "@/entities/wallet";

import { FormItem } from "@/shared/ui/form-item";
import { InputGroup } from "@/shared/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

const f = (x: unknown) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export type ClaimProfitFormProps = {
  address: string | null;
  asset?: string;
  supply?: number;
  reserve?: number;
  decimals?: number;
  walletAddress?: string | null;
  symbol?: string;
  reserve_decimals: number;
  reserve_symbol: string;
  isTokenless?: boolean;
  outcomeBalance?: number;
};

export const ClaimProfitForm = ({ address, asset, supply = 0, reserve = 0, decimals = 0, walletAddress, symbol, reserve_decimals, reserve_symbol, isTokenless = false, outcomeBalance = 0 }: ClaimProfitFormProps) => {
  const walletBalance = useAppSelector(selectWalletBalance);
  const { t } = useTranslation();

  // tokenless markets keep the position in the AA state, tokened markets in the wallet
  const userBalanceOfWinnerTokens: number = isTokenless ? outcomeBalance : asset ? walletBalance?.[asset]?.total || 0 : 0;
  const userBalanceOfWinnerTokensView = +Number(userBalanceOfWinnerTokens / 10 ** decimals).toFixed(decimals);

  const [amount, setAmount] = useState<{ value: string | number; valid: boolean }>({ value: "", valid: false });

  useEffect(() => {
    setAmount(userBalanceOfWinnerTokens ? { value: userBalanceOfWinnerTokensView, valid: true } : { value: "", valid: false });
  }, [userBalanceOfWinnerTokens, userBalanceOfWinnerTokensView]);

  const price_winner_by_reserve = reserve / supply;
  const payout = Math.floor(Number(amount.value) * 10 ** decimals * price_winner_by_reserve);

  const handleAmount = (ev: ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value?.trim();

    if (value === "") {
      setAmount({ value, valid: false });
    } else {
      if (f(value) <= decimals) {
        setAmount({ value, valid: !isNaN(Number(value)) && Number(value) > 0 });
      }
    }
  };

  const link = buildClaimProfitLink({ aa: address, isTokenless, asset, decimals, amount: amount.value, walletAddress });

  const amountLessOrEqualSupply = Number(amount.value) * 10 ** decimals <= supply;
  const amountIsValid = amount.valid && Number(amount.value) && amountLessOrEqualSupply;

  const insertToInput = () => {
    setAmount({ value: userBalanceOfWinnerTokensView, valid: true });
  };

  const status = amount.value === "" ? "" : amountIsValid ? "success" : "error";
  const extra =
    amount.value === "" ? null : amountIsValid ? (
      <div>
        {t("forms.common.you_get", "You get")} {+Number(payout / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}
      </div>
    ) : (
      <div style={{ color: "red" }}>{!amount.valid ? (Number(amount.value) !== 0 ? t("forms.common.not_valid_amount", "Not valid amount") : "") : `${t("forms.common.max_value", "Max value")}: ${+Number(supply / 10 ** decimals).toFixed(decimals)}`}</div>
    );

  return (
    <form className="text-base" onSubmit={(e) => e.preventDefault()}>
      {userBalanceOfWinnerTokens ? (
        <span className="cursor-pointer text-sm text-muted-foreground" onClick={insertToInput}>
          {t("forms.claim_profit.max", "max")} {userBalanceOfWinnerTokensView}
        </span>
      ) : null}
      <FormItem status={status} extra={extra}>
        {(control) => (
          <InputGroup
            {...control}
            autoFocus={true}
            readOnly={isTokenless}
            value={amount.value}
            onChange={handleAmount}
            placeholder={t("forms.common.amount", "Amount")}
            suffix={
              <Tooltip>
                <TooltipTrigger asChild>
                  <span style={{ maxWidth: "100%", overflow: "hidden", cursor: "default" }}>{truncate(symbol ?? "", { length: 18 })}</span>
                </TooltipTrigger>
                <TooltipContent>{symbol}</TooltipContent>
              </Tooltip>
            }
          />
        )}
      </FormItem>

      <FormItem>
        <QRButton size="lg" disabled={!amountIsValid || (!isTokenless && !asset)} href={link}>
          {t("forms.claim_profit.claim_profit", "Claim profit")}
        </QRButton>
      </FormItem>
    </form>
  );
};
