import { Form, Select, Input, Alert, Spin, Row, Col } from "antd";
import { isNaN } from "lodash";
import QRButton from "obyte-qr-button";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars } from "store/slices/activeSlice";
import { selectWalletAddress } from "store/slices/settingsSlice";
import { generateLink, getExchangeResult } from "utils";

const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export const RedeemForm = ({ type }) => {
  const stateVars = useSelector(selectActiveMarketStateVars);
  const address = useSelector(selectActiveAddress);
  const params = useSelector(selectActiveMarketParams);
  const walletAddress = useSelector(selectWalletAddress);

  const [tokens, setTokens] = useState([]);
  const [currentToken, setCurrentToken] = useState();
  const [meta, setMeta] = useState();
  const [amount, setAmount] = useState({ value: 1, valid: true });
  const [payoutAmount, setPayoutAmount] = useState({ value: undefined, valid: true });

  const btnRef = useRef();

  const { reserve_asset, yes_symbol, no_symbol, draw_symbol, allow_draw, reserve_symbol, reserve_decimals, yes_decimals, no_decimals, draw_decimals } = params;
  const { yes_asset, no_asset, draw_asset } = stateVars;
  const network_fee = reserve_asset === 'base' ? 1e4 : 0;

  useEffect(() => {
    setAmount({ value: 1, valid: true });
  }, []);
  
  useEffect(() => {
    const tokens = [
      { symbol: yes_symbol, asset: yes_asset, type: 'yes', decimals: yes_decimals },
      { symbol: no_symbol, asset: no_asset, type: 'no', decimals: no_decimals },
    ];

    if (allow_draw) {
      tokens.push({ symbol: draw_symbol, asset: draw_asset, decimals: draw_decimals, type: 'draw' });
    }
    setTokens(tokens);

    const tokenIndex = type ? tokens.findIndex((item) => item.type === type) : 0;
    setCurrentToken(tokens[tokenIndex]);
  }, [address, type]);

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
      const tokenAmount = -1 * amount.value * 10 ** currentToken.decimals;
      const result = getExchangeResult(stateVars, params, currentToken.type === 'yes' ? tokenAmount : 0, currentToken.type === 'no' ? tokenAmount : 0, currentToken.type === 'draw' ? tokenAmount : 0);
      console.log('result', result)
      setPayoutAmount({ value: result.payout - result.fee, valid: true });

      setMeta(result);
    } else {
      setMeta(null);
      setPayoutAmount({ value: '', valid: true });
    }
  }, [currentToken, amount]);

  let data = {};

  if (currentToken?.type === 'yes') data.yes_amount = Number(amount.value * 10 ** yes_decimals).toFixed(0);
  if (currentToken?.type === 'no') data.no_amount = Number(amount.value * 10 ** no_decimals).toFixed(0);
  if (currentToken?.type === 'draw') data.draw_amount = Number(amount.value * 10 ** draw_decimals).toFixed(0);

  const link = generateLink({ aa: address, asset: currentToken?.asset, is_single: true, amount: Math.ceil(amount.value * 10 ** currentToken?.decimals), from_address: walletAddress || undefined })

  if (!currentToken) return <Spin size="large" />

  return <Form size="large">
    <Row gutter={8}>
      <Col md={{ span: 6 }} xs={{ span: 24 }}>
        <Form.Item>
          <Input placeholder="Amount" value={amount.value} onChange={handleChangeAmount} onKeyDown={(ev) => ev.key === 'Enter' ? btnRef.current.click() : null} />
        </Form.Item>
      </Col>

      <Col md={{ span: 18 }} xs={{ span: 24 }}>
        <Form.Item>
          <Select disabled={!!type} placeholder="Select a get token" value={currentToken?.asset} onChange={(toAsset) => setCurrentToken(tokens.find(({ asset }) => asset === toAsset))}>
            {tokens?.map(({ asset, symbol, type }) => (<Select.Option key={`to_${asset}`} value={asset}>
              {symbol} {(type && type !== 'reserve') ? '(' + type.toUpperCase() + '-token)' : ''}
            </Select.Option>))}
          </Select>
        </Form.Item>
      </Col>
    </Row>
    {meta && <Form.Item>
      <div style={{ color: '#ccc' }}>
        {meta?.arb_profit_tax !== 0 && <div><span style={{ fontWeight: 500 }}>Arb profit tax</span>: {+Number(meta.arb_profit_tax / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
        {meta?.issue_fee !== 0 && <div><span style={{ fontWeight: 500 }}>Issue fee</span>: {+Number(meta.issue_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
        {meta?.redeem_fee !== 0 && <div><span style={{ fontWeight: 500 }}>Redeem fee</span>: {+Number(meta.redeem_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
        {meta?.fee !== 0 && <div><span style={{ fontWeight: 500 }}>Total fee</span>: {+Number((meta.fee + network_fee) / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
        {payoutAmount.value > 0 && <div style={{ color: 'green' }}><b style={{ fontWeight: 500 }}>You get</b>: {+Number((payoutAmount.value) / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
      </div>
    </Form.Item>}

    {meta && payoutAmount.value <= 0 && <Form.Item>
      <Alert
        message="The price would change too much, try a smaller amount"
        type="error"
      />
    </Form.Item>}

    <Form.Item>
      <QRButton ref={btnRef} href={link} disabled={!amount.valid || !Number(amount.value) || payoutAmount.value <= 0} type="primary">Send {amount.valid && Number(amount.value) ? Number(amount.value) : ''} {currentToken.symbol}</QRButton>
    </Form.Item>
  </Form>
}