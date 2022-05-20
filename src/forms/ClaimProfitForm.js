import { useState } from "react";
import { Form, Input } from "antd";
import QRButton from "obyte-qr-button";

import { generateLink } from "utils/generateLink";

const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export const ClaimProfitForm = ({ address, asset, supply, reserve, decimals = 0, walletAddress, symbol, reserve_decimals, reserve_symbol }) => {
  const [amount, setAmount] = useState({ value: '', valid: false });

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

  const amountLessSupply = Number(amount.value) * 10 ** decimals < supply;
  const amountIsValid = amount.valid && Number(amount.value) && amountLessSupply;

  return <Form size="large">
    <Form.Item
      validateStatus={amount.value === '' ? '' : (amountIsValid ? 'success' : 'error')}
      extra={amount.value === '' ? null : (amountIsValid ? <div>You get {+Number(payout / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div> : <div style={{ color: 'red' }}>{(!amount.valid ? (Number(amount.value) !== 0 ? 'Not valid amount' : '') : `Max value: ${Number(supply / 10 ** decimals).toFixed(decimals)}`)}</div>)}>
      <Input autoFocus={true} value={amount.value} onChange={handleAmount} placeholder="Amount" suffix={symbol} />
    </Form.Item>

    <Form.Item>
      <QRButton type="primary" disabled={!amountIsValid} href={link}>Claim profit</QRButton>
    </Form.Item>
  </Form>
}