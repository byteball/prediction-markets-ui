import { Form, Select, Input, Alert, Spin, Row, Col, Typography } from "antd";
import { isNaN } from "lodash";
import { QRButton } from "components/QRButton/QRButton";
import { memo, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import ReactGA from "react-ga";
import { useTranslation } from "react-i18next";

import { TransactionEstimation } from "components/TransactionEstimation/TransactionEstimation";
import {
  selectActiveAddress,
  selectActiveMarketParams,
  selectActiveMarketStateVars
} from "store/slices/activeSlice";
import { selectWalletAddress } from "store/slices/settingsSlice";
import { selectWalletBalance } from "store/slices/userWalletSlice";
import { generateLink, getExchangeResult, truncate } from "utils";

const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export const RedeemForm = memo(({ type, yes_team, no_team, amount, setAmount }) => {
  const stateVars = useSelector(selectActiveMarketStateVars);
  const address = useSelector(selectActiveAddress);
  const params = useSelector(selectActiveMarketParams);
  const walletAddress = useSelector(selectWalletAddress);
  const walletBalance = useSelector(selectWalletBalance);

  const [tokens, setTokens] = useState([]);
  const [currentToken, setCurrentToken] = useState();
  const [meta, setMeta] = useState();

  const [payoutAmount, setPayoutAmount] = useState({ value: undefined, valid: true });

  const btnRef = useRef();
  const { t } = useTranslation();

  const { yes_symbol, no_symbol, draw_symbol, allow_draw, reserve_symbol, reserve_decimals, yes_decimals, no_decimals, draw_decimals } = params;
  const { yes_asset, no_asset, draw_asset } = stateVars;

  const walletBalanceOfCurrentToken = (currentToken && walletAddress) ? walletBalance?.[currentToken.asset]?.total || 0 : 0;
  const currentDecimals = currentToken?.decimals || 0;

  const walletBalanceOfCurrentTokenView = +Number(walletBalanceOfCurrentToken / 10 ** currentDecimals).toFixed(currentDecimals);

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
      if (f(value) <= currentToken.decimals && value <= 9e9) {
        setAmount({ value, valid: !isNaN(Number(value)) && Number(value) > 0 });
      }
    }
  }

  useEffect(() => {
    if (currentToken && amount.valid && !isNaN(Number(amount.value)) && Number(amount.value) > 0) {
      const tokenAmount = -1 * amount.value * 10 ** currentToken.decimals;
      const result = getExchangeResult(stateVars, params, currentToken.type === 'yes' ? tokenAmount : 0, currentToken.type === 'no' ? tokenAmount : 0, currentToken.type === 'draw' ? tokenAmount : 0);

      setPayoutAmount({ value: result.payout - result.fee, valid: true });

      setMeta(result);
    } else {
      setMeta(null);
      setPayoutAmount({ value: '', valid: true });
    }
  }, [currentToken, amount, stateVars]);

  let data = {};

  if (currentToken?.type === 'yes') data.yes_amount = Number(amount.value * 10 ** yes_decimals).toFixed(0);
  if (currentToken?.type === 'no') data.no_amount = Number(amount.value * 10 ** no_decimals).toFixed(0);
  if (currentToken?.type === 'draw') data.draw_amount = Number(amount.value * 10 ** draw_decimals).toFixed(0);

  const link = generateLink({ aa: address, asset: currentToken?.asset, is_single: true, amount: Math.ceil(amount.value * 10 ** currentToken?.decimals), from_address: walletAddress || undefined })

  if (!currentToken) return <Spin size="large" />

  const redeem = () => {
    ReactGA.event({
      category: "Trade",
      action: "Redeem",
      label: address
    });
  }

  const handleChangeCurrentToken = (toAsset) => {
    setCurrentToken(tokens.find(({ asset }) => asset === toAsset));
    setAmount({ value: '', valid: false })
  }

  const insertToInput = () => {
    if (walletBalanceOfCurrentToken) {
      setAmount({ value: walletBalanceOfCurrentTokenView, valid: true })
    }
  }

  return <Form size="large">
    {walletBalanceOfCurrentToken ? <Typography.Text type="secondary" onClick={insertToInput} style={{ cursor: 'pointer' }}>max {walletBalanceOfCurrentTokenView}</Typography.Text> : null}
    <Row gutter={8}>
      <Col md={{ span: type ? 24 : 6 }} xs={{ span: 24 }}>
        <Form.Item>
          <Input placeholder={t("forms.common.amount", "Amount")} suffix={<span style={{ maxWidth: '100%', overflow: 'hidden' }}>{truncate(type ? (yes_team && no_team) ? `${(currentToken?.type === 'draw' ? 'Draw' : (currentToken?.type === 'yes' ? yes_team : no_team))} (${currentToken?.symbol})` : `${currentToken?.symbol} ${(currentToken?.type && currentToken?.type !== 'reserve') ? '(' + currentToken?.type.toUpperCase() + '-token)' : ''}` : "", { length: 18 })}</span>} value={amount.value} onChange={handleChangeAmount} onKeyDown={(ev) => ev.key === 'Enter' ? btnRef.current.click() : null} />
        </Form.Item>
      </Col>

      {!type ? <Col md={{ span: 18 }} xs={{ span: 24 }}>
        <Form.Item>
          <Select placeholder={t("forms.common.select_token", "Select token")} value={currentToken?.asset} onChange={handleChangeCurrentToken}>
            {tokens?.map(({ asset, symbol, type }) => (<Select.Option key={`to_${asset}`} value={asset}>
              {(yes_team && no_team) ? <>{(type === 'draw' ? 'Draw' : (type === 'yes' ? yes_team : no_team))} ({symbol})</> : <>{symbol} {(type && type !== 'reserve') ? '(' + type.toUpperCase() + '-token)' : ''}</>}
            </Select.Option>))}
          </Select>
        </Form.Item>
      </Col> : null}
    </Row>

    {meta && payoutAmount.value > 0 && <Form.Item>
      <div style={{ fontSize: 18, paddingBottom: 10 }}>{t("forms.common.you_get", "You get")} {+Number((payoutAmount.value) / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>

      <TransactionEstimation
        meta={meta}
        params={params}
        tokenType={currentToken?.type}
      />

    </Form.Item>}

    {(meta && payoutAmount.value <= 0) ? <Form.Item>
      <Alert
        message={t("forms.redeem.price_change", "The price would change too much, try a smaller amount")}
        type="error"
      />
    </Form.Item> : null}

    <Form.Item>
      <QRButton ref={btnRef} href={link} disabled={!amount.valid || !Number(amount.value) || payoutAmount.value <= 0} type="primary" onClick={redeem}>{t("forms.common.send", "Send")} {amount.valid && Number(amount.value) ? Number(amount.value) : ''} {truncate(currentToken.symbol, { length: 14 })}</QRButton>
    </Form.Item>
  </Form>
})