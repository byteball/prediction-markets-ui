import { Form, Select, Input, Spin, Col, Row } from "antd";
import { isNaN } from "lodash";
import QRButton from "obyte-qr-button";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { FormLabel } from "components/FormLabel/FormLabel";
import { selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars } from "store/slices/activeSlice";
import { selectWalletAddress } from "store/slices/settingsSlice";
import { generateLink, getExchangeResult } from "utils";
import { get_token_amount } from "utils/getExchangeResult";

const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

const getColorByValue = (v) => {
  const value = Math.abs(Number(v));

  if (value < 5) {
    return '#ccc'
  } else if (value >= 5 && value < 15) {
    return "#FFC148"
  } else {
    return "#FD5E56"
  }
}

export const BuyForm = ({ type, yes_team, no_team, amount, setAmount }) => {
  const stateVars = useSelector(selectActiveMarketStateVars);
  const address = useSelector(selectActiveAddress);
  const params = useSelector(selectActiveMarketParams);
  const walletAddress = useSelector(selectWalletAddress);

  const btnRef = useRef();

  const [tokens, setTokens] = useState([]);
  const [currentToken, setCurrentToken] = useState();
  const [meta, setMeta] = useState();

  const [getAmount, setGetAmount] = useState({ value: undefined, valid: true });

  const { reserve_asset, yes_symbol, no_symbol, draw_symbol, allow_draw, reserve_symbol, reserve_decimals, yes_decimals, no_decimals, draw_decimals } = params;

  const { yes_asset, no_asset, draw_asset } = stateVars;

  const network_fee = reserve_asset === 'base' ? 1e4 : 0;

  const minAmount = reserve_asset === 'base' ? network_fee / 1e9 : 1 / 10 ** reserve_decimals

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
      if (f(value) <= reserve_decimals) {
        setAmount({ value, valid: !isNaN(Number(value)) && Number(value) > minAmount });
      }
    }
  }

  useEffect(() => {
    if (currentToken && amount.valid && !isNaN(Number(amount.value)) && Number(amount.value) > 0) {
      const reserveAmount = amount.value * 10 ** reserve_decimals;

      const tokenAmount = get_token_amount(stateVars, params, currentToken?.type, reserveAmount)

      const result = getExchangeResult(stateVars, params, currentToken.type === 'yes' ? tokenAmount : 0, currentToken.type === 'no' ? tokenAmount : 0, currentToken.type === 'draw' ? tokenAmount : 0);

      setGetAmount({ value: tokenAmount, valid: true })
      setMeta(result);
    } else {
      setMeta(null);
      setGetAmount({ value: '', valid: true });
    }
  }, [currentToken, amount]);

  let data = { type: currentToken?.type };

  const link = generateLink({ aa: address, asset: reserve_asset, is_single: true, amount: Math.ceil(amount.value * 10 ** reserve_decimals), data, from_address: walletAddress || undefined })

  const new_price = meta && currentToken ? currentToken.type === 'yes' ? meta.new_yes_price : (currentToken.type === 'no' ? meta.new_no_price : meta.new_draw_price) : 0;
  const old_price = meta && currentToken ? currentToken.type === 'yes' ? meta.old_yes_price : (currentToken.type === 'no' ? meta.old_no_price : meta.old_draw_price) : 0;

  const percentageDifference = new_price !== 0 && old_price !== 0 ? 100 * (new_price - old_price) / old_price : 0;
  const percentageArbProfitTax = Number(100 * (meta?.arb_profit_tax / (amount.value * 10 ** reserve_decimals)));


  if (!currentToken) return <Spin size="large" />

  return <Form size="small" layout="vertical">
    <Form.Item>
      <Input suffix={reserve_symbol} size="large" placeholder="Reserve amount" value={amount.value} onChange={handleChangeAmount} onKeyDown={(ev) => ev.key === 'Enter' ? btnRef.current.click() : null} />
    </Form.Item>

    <Row gutter={8}>
      {!type ? <>
        <Col md={{ span: 8 }} xs={{ span: 24 }}>
          <Form.Item>
            <span className="ant-form-text" style={{ display: 'flex', alignItems: 'center', height: 40, verticalAlign: 'middle', fontSize: 18 }}>{getAmount.value / 10 ** currentToken?.decimals}</span>
          </Form.Item>
        </Col>
        <Col md={{ span: 16 }} xs={{ span: 24 }}>
          <Form.Item style={{ margin: 0 }}>
            <Select size="large" placeholder="Select a get token" value={currentToken?.asset} onChange={(toAsset) => setCurrentToken(tokens.find(({ asset }) => asset === toAsset))}>
              {tokens?.map(({ asset, symbol, type }) => (<Select.Option key={`to_${asset}`} value={asset}>
                {(yes_team && no_team) ? <>{(type === 'draw' ? 'Draw' : (type === 'yes' ? yes_team : no_team))} ({symbol})</> : <>{symbol} {(type && type !== 'reserve') ? '(' + type.toUpperCase() + '-token)' : ''}</>}
              </Select.Option>))}
            </Select>
          </Form.Item>
        </Col>
      </> : (getAmount.value ? <div style={{ marginBottom: 10, fontWeight: 'bold', paddingLeft: 5 }}>
        <span style={{ marginRight: 5 }}>You get:</span> <span>{getAmount.value / 10 ** currentToken?.decimals}</span> {(yes_team && no_team) ? <>{(currentToken?.type === 'draw' ? 'Draw' : (currentToken?.type === 'yes' ? yes_team : no_team))} ({currentToken?.symbol})</> : <>{currentToken?.symbol} {(currentToken?.type && currentToken?.type !== 'reserve') ? '(' + currentToken?.type.toUpperCase() + '-token)' : ''}</>}
      </div> : '')}
    </Row>
    {meta && <Form.Item label="" tooltip="text">
      <div className="metaWrap">
        {percentageDifference !== 0 && <div><span className="metaLabel">New price</span>: <span style={{ color: getColorByValue(percentageDifference) }}>{+Number(new_price).toPrecision(8)} {reserve_symbol} (<span>{percentageDifference > 0 ? "+" : ''}{Number(percentageDifference).toFixed(2)}%)</span></span></div>}
        {meta?.arb_profit_tax !== 0 && <div><span className="metaLabel">Arb profit tax</span>:  <span style={{ color: getColorByValue(percentageArbProfitTax) }}>{Number(percentageArbProfitTax).toFixed(2)}% {percentageArbProfitTax > 5 && <FormLabel info="The more you change the price, the more commissions you pay." />}</span></div>}
        {meta?.issue_fee !== 0 && <div><span className="metaLabel">Issue fee</span>: {+Number(meta.issue_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
        {meta?.redeem_fee !== 0 && <div><span className="metaLabel">Redeem fee</span>: {+Number(meta.redeem_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
        {meta?.fee !== 0 && <div><span className="metaLabel">Total fee</span>: {+Number((meta.fee + network_fee) / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
      </div>
    </Form.Item>}

    <Form.Item>
      <QRButton size="large" ref={btnRef} href={link} disabled={!amount.valid || !Number(amount.value)} type="primary">Send{(amount.valid && amount.value) ? ` ${amount.value}` : ''} {reserve_symbol}</QRButton>
    </Form.Item>
  </Form>
}