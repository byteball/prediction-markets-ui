import { Pie } from "@ant-design/plots";
import { Alert, Button, Col, Form, Input, Row, Select, Spin, notification, Typography } from "antd";
import appConfig from "appConfig";
import { estimateOutput, transferEVM2Obyte } from "counterstake-sdk";
import { isNumber } from "lodash";
import QRButton from "obyte-qr-button";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ReactGA from "react-ga";
import { Trans, useTranslation } from "react-i18next";

import client from "services/obyte";

import {
  selectActiveAddress,
  selectActiveMarketParams,
  selectActiveMarketStateVars
} from "store/slices/activeSlice";
import { selectTokensByNetwork } from "store/slices/bridgesSlice";
import { selectWalletAddress } from "store/slices/settingsSlice";
import { generateLink, getExchangeResult, getMarketPriceByType } from "utils";
import { WalletModal } from "modals";

const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);
const floorDecimals = (number, decimals) => Math.floor(number * 10 ** decimals) / 10 ** decimals;

export const AddLiquidityForm = ({ yes_team, no_team, visible }) => {
  const params = useSelector(selectActiveMarketParams);
  const stateVars = useSelector(selectActiveMarketStateVars);

  const walletAddress = useSelector(selectWalletAddress);
  const address = useSelector(selectActiveAddress);
  const tokensByNetwork = useSelector(selectTokensByNetwork);

  const { t } = useTranslation();

  const [meta, setMeta] = useState(null);
  const [reserveAmount, setReserveAmount] = useState({ value: 0.1, valid: true });
  const [probabilities, setProbabilities] = useState({ yes: { value: '', valid: true }, no: { value: '', valid: true }, draw: { value: '', valid: true } })
  const [dataForPie, setDataForPie] = useState([]);

  const [fromToken, setFromToken] = useState()
  const [estimate, setEstimate] = useState();
  const [estimateError, setEstimateError] = useState();

  const { allow_draw, reserve_asset, reserve_decimals, reserve_symbol, base_aa, yes_odds: bookmaker_yes_odds, no_odds: bookmaker_no_odds, draw_odds: bookmaker_draw_odds } = params;
  const { supply_yes = 0, supply_no = 0, supply_draw = 0, reserve = 0 } = stateVars;

  const network_fee = reserve_asset === 'base' ? 1e4 : 0;
  const minAmount = reserve_asset === 'base' ? network_fee / 1e9 : 1 / 10 ** reserve_decimals
  const haveTeamNames = yes_team && no_team;
  const isFirstIssue = supply_yes + supply_no + supply_draw === 0;
  const needsIssueFeeForLiquidity = appConfig.BASE_AAS.findIndex((address) => address === base_aa) === 0;

  let amountInPennies = 0;
  let amountInPenniesWithoutFee = 0;

  if (fromToken && reserveAmount.valid && Number(reserveAmount.value)) {
    amountInPennies = Math.ceil((fromToken.network === "Obyte" ? reserveAmount.value : estimate) * 10 ** reserve_decimals);
    amountInPenniesWithoutFee = amountInPennies * (1 - (needsIssueFeeForLiquidity ? params.issue_fee : 0)) - network_fee;
  }

  const drawPercent = probabilities.yes.valid && probabilities.no.valid && ((Number(probabilities.no.value) + Number(probabilities.yes.value)) < 100) ? 100 - probabilities.no.value - probabilities.yes.value : 0;
  const percentSum = Number(probabilities.no.value || 0) + Number(probabilities.yes.value || 0) + (allow_draw ? drawPercent : 0);

  let yesAmount;
  let noAmount;
  let drawAmount;

  let yesOdds = '';
  let noOdds = '';
  let drawOdds = '';

  if (isFirstIssue) {
    yesAmount = Math.floor(Math.sqrt(amountInPenniesWithoutFee ** 2 * (probabilities.yes.value / 100 || 0)));
    noAmount = Math.floor(Math.sqrt(amountInPenniesWithoutFee ** 2 * (probabilities.no.value / 100 || 0)));
    drawAmount = allow_draw ? Math.floor(Math.sqrt(amountInPenniesWithoutFee ** 2 * (drawPercent / 100 || 0))) : 0;

    const new_den = Math.sqrt(yesAmount * yesAmount + noAmount * noAmount + drawAmount * drawAmount);

    if (reserveAmount.valid && reserveAmount.value && Number(reserveAmount.value) > 0 && percentSum === 100) {
      yesOdds = (Number(probabilities.yes.value) !== 0) ? `odds: x${+((amountInPenniesWithoutFee / yesAmount) / (yesAmount / new_den)).toFixed(4)}` : '';
      noOdds = (Number(probabilities.no.value) !== 0) ? `odds: x${+((amountInPenniesWithoutFee / noAmount) / (noAmount / new_den)).toFixed(4)}` : '';
      drawOdds = (Number(drawPercent) !== 0) ? `odds: x${+((amountInPenniesWithoutFee / drawAmount) / (drawAmount / new_den)).toFixed(4)}` : '';
    }

  } else {
    const ratio = (amountInPenniesWithoutFee + reserve) / reserve;

    yesAmount = Math.ceil(ratio * supply_yes - supply_yes);
    noAmount = Math.ceil(ratio * supply_no - supply_no);
    drawAmount = Math.ceil(ratio * supply_draw - supply_draw);
  }

  const yesReserveAmount = yesAmount * getMarketPriceByType(stateVars, 'yes');
  const noReserveAmount = noAmount * getMarketPriceByType(stateVars, 'no');
  const drawReserveAmount = drawAmount * getMarketPriceByType(stateVars, 'draw');

  const handleChangeProbability = (ev, type) => {
    const value = ev.target.value;

    if (value === "") {
      setProbabilities((p) => ({
        ...p, [type]: {
          value,
          valid: true
        }
      }))
    } else {
      if (f(value) <= 2) {

        if (allow_draw) {
          setProbabilities((p) => ({
            ...p, [type]: {
              value,
              valid: isNumber(Number(value)) && Number(value) >= 0 && Number(value) <= 100
            }
          }))
        } else {
          if (type === 'yes') {
            setProbabilities((p) => ({
              ...p, [type]: {
                value,
                valid: isNumber(Number(value)) && Number(value) >= 0 && Number(value) <= 100
              },
              'no': {
                value: value < 100 ? 100 - value : 0,
                valid: true
              }
            }))
          } else if (type === 'no') {
            setProbabilities((p) => ({
              ...p, [type]: {
                value,
                valid: isNumber(Number(value)) && Number(value) >= 0 && Number(value) <= 100
              },
              'yes': {
                value: value < 100 ? 100 - value : 0,
                valid: true
              }
            }))
          }
        }
      }
    }
  }

  useEffect(() => {
    setFromToken({ asset: reserve_asset, decimals: reserve_decimals, symbol: reserve_symbol, network: "Obyte", foreign_asset: 'no' })
  }, [address, reserve_asset]);

  const handleChangeFromToken = (strValue) => {
    const [network, asset, decimals, foreign_asset, ...symbol] = strValue.split("__");

    setFromToken({ asset, decimals: Number(decimals || 0), symbol: symbol.join("__"), network, foreign_asset });

    if (reserveAmount.valid && reserveAmount.value) {
      setReserveAmount((a) => ({ ...a, value: +Number(a.value).toFixed(decimals) }))
    }
  }

  useEffect(async () => {
    if (fromToken && fromToken.network !== "Obyte" && reserveAmount.value && reserveAmount.valid && Number(reserveAmount.value) > 0) {
      try {
        const res = await estimateOutput({
          amount: Number(reserveAmount.value),
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
        console.log('estimateOutput error',)
      }

    } else if (estimate) {
      setEstimate(0);
    }
  }, [fromToken, reserveAmount])

  useEffect(() => {
    if (reserveAmount.valid && reserveAmount.value && (fromToken?.network === "Obyte" || estimate)) {
      const result = getExchangeResult(stateVars, params, yesAmount, noAmount, drawAmount);

      if (result) {
        setMeta(result);
      }

    } else {
      setMeta(null);
    }
  }, [reserveAmount, address, stateVars, fromToken, estimate, yesAmount, noAmount, drawAmount]);

  useEffect(() => {
    if (meta) {
      const data = [
        { type: 'YES', token: 'yes', value: +Number(amountInPenniesWithoutFee * probabilities.yes.value / 100 / 10 ** reserve_decimals).toFixed(reserve_decimals) },
        { type: 'NO', token: 'no', value: +Number(amountInPenniesWithoutFee * probabilities.no.value / 100 / 10 ** reserve_decimals).toFixed(reserve_decimals) },
      ];

      if (allow_draw) {
        data.push({ type: 'DRAW', token: 'draw', value: +Number(amountInPenniesWithoutFee * drawPercent / 100 / 10 ** reserve_decimals).toFixed(reserve_decimals) });
      }

      setDataForPie(data);
    } else {
      setDataForPie([]);
    }
  }, [stateVars, supply_yes, supply_no, supply_draw, amountInPenniesWithoutFee, reserveAmount, meta, probabilities]);

  let data = { add_liquidity: 1 };

  if (isFirstIssue) {
    data.yes_amount_ratio = probabilities.yes.value / 100;
    data.no_amount_ratio = probabilities.no.value / 100;
  }

  const link = generateLink({
    aa: address, asset: reserve_asset, is_single: true, amount: amountInPennies, data, from_address: walletAddress || undefined
  });


  const valid = meta && amountInPenniesWithoutFee && amountInPenniesWithoutFee > 0 && reserveAmount.valid && (percentSum === 100 || !isFirstIssue);

  const handleChangeReserveAmount = (ev) => {
    const value = ev.target.value;

    if (value === "") {
      setReserveAmount({ value: undefined, valid: true });
    } else {
      if (f(value) <= fromToken.decimals && value <= 1e9) {
        setReserveAmount({ value, valid: !isNaN(Number(value)) && Number(value) > minAmount });
      }
    }
  }

  const pieConfig = {
    angleField: 'value',
    colorField: 'type',
    legend: false,
    animation: false,
    autoFit: true,
    label: {
      type: 'inner',
      content: (item) => item.percent > 0.1 ? `${haveTeamNames ? (item.type === 'YES' ? yes_team : (item.type === 'NO' ? no_team : 'DRAW')) : item.type + ' tokens'}
      ${item.value} ${reserve_symbol}
      ${Number(item.percent * 100).toPrecision(4)}% 
      ` : '',
      style: {
        fontSize: 12,
        textAlign: "center",
        fill: "#fff",
        fontWeight: 'bold'
      },
      autoHide: true,
      autoRotate: false
    },
    appendPadding: 10,
    radius: 0.8,
    renderer: "svg",
    color: (item) => {
      if (item.type === 'YES') {
        return appConfig.YES_COLOR;
      } else if (item.type === 'NO') {
        return appConfig.NO_COLOR;
      } else {
        return appConfig.DRAW_COLOR;
      }
    },
    tooltip: {
      customContent: (_, items) => {
        return <div style={{ padding: 5, textAlign: 'center' }}>Invested capital in {haveTeamNames ? (items[0]?.data.type === 'YES' ? yes_team : (items[0]?.data.type === 'NO' ? no_team : 'DRAW')) : items[0]?.data.type + ' tokens'}:
          <div style={{ marginTop: 5 }}>{items[0]?.data.value} <small>{reserve_symbol}</small></div></div>
      }
    },
    pieStyle: {
      stroke: "#1F1F1E",
    }
  }

  useEffect(()=> {
    if (bookmaker_yes_odds && bookmaker_no_odds && bookmaker_draw_odds && isFirstIssue) {
      const sum = (1 / bookmaker_yes_odds + 1 / bookmaker_no_odds + 1 / bookmaker_draw_odds);
  
      const yes_odds_percentage = (1 / bookmaker_yes_odds) / sum * 100;
      const no_odds_percentage = (1 / bookmaker_no_odds) / sum * 100;

      setProbabilities({
        yes: {value: floorDecimals(yes_odds_percentage, 2), valid: true},
        no: {value: floorDecimals(no_odds_percentage, 2), valid: true},
      })
    }
  }, [bookmaker_yes_odds, bookmaker_no_odds, bookmaker_draw_odds, isFirstIssue, visible])
  
  if (!fromToken) return <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
    <Spin size="large" />
  </div>

  const counterstake_assistant_fee = fromToken.network !== "Obyte" ? reserveAmount.value * 0.01 : 0;
  const metamaskInstalled = window.ethereum;

  const buyViaEVM = async () => {
    try {
      await transferEVM2Obyte({
        amount: Number(reserveAmount.value),
        src_network: fromToken.network,
        src_asset: fromToken.asset,
        dst_network: 'Obyte',
        dst_asset: reserve_asset,
        recipient_address: address,
        data: { ...data, to: walletAddress },
        assistant_reward_percent: 1,
        testnet: appConfig.ENVIRONMENT === 'testnet',
        obyteClient: client,
        oswap_change_address: walletAddress
      });

      ReactGA.event({
        category: "Trade",
        action: "Add liquidity CS",
        label: address
      });

    } catch (e) {
      console.error(e);

      notification.error({
        message: t("common.errors.transaction_fail", "The transaction would fail. Please check that you have sufficient balance"),
        placement: "top"
      })
    }
  }

  const probabilitiesAreValid = !isFirstIssue || (probabilities.yes.value && (!allow_draw || probabilities.no.value));

  const addLiquidity = () => {
    ReactGA.event({
      category: "Trade",
      action: "Add liquidity",
      label: address
    });
  }

  return <Form size="small" layout="vertical">
    <Row gutter={8}>
      <Col md={{ span: 8 }} xs={{ span: 24 }}>
        <Form.Item>
          <Input size="large" value={reserveAmount.value} placeholder="Amount" onChange={handleChangeReserveAmount} />
        </Form.Item>
      </Col>

      <Col md={{ span: 16 }} xs={{ span: 24 }}>
        <Form.Item>
          <Select size="large" showSearch value={`${fromToken.network}__${fromToken.asset}__${fromToken.decimals}__${fromToken.foreign_asset}__${fromToken.symbol}`} onChange={handleChangeFromToken}>
            <Select.OptGroup label="Obyte">
              <Select.Option value={`Obyte__${reserve_asset}__${reserve_decimals}__no__${reserve_symbol}`}>{reserve_symbol}</Select.Option>
            </Select.OptGroup>
            {Object.entries(tokensByNetwork).map(([network, items]) => (
              <Select.OptGroup label={network} key={`network-${network}`}>
                {items.map((item) => <Select.Option value={`${network}__${item.home_asset}__${item.home_asset_decimals}__${item.foreign_asset}__${item.home_symbol}`} key={`${item.home_network} ${item.home_asset} ${item.bridge_id}`}>
                  {item.home_symbol}
                </Select.Option>)}
              </Select.OptGroup>))}
          </Select>
        </Form.Item>
      </Col>
    </Row>

    {isFirstIssue && <>
      <p>{t("forms.liquidity.outcome_probabilities", "Outcome probabilities")}</p>
      <Row gutter={8}>
        <Col md={{ span: allow_draw ? 8 : 12 }} xs={{ span: 24 }}>
          <Form.Item extra={<span style={{ color: appConfig.YES_COLOR }}>{yesOdds}</span>} label={<small>{haveTeamNames ? `${yes_team}` : 'YES'}</small>}>
            <Input size="large" value={probabilities.yes.value} placeholder="ex. 65" suffix='%' onChange={(ev) => handleChangeProbability(ev, 'yes')} />
          </Form.Item>
        </Col>

        {allow_draw && <Col md={{ span: 8 }} xs={{ span: 24 }}>
          <Form.Item extra={<span style={{ color: appConfig.DRAW_COLOR }}>{drawOdds}</span>} label={<small>DRAW</small>}>
            <Input size="large" disabled={true} value={floorDecimals(drawPercent, 2)} placeholder="ex. 20" suffix='%' />
          </Form.Item>
        </Col>}

        <Col md={{ span: allow_draw ? 8 : 12 }} xs={{ span: 24 }}>
          <Form.Item extra={<span style={{ color: appConfig.NO_COLOR }}>{noOdds}</span>} label={<small>{haveTeamNames ? `${no_team}` : 'NO'}</small>}>
            <Input size="large" value={probabilities.no.value} placeholder={`ex. ${allow_draw ? 15 : 35}`} suffix='%' onChange={(ev) => handleChangeProbability(ev, 'no')} />
          </Form.Item>
        </Col>
      </Row>
      {bookmaker_yes_odds !== null && bookmaker_no_odds !== null && bookmaker_draw_odds !== null ? <Typography.Text type="secondary">{t("forms.liquidity.suggested_probabilities", "Suggested probabilities are based on the current bookmaker odds")}</Typography.Text> : null}
    </>
    }

    {meta && <Form.Item>
      {!isFirstIssue && <div style={{ marginBottom: 15 }}>
        <b>{t("forms.liquidity.net_amounts", "Net added amounts")}: </b>
        <div style={{ color: appConfig.YES_COLOR }}>
          {haveTeamNames ? yes_team : 'YES'}: {Number(isFirstIssue ? amountInPenniesWithoutFee * probabilities.yes.value / 100 / 10 ** reserve_decimals : yesReserveAmount / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol} {!isFirstIssue && <>({Number((yesReserveAmount / amountInPenniesWithoutFee) * 100).toFixed(2)}%)</>}
        </div>

        <div style={{ color: appConfig.NO_COLOR }}>
          {haveTeamNames ? no_team : 'NO'}: {Number(isFirstIssue ? amountInPenniesWithoutFee * probabilities.no.value / 100 / 10 ** reserve_decimals : noReserveAmount / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol} {!isFirstIssue && <>({Number((noReserveAmount / amountInPenniesWithoutFee) * 100).toFixed(2)}%)</>}
        </div>

        {allow_draw && <div style={{ color: appConfig.DRAW_COLOR }}>
          {haveTeamNames ? 'Draw' : 'DRAW'}: {Number(isFirstIssue ? amountInPenniesWithoutFee * drawPercent / 100 / 10 ** reserve_decimals : drawReserveAmount / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}  {!isFirstIssue && <>({Number((drawReserveAmount / amountInPenniesWithoutFee) * 100).toFixed(2)}%)</>}
        </div>}
      </div>}

      <div className="metaWrap">
        {meta?.issue_fee !== 0 && needsIssueFeeForLiquidity ? <div><span className="metaLabel">{t("meta_trans.issue_fee", "Issue fee")}</span>: {+Number(meta.issue_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div> : null}
        {(fromToken.network !== "Obyte" && estimate) ? <div style={{ marginTop: 20 }}>
          {counterstake_assistant_fee ? <div><span className="metaLabel"><Trans i18nKey="meta_trans.cs_fee"><a href="https://counterstake.org" target="_blank" rel="noopener">Counterstake</a> fee</Trans></span>: {+Number(counterstake_assistant_fee).toFixed(fromToken.decimals)} {fromToken.symbol}</div> : null}
          {(fromToken.network !== "Obyte" && estimate && fromToken.foreign_asset !== reserve_asset) ? <div><span className="metaLabel"><Trans i18nKey="meta_trans.oswap_rate"><a href="https://oswap.io" target="_blank" rel="noopener">Oswap</a> rate</Trans></span>: 1 {fromToken.symbol} ≈ {+Number(estimate / (reserveAmount.value * 0.99)).toFixed(reserve_decimals)} {reserve_symbol}</div> : null}
        </div> : null}
      </div>

      {isFirstIssue && percentSum !== 100 && <div style={{ marginTop: 20 }}>
        <Alert type="error" message={t("forms.liquidity.sum_100", "The percentage sum must be equal to 100")} />
      </div>}
    </Form.Item>
    }

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
      {fromToken.network === "Obyte"
        ? <QRButton size="large" type="primary" disabled={!valid || !probabilitiesAreValid} onClick={addLiquidity} href={link}>{t("forms.common.send", "Send")}{(reserveAmount.valid && reserveAmount.value) ? ` ${reserveAmount.value} ${reserve_symbol}` : ''}</QRButton>
        : <Button size="large" type="primary" onClick={buyViaEVM} disabled={!metamaskInstalled || !walletAddress || !reserveAmount.valid || !Number(reserveAmount.value) || estimateError || !probabilitiesAreValid}>{t("forms.common.send", "Send")}{(reserveAmount.valid && reserveAmount.value) ? ` ${reserveAmount.value}` : ''} {fromToken.symbol}</Button>}
    </Form.Item>

    {isFirstIssue && valid && <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '90%' }}>
        <Pie data={dataForPie} {...pieConfig} />
      </div>
    </div>}
  </Form >
}