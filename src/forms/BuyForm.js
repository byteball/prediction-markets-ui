import { Form, Select, Input, Spin } from "antd";
import { isNaN } from "lodash";
import QRButton from "obyte-qr-button";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars } from "store/slices/activeSlice";
import { selectWalletAddress } from "store/slices/settingsSlice";
import { generateLink } from "utils/generateLink";
import { getExchangeResult } from "utils/getExchangeResult";


const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export const BuyForm = () => {
  const stateVars = useSelector(selectActiveMarketStateVars);
  const address = useSelector(selectActiveAddress);
  const params = useSelector(selectActiveMarketParams);
  const walletAddress = useSelector(selectWalletAddress);

  const btnRef = useRef();

  const [tokens, setTokens] = useState([]);
  const [currentToken, setCurrentToken] = useState();
  const [meta, setMeta] = useState();
  const [amount, setAmount] = useState({ value: 0.1, valid: true });
  const [sendAmount, setSendAmount] = useState({ value: undefined, valid: true });

  const { reserve_asset, yes_symbol, no_symbol, draw_symbol, allow_draw, reserve_symbol, reserve_decimals, yes_decimals, no_decimals, draw_decimals } = params;

  const { yes_asset, no_asset, draw_asset } = stateVars;

  const network_fee = reserve_asset === 'base' ? 1e4 : 0;

  useEffect(() => {
    const tokens = [
      { symbol: yes_symbol, asset: yes_asset, type: 'yes', decimals: yes_decimals },
      { symbol: no_symbol, asset: no_asset, type: 'no', decimals: no_decimals },
    ];

    if (allow_draw) {
      tokens.push({ symbol: draw_symbol, asset: draw_asset, decimals: draw_decimals, type: 'draw' });
    }

    setTokens(tokens);
    setCurrentToken(tokens[0]);
  }, [address]);

  const handleChangeAmount = (ev) => {
    const value = ev.target.value;

    if (value === "") {
      setAmount({ value: undefined, valid: true });
    } else {
      if (f(value) <= currentToken.decimals) {
        setAmount({ value, valid: !isNaN(Number(value)) && Number(value) > 0 });
      }
    }
  }

  useEffect(() => {
    if (currentToken && amount.valid && !isNaN(Number(amount.value))) {
      const tokenAmount = amount.value * 10 ** currentToken.decimals;
      const result = getExchangeResult(stateVars, params, currentToken.type === 'yes' ? tokenAmount : 0, currentToken.type === 'no' ? tokenAmount : 0, currentToken.type === 'draw' ? tokenAmount : 0);

      setSendAmount({ value: result.reserve_needed + result.fee + network_fee, valid: true });

      setMeta(result);
    } else {
      setMeta(null);
      setSendAmount({ value: '', valid: true });
    }
  }, [currentToken, amount]);

  let data = {};

  if (currentToken?.type === 'yes') data.yes_amount = Number(amount.value * 10 ** yes_decimals).toFixed(0);
  if (currentToken?.type === 'no') data.no_amount = Number(amount.value * 10 ** no_decimals).toFixed(0);
  if (currentToken?.type === 'draw') data.draw_amount = Number(amount.value * 10 ** draw_decimals).toFixed(0);

  const link = generateLink({ aa: address, asset: reserve_asset, is_single: true, amount: Math.ceil(sendAmount.value), data, from_address: walletAddress || undefined })

  if (!currentToken) return <Spin size="large" />

  return <Form size="large">
    <Form.Item>
      <Select placeholder="Select a get token" value={currentToken?.asset} onChange={(toAsset) => setCurrentToken(tokens.find(({ asset }) => asset === toAsset))}>
        {tokens?.map(({ asset, symbol, type }) => (<Select.Option key={`to_${asset}`} value={asset}>
          {symbol} {(type && type !== 'reserve') ? '(' + type.toUpperCase() + '-token)' : ''}
        </Select.Option>))}
      </Select>
    </Form.Item>
    <Form.Item>
      <Input placeholder="Amount" value={amount.value} onChange={handleChangeAmount} onKeyDown={(ev) => ev.key === 'Enter' ? btnRef.current.click() : null} />
    </Form.Item>
    {meta && <Form.Item>
      <div style={{ color: '#ccc' }}>
        {meta?.arb_profit_tax !== 0 && <div><span style={{ fontWeight: 500 }}>Arb profit tax</span>: {+Number(meta.arb_profit_tax / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
        {meta?.issue_fee !== 0 && <div><span style={{ fontWeight: 500 }}>Issue fee</span>: {+Number(meta.issue_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
        {meta?.redeem_fee !== 0 && <div><span style={{ fontWeight: 500 }}>Redeem fee</span>: {+Number(meta.redeem_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
        {meta?.fee !== 0 && <div><span style={{ fontWeight: 500 }}>Total fee</span>: {+Number((meta.fee + network_fee) / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
      </div>
    </Form.Item>}
    <Form.Item>
      <QRButton ref={btnRef} href={link} disabled={!amount.valid || !Number(amount.value)} type="primary">Send {sendAmount.valid && Number(sendAmount.value) ? Number(sendAmount.value) / 10 ** reserve_decimals : ''} {reserve_symbol}</QRButton>
    </Form.Item>
  </Form>
}