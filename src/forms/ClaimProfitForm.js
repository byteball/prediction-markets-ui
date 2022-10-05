import { useState, useEffect } from "react";
import { Form, Input, Typography } from "antd";
import { QRButton } from "components/QRButton/QRButton";
import { useTranslation } from "react-i18next";

import { generateLink, truncate } from "utils";
import { useSelector } from "react-redux";
import { selectWalletBalance } from "store/slices/userWalletSlice";

const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export const ClaimProfitForm = ({ address, asset, supply = 0, reserve = 0, decimals = 0, walletAddress, symbol, reserve_decimals, reserve_symbol }) => {
  const [amount, setAmount] = useState({ value: '', valid: false });
  const walletBalance = useSelector(selectWalletBalance);
  const { t } = useTranslation();
  
  const price_winner_by_reserve = reserve / supply;
  const payout = Math.floor(amount.value * 10 ** decimals * price_winner_by_reserve);

  const handleAmount = (ev) => {
    const value = ev.target.value?.trim();

    if (value === "") {
      setAmount({ value, valid: false });
    } else {
      if (f(value) <= decimals) {
        setAmount({ value, valid: !isNaN(Number(value)) && Number(value) > 0 });
      }
    }
  }

  const link = generateLink({ aa: address, asset, is_single: true, amount: Math.ceil(+amount.value * 10 ** decimals), data: { claim_profit: 1 }, from_address: walletAddress || undefined })

  const amountLessOrEqualSupply = Number(amount.value) * 10 ** decimals <= supply;
  const amountIsValid = amount.valid && Number(amount.value) && amountLessOrEqualSupply;

  const userBalanceOfWinnerTokens = walletBalance?.[asset]?.total || 0;
  const userBalanceOfWinnerTokensView = +Number(userBalanceOfWinnerTokens / 10 ** decimals).toFixed(decimals);

  useEffect(() => {
    if (userBalanceOfWinnerTokens) {
      setAmount({ value: userBalanceOfWinnerTokensView, valid: true })
    } else {
      setAmount({ value: '', valid: false })
    }
  }, [userBalanceOfWinnerTokensView]);

  const insertToInput = () => {
    setAmount({ value: userBalanceOfWinnerTokensView, valid: true });
  }

  return <Form size="large" layout='vertical'>
    {userBalanceOfWinnerTokens ? <Typography.Text type="secondary" onClick={insertToInput} style={{cursor: 'pointer'}}>{t("forms.claim_profit.max", "max")} {userBalanceOfWinnerTokensView}</Typography.Text> : null}
    <Form.Item
      validateStatus={amount.value === '' ? '' : (amountIsValid ? 'success' : 'error')}
      extra={amount.value === '' ? null : (amountIsValid ? <div>{t("forms.common.you_get", "You get")} {+Number(payout / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div> : <div style={{ color: 'red' }}>{(!amount.valid ? (Number(amount.value) !== 0 ? t("forms.common.not_valid_amount", "Not valid amount") : '') : `${t("forms.common.max_value", "Max value")}: ${+Number(supply / 10 ** decimals).toFixed(decimals)}`)}</div>)}>
      <Input autoFocus={true} value={amount.value} onChange={handleAmount} placeholder={t("forms.common.amount", "Amount")} suffix={<span style={{ maxWidth: '100%', overflow: 'hidden' }}>{truncate(symbol, { length: 18 })}</span>} />
    </Form.Item>

    <Form.Item>
      <QRButton type="primary" disabled={!amountIsValid} href={link}>{t("forms.claim_profit.claim_profit", "Claim profit")}</QRButton>
    </Form.Item>
  </Form>
}