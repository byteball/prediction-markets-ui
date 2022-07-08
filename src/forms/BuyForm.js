import { Form, Select, Input, Spin, Col, Row, Button, Alert, notification } from "antd";
import { isNaN } from "lodash";
import QRButton from "obyte-qr-button";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { FormLabel } from "components/FormLabel/FormLabel";
import { selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars } from "store/slices/activeSlice";
import { selectWalletAddress } from "store/slices/settingsSlice";
import { generateLink, getExchangeResult } from "utils";
import { get_token_amount } from "utils/getExchangeResult";
import { selectTokensByNetwork } from "store/slices/bridgesSlice";
import appConfig from "appConfig";
import client from "services/obyte";
import { estimateOutput, transferEVM2Obyte } from "counterstake-sdk";

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
  const tokensByNetwork = useSelector(selectTokensByNetwork);

  const btnRef = useRef();

  const [tokens, setTokens] = useState([]);
  const [currentToken, setCurrentToken] = useState();
  const [meta, setMeta] = useState();
  const [fromToken, setFromToken] = useState()
  const [estimate, setEstimate] = useState();
  const [estimateError, setEstimateError] = useState();

  const [getAmount, setGetAmount] = useState({ value: undefined, valid: true });

  const { reserve_asset, yes_symbol, no_symbol, draw_symbol, allow_draw, reserve_symbol, reserve_decimals, yes_decimals, no_decimals, draw_decimals } = params;

  const { yes_asset, no_asset, draw_asset } = stateVars;

  const network_fee = reserve_asset === 'base' ? 1e4 : 0;

  const minAmount = reserve_asset === 'base' ? network_fee / 1e9 : 1 / 10 ** reserve_decimals

  useEffect(() => {
    setFromToken({ asset: reserve_asset, decimals: reserve_decimals, symbol: reserve_symbol, foreign_asset: 'no', network: "Obyte" })
  }, [address, reserve_asset]);

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
      if (f(value) <= fromToken.decimals && value <= 9e9) {
        setAmount({ value, valid: !isNaN(Number(value)) && Number(value) > minAmount });
      }
    }
  }

  useEffect(() => {
    if (currentToken && amount.valid && !isNaN(Number(amount.value)) && Number(amount.value) > 0 && (fromToken.network === "Obyte" || estimate)) {
      const reserveAmount = amount.value * 10 ** reserve_decimals;

      const tokenAmount = get_token_amount(stateVars, params, currentToken?.type, fromToken.network === "Obyte" ? reserveAmount : Math.ceil((estimate * 10 ** reserve_decimals) || 0))

      const result = getExchangeResult(stateVars, params, currentToken.type === 'yes' ? tokenAmount : 0, currentToken.type === 'no' ? tokenAmount : 0, currentToken.type === 'draw' ? tokenAmount : 0);

      setGetAmount({ value: tokenAmount, valid: true })
      setMeta(result);
    } else {
      setMeta(null);
      setGetAmount({ value: '', valid: true });
    }
  }, [currentToken, amount, estimate]);

  let data = { type: currentToken?.type };

  const link = generateLink({ aa: address, asset: reserve_asset, is_single: true, amount: Math.ceil(amount.value * 10 ** reserve_decimals), data, from_address: walletAddress || undefined })

  const new_price = meta && currentToken ? currentToken.type === 'yes' ? meta.new_yes_price : (currentToken.type === 'no' ? meta.new_no_price : meta.new_draw_price) : 0;
  const old_price = meta && currentToken ? currentToken.type === 'yes' ? meta.old_yes_price : (currentToken.type === 'no' ? meta.old_no_price : meta.old_draw_price) : 0;

  const percentageDifference = new_price !== 0 && old_price !== 0 ? 100 * (new_price - old_price) / old_price : 0;
  const percentageArbProfitTax = Number(100 * (meta?.arb_profit_tax / (amount.value * 10 ** reserve_decimals)));
  const totalFee = meta?.arb_profit_tax + network_fee + meta?.issue_fee;
  const percentageTotalFee = Number(100 * (totalFee / (amount.value * 10 ** reserve_decimals)));
  const change = amount.value * 10 ** reserve_decimals - meta?.reserve_needed - meta?.fee - network_fee;

  const handleChangeFromToken = (strValue) => {
    const [network, asset, decimals, foreign_asset, ...symbol] = strValue.split("__");

    setFromToken({ asset, decimals: Number(decimals || 0), symbol: symbol.join("__"), network, foreign_asset });

    if (amount.valid && amount.value) {
      setAmount((a) => ({ ...a, value: +Number(a.value).toFixed(decimals) }))
    }
  }

  useEffect(async () => {
    if (fromToken && fromToken.network !== "Obyte" && amount.value && amount.valid && Number(amount.value) > 0) {
      try {
        const res = await estimateOutput({
          amount: Number(amount.value),
          src_network: fromToken.network,
          src_asset: fromToken.asset,
          dst_network: 'Obyte',
          dst_asset: reserve_asset,
          recipient_address: walletAddress,
          assistant_reward_percent: 1.0,
          testnet: appConfig.ENVIRONMENT === 'testnet',
          obyteClient: client,
        });

        if (res && typeof res === 'number' && res > 0) {
          setEstimate(res);
        } else {
          setEstimate(0);
        }

        setEstimateError(undefined)
      } catch (e) {
        setEstimate(0);
        setEstimateError(e.message)
        console.log('estimateOutput error')
      }

    } else if (estimate) {
      setEstimate(0);
    }
  }, [fromToken, amount])

  const buyViaEVM = async () => {
    try {
      await transferEVM2Obyte({
        amount: Number(amount.value),
        src_network: fromToken.network,
        src_asset: fromToken.asset,
        dst_network: 'Obyte',
        dst_asset: reserve_asset,
        recipient_address: address,
        data: { type: currentToken?.type, to: walletAddress },
        assistant_reward_percent: 1,
        testnet: appConfig.ENVIRONMENT === 'testnet',
        obyteClient: client,
        oswap_change_address: walletAddress
      });
    } catch {
      notification.error({
        message: "The transaction would fail. Please check that you have sufficient balance",
        placement: "top"
      })
    }
  }

  if (!currentToken || !fromToken) return <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
    <Spin size="large" />
  </div>

  const metamaskInstalled = window.ethereum;

  const counterstake_assistant_fee = fromToken.network !== "Obyte" ? amount.value * 0.01 : 0;
  
  return <Form size="small" layout="vertical">
    <Row gutter={8}>
      <Col md={{ span: 8 }} xs={{ span: 24 }}>
        <Form.Item>
          <Input size="large" placeholder="Reserve amount" value={amount.value} onChange={handleChangeAmount} onKeyDown={(ev) => ev.key === 'Enter' ? btnRef.current.click() : null} />
        </Form.Item>
      </Col>
      <Col md={{ span: 16 }} xs={{ span: 24 }}>
        <Form.Item>
          <Select size="large" showSearch value={`${fromToken.network}__${fromToken.asset}__${fromToken.decimals}__${fromToken.foreign_asset}__${fromToken.symbol}`} onChange={handleChangeFromToken}>
            <Select.OptGroup label="Obyte">
              <Select.Option value={`Obyte__${reserve_asset}__${reserve_decimals}__no__${reserve_symbol}`}>{reserve_symbol}</Select.Option>
            </Select.OptGroup>
            {Object.entries(tokensByNetwork).map(([network, items]) => (
              <Select.OptGroup label={network}>
                {items.map((item) => <Select.Option value={`${network}__${item.home_asset}__${item.home_asset_decimals}__${item.foreign_asset}__${item.home_symbol}`} key={`${item.home_network} ${item.home_asset} ${item.bridge_id}`}>
                  {item.home_symbol}
                </Select.Option>)}
              </Select.OptGroup>))}
          </Select>
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={8}>
      {!type ? <>
        <Col md={{ span: 8 }} xs={{ span: 24 }}>
          <Form.Item>
            <span className="ant-form-text" style={{ display: 'flex', alignItems: 'center', height: 40, verticalAlign: 'middle', fontSize: 18, justifyContent: 'space-between', flexWrap: 'wrap' }}><span>You get:</span> {fromToken.network !== "Obyte" ? '≈' : ''}{+Number(getAmount.value / 10 ** currentToken?.decimals).toPrecision(currentToken?.decimals)}</span>
          </Form.Item>
        </Col>
        <Col md={{ span: 16 }} xs={{ span: 24 }}>
          <Form.Item>
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

    {meta && <Form.Item className="metaWrap">
      {percentageDifference !== 0 && <div><span className="metaLabel">New price</span>: <span style={{ color: getColorByValue(percentageDifference) }}>{+Number(new_price).toPrecision(8)} {reserve_symbol} (<span>{percentageDifference > 0 ? "+" : ''}{Number(percentageDifference).toFixed(2)}%)</span></span></div>}
      {meta?.arb_profit_tax !== 0 && <div><span className="metaLabel">Arb profit tax</span>:  <span style={{ color: getColorByValue(percentageArbProfitTax) }}>{+Number(meta.arb_profit_tax / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol} ({Number(percentageArbProfitTax).toFixed(2)}%) {percentageArbProfitTax > 5 && <FormLabel info="The more you change the price, the more commissions you pay." />}</span></div>}
      {meta?.issue_fee !== 0 && <div><span className="metaLabel">Issue fee</span>: {+Number((meta.issue_fee) / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol} ({params.issue_fee * 100}%)</div>}
      {meta?.fee !== 0 && <div><span className="metaLabel">Total fee</span>: {+Number((totalFee) / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol} ({percentageTotalFee.toFixed(2)}%)</div>}
      {change !== 0 && <div><span className="metaLabel">Change</span>: {+Number(change / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
      {(fromToken.network !== "Obyte" && estimate) ? <div style={{ marginTop: 20 }}>
        {counterstake_assistant_fee ? <div><span className="metaLabel"><a href="https://counterstake.org" target="_blank">Counterstake</a> fee</span>: {+Number(counterstake_assistant_fee).toFixed(fromToken.decimals)} {fromToken.symbol}</div> : null}
        {(fromToken.network !== "Obyte" && estimate && fromToken.foreign_asset !== reserve_asset) ? <div><span className="metaLabel"><a href="https://oswap.io" target="_blank">Oswap</a> rate</span>: 1 {fromToken.symbol} ≈ {+Number(estimate / amount.value).toFixed(reserve_decimals)} {reserve_symbol}</div> : null}
      </div> : <div />}
    </Form.Item>}

    {!metamaskInstalled && fromToken.network !== "Obyte" && <Form.Item>
      <Alert
        type="error"
        message="MetaMask not installed!"
        description={<span>Please <a href="https://metamask.io/download/" style={{ color: "#fff", textDecoration: 'underline' }} target="_blank">install</a> it in your browser.</span>}
      />
    </Form.Item>}

    {!walletAddress && fromToken.network !== "Obyte" && <Form.Item>
      <Alert
        type="error"
        message="You have not added your Obyte wallet to the site!"
        description={<span>If you don't have it yet, please <a href="https://obyte.org/#download" target="_blank">install</a> it. It is to this wallet that the purchased assets will come.</span>}
      />
    </Form.Item>}

    {estimateError && fromToken.network !== "Obyte" && <Form.Item>
      <Alert
        type="error"
        message={estimateError}
      />
    </Form.Item>}

    <Form.Item>
      {fromToken.network === "Obyte" ? <QRButton size="large" ref={btnRef} href={link} disabled={!amount.valid || !Number(amount.value)} type="primary">Send{(amount.valid && amount.value) ? ` ${amount.value}` : ''} {reserve_symbol}</QRButton> : <Button size="large" type="primary" onClick={buyViaEVM} disabled={!metamaskInstalled || !walletAddress || !amount.valid || !Number(amount.value) || estimateError}>Send{(amount.valid && amount.value) ? ` ${amount.value}` : ''} {fromToken.symbol}</Button>}
    </Form.Item>
  </Form>
}