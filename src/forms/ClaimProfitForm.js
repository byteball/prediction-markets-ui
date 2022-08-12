import { useState, useEffect } from "react";
import { Form, Input, Typography } from "antd";
import QRButton from "obyte-qr-button";

import { generateLink, truncate } from "utils";
import { useSelector } from "react-redux";
import { selectWalletBalance } from "store/slices/userWalletSlice";

const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export const ClaimProfitForm = ({ address, asset, supply = 0, reserve = 0, decimals = 0, walletAddress, symbol, reserve_decimals, reserve_symbol }) => {
  const [amount, setAmount] = useState({ value: '', valid: false });
  const walletBalance = useSelector(selectWalletBalance);

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
    {userBalanceOfWinnerTokens ? <Typography.Text type="secondary" onClick={insertToInput} style={{cursor: 'pointer'}}>max {userBalanceOfWinnerTokensView}</Typography.Text> : null}
    <Form.Item
      validateStatus={amount.value === '' ? '' : (amountIsValid ? 'success' : 'error')}
      extra={amount.value === '' ? null : (amountIsValid ? <div>You get {+Number(payout / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div> : <div style={{ color: 'red' }}>{(!amount.valid ? (Number(amount.value) !== 0 ? 'Not valid amount' : '') : `Max value: ${+Number(supply / 10 ** decimals).toFixed(decimals)}`)}</div>)}>
      <Input autoFocus={true} value={amount.value} onChange={handleAmount} placeholder="Amount" suffix={<span style={{ maxWidth: '100%', overflow: 'hidden' }}>{truncate(symbol, { length: 18 })}</span>} />
    </Form.Item>

    <Form.Item>
      <QRButton type="primary" disabled={!amountIsValid} href={link}>Claim profit</QRButton>
    </Form.Item>
  </Form>
}