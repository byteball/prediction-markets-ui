import { Form, Select, Input, Spin, Col, Row, Button, Alert, notification } from "antd";
import { isNaN } from "lodash";
import QRButton from "obyte-qr-button";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { estimateOutput, transferEVM2Obyte } from "counterstake-sdk";
import ReactGA from "react-ga";
import { useTranslation, Trans } from "react-i18next";

import {
  selectActiveAddress,
  selectActiveMarketParams,
  selectActiveMarketStateVars
} from "store/slices/activeSlice";
import { selectWalletAddress } from "store/slices/settingsSlice";
import { get_result_for_buying_by_type } from "utils/getExchangeResult";
import { selectTokensByNetwork } from "store/slices/bridgesSlice";
import { generateLink } from "utils";

import { TransactionMeta } from "components/TransactionMeta/TransactionMeta";
import { WalletModal } from "modals";

import appConfig from "appConfig";
import client from "services/obyte";


const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export const BuyForm = ({ type, yes_team, no_team, amount, setAmount }) => {
  const stateVars = useSelector(selectActiveMarketStateVars);
  const address = useSelector(selectActiveAddress);
  const params = useSelector(selectActiveMarketParams);
  const walletAddress = useSelector(selectWalletAddress);
  const tokensByNetwork = useSelector(selectTokensByNetwork);

  const btnRef = useRef();
  const { t } = useTranslation();

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
    if (currentToken && amount.valid && !isNaN(Number(amount.value)) && Number(amount.value) > 0) {
      const reserveAmount = (fromToken.network !== "Obyte" ? estimate : amount.value) * 10 ** reserve_decimals;

      const result = get_result_for_buying_by_type(stateVars, params, currentToken.type, reserveAmount);

      setGetAmount({ value: result.amount, valid: true })
      setMeta(result);
    } else {
      setMeta(null);
      setGetAmount({ value: '', valid: true });
    }
  }, [currentToken, amount, estimate, stateVars]);

  let data = { type: currentToken?.type };

  const link = generateLink({ aa: address, asset: reserve_asset, is_single: true, amount: Math.ceil(amount.value * 10 ** reserve_decimals), data, from_address: walletAddress || undefined });

  const handleChangeFromToken = (strValue) => {
    const [network, asset, decimals, foreign_asset, ...symbol] = strValue.split("__");

    setFromToken({ asset, decimals: Number(decimals || 0), symbol: symbol.join("__"), network, foreign_asset });

    if (amount.valid && amount.value) {
      setAmount((a) => ({ ...a, value: +Number(a.value).toFixed(decimals) }));
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

        setEstimateError(undefined);
      } catch (e) {
        setEstimate(0);
        setEstimateError(e.message);
        console.log('estimateOutput error')
      }

    } else if (estimate) {
      setEstimate(0);
    }
  }, [fromToken, amount]);

  const buyForReserve = () => {
    ReactGA.event({
      category: "Trade",
      action: "Buy",
      label: address
    });
  }

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

      ReactGA.event({
        category: "Trade",
        action: "Buy CS",
        label: address
      });

    } catch {
      notification.error({
        message: t("common.errors.transaction_fail", "The transaction would fail. Please check that you have sufficient balance"),
        placement: "top"
      });
    };
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
          <Input size="large" placeholder={t("forms.buy.stake_amount", "Stake amount")} value={amount.value} onChange={handleChangeAmount} onKeyDown={(ev) => ev.key === 'Enter' ? btnRef.current.click() : null} />
        </Form.Item>
      </Col>
      <Col md={{ span: 16 }} xs={{ span: 24 }}>
        <Form.Item>
          <Select size="large" showSearch value={`${fromToken.network}__${fromToken.asset}__${fromToken.decimals}__${fromToken.foreign_asset}__${fromToken.symbol}`} onChange={handleChangeFromToken}>
            <Select.OptGroup label="Obyte">
              <Select.Option value={`Obyte__${reserve_asset}__${reserve_decimals}__no__${reserve_symbol}`}>{reserve_symbol}</Select.Option>
            </Select.OptGroup>
            {Object.entries(tokensByNetwork).map(([network, items]) => (
              <Select.OptGroup key={`network-${network}`} label={network}>
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
            <span className="ant-form-text" style={{ display: 'flex', alignItems: 'center', height: 40, verticalAlign: 'middle', fontSize: 18, justifyContent: 'space-between', flexWrap: 'wrap' }}><span>{t("forms.common.you_get", "You get")}:</span> {fromToken.network !== "Obyte" ? '≈' : ''}{getAmount.value > 0 ? +Number(getAmount.value / 10 ** currentToken?.decimals).toPrecision(currentToken?.decimals) : 0}</span>
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
        <span style={{ marginRight: 5 }}>You get:</span> <span>{(Number(getAmount.value) > 0 ? getAmount.value : 0) / 10 ** currentToken?.decimals}</span> {(yes_team && no_team) ? <>{(currentToken?.type === 'draw' ? 'Draw' : (currentToken?.type === 'yes' ? yes_team : no_team))} ({currentToken?.symbol})</> : <>{currentToken?.symbol} {(currentToken?.type && currentToken?.type !== 'reserve') ? '(' + currentToken?.type.toUpperCase() + '-token)' : ''}</>}
      </div> : '')}
    </Row>

    {meta && (fromToken.network === 'Obyte' || !estimateError) && <Form.Item className="metaWrap">
      <TransactionMeta
        meta={meta}
        params={params}
        tokenType={currentToken?.type}
        showEstimatedWinnings={true}
        yes_team={yes_team}
        no_team={no_team}
      />
      {(fromToken.network !== "Obyte" && estimate) ? <div style={{ marginTop: 20 }}>
        {counterstake_assistant_fee ? <div><span className="metaLabel"><Trans i18nKey="meta_trans.cs_fee"><a href="https://counterstake.org" target="_blank" rel="noopener">Counterstake</a> fee</Trans></span>: {+Number(counterstake_assistant_fee).toFixed(fromToken.decimals)} {fromToken.symbol}</div> : null}
        {(fromToken.network !== "Obyte" && estimate && fromToken.foreign_asset !== reserve_asset) ? <div><span className="metaLabel"><Trans i18nKey="meta_trans.oswap_rate"><a href="https://oswap.io" target="_blank" rel="noopener">Oswap</a> rate</Trans></span>: 1 {fromToken.symbol} ≈ {+Number(estimate / amount.value).toFixed(reserve_decimals)} {reserve_symbol}</div> : null}
      </div> : <div />}
    </Form.Item>}

    {!metamaskInstalled && fromToken.network !== "Obyte" && <Form.Item>
      <Alert
        type="error"
        message={t("forms.common.no_metamask", "MetaMask not installed!")}
        description={<Trans i18nKey="forms.common.install_metamask">Please <a href="https://metamask.io/download/" style={{ color: "#fff", textDecoration: 'underline' }} target="_blank" rel="noopener">install</a> it in your browser.</Trans>}
      />
    </Form.Item>}

    {!walletAddress && fromToken.network !== "Obyte" && <Form.Item>
      <Alert
        type="error"
        message={t("forms.common.no_obyte_wallet", "You have not added your Obyte wallet to the site!")}
        description={<Trans i18nKey="forms.common.install_obyte">If you don't have it yet, please <a href="https://obyte.org/#download" target="_blank" rel="noopener">install</a> and <WalletModal type="link" styles={{ fontSize: 16 }}>add</WalletModal> it. It is to this wallet that the purchased assets will come.</Trans>}
      />
    </Form.Item>}

    {estimateError && fromToken.network !== "Obyte" && <Form.Item>
      <Alert
        type="error"
        message={estimateError}
      />
    </Form.Item>}

    <Form.Item>
      {fromToken.network === "Obyte" ? <QRButton size="large" ref={btnRef} href={link} disabled={!amount.valid || !Number(amount.value)} type="primary" onClick={buyForReserve}>{t("forms.common.send", "Send")}{(amount.valid && amount.value) ? ` ${amount.value}` : ''} {reserve_symbol}</QRButton> : <Button size="large" type="primary" onClick={buyViaEVM} disabled={!metamaskInstalled || !walletAddress || !amount.valid || !Number(amount.value) || estimateError}>{t("forms.common.send", "Send")}{(amount.valid && amount.value) ? ` ${amount.value}` : ''} {fromToken.symbol}</Button>}
    </Form.Item>
  </Form>
}