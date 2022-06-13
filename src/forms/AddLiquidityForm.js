import { Pie } from "@ant-design/plots";
import { Alert, Col, Form, Input, Row } from "antd";
import appConfig from "appConfig";
import { isNumber } from "lodash";
import QRButton from "obyte-qr-button";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars } from "store/slices/activeSlice";
import { selectWalletAddress } from "store/slices/settingsSlice";
import { generateLink, getExchangeResult, getMarketPriceByType } from "utils";

const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export const AddLiquidityForm = ({ yes_team, no_team }) => {
  const params = useSelector(selectActiveMarketParams);
  const stateVars = useSelector(selectActiveMarketStateVars);

  const walletAddress = useSelector(selectWalletAddress);
  const address = useSelector(selectActiveAddress);

  const [meta, setMeta] = useState(null);
  const [reserveAmount, setReserveAmount] = useState({ value: 0.1, valid: true });
  const [probabilities, setProbabilities] = useState({ yes: { value: '', valid: true }, no: { value: '', valid: true }, draw: { value: '', valid: true } })
  const [dataForPie, setDataForPie] = useState([]);

  const { allow_draw, reserve_asset, reserve_decimals, reserve_symbol } = params;
  const { supply_yes = 0, supply_no = 0, supply_draw = 0, reserve = 0 } = stateVars;

  const network_fee = reserve_asset === 'base' ? 1e4 : 0;
  const minAmount = reserve_asset === 'base' ? network_fee / 1e9 : 1 / 10 ** reserve_decimals
  const haveTeamNames = yes_team && no_team;
  const isFirstIssue = supply_yes + supply_no + supply_draw === 0;

  const amountInPennies = Math.ceil(reserveAmount.value * 10 ** reserve_decimals);
  const amountInPenniesWithoutFee = amountInPennies * (1 - params.issue_fee) - network_fee;

  const drawPercent = probabilities.yes.valid && probabilities.no.valid && ((Number(probabilities.no.value) + Number(probabilities.yes.value)) < 100) ? 100 - probabilities.no.value - probabilities.yes.value : 0;
  const percentSum = Number(probabilities.no.value || 0) + Number(probabilities.yes.value || 0) + (allow_draw ? drawPercent : 0);

  let yesAmount;
  let noAmount;
  let drawAmount;

  if (isFirstIssue) {
    yesAmount = Math.ceil(Math.sqrt(amountInPenniesWithoutFee ** 2 * (probabilities.yes.value / 100 || 0)));
    noAmount = Math.ceil(Math.sqrt(amountInPenniesWithoutFee ** 2 * (probabilities.no.value / 100 || 0)));
    drawAmount = allow_draw ? Math.ceil(Math.sqrt(amountInPenniesWithoutFee ** 2 * (drawPercent / 100 || 0))) : 0;
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
        setProbabilities((p) => ({
          ...p, [type]: {
            value,
            valid: isNumber(Number(value)) && Number(value) > 0 && Number(value) <= 100
          }
        }))
      }
    }
  }

  useEffect(() => {
    if (reserveAmount.valid && reserveAmount.value) {
      const result = getExchangeResult(stateVars, params, yesAmount, noAmount, drawAmount);

      if (result) {
        setMeta(result);
      }

    } else {
      setMeta(null);
    }
  }, [reserveAmount, address, stateVars]);

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

  const link = generateLink({
    aa: address, asset: reserve_asset, is_single: true, amount: amountInPennies, data: { yes_amount: yesAmount, no_amount: noAmount, draw_amount: allow_draw ? drawAmount : undefined }, from_address: walletAddress || undefined
  });


  const valid = meta && amountInPenniesWithoutFee && amountInPenniesWithoutFee > 0 && reserveAmount.valid && (percentSum === 100 || !isFirstIssue);

  const handleChangeReserveAmount = (ev) => {
    const value = ev.target.value;

    if (value === "") {
      setReserveAmount({ value: undefined, valid: true });
    } else {
      if (f(value) <= reserve_decimals) {
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
    appendPadding: 0,
    radius: 1,
    renderer: "svg",
    // theme: 'dark',
    color: (item) => {
      if (item.type === 'YES') {
        return appConfig.YES_COLOR;
      } else if (item.type === 'NO') {
        return appConfig.NO_COLOR
      } else {
        return appConfig.DRAW_COLOR
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

  return <Form size="small" layout="vertical">
    <Form.Item label="Reserve amount" tooltip="text">
      <Input size="large" value={reserveAmount.value} placeholder="Amount" suffix={reserve_symbol} onChange={handleChangeReserveAmount} />
    </Form.Item>

    {isFirstIssue && <>
      <p>Outcome probability</p>
      <Row gutter={8}>
        <Col md={{ span: allow_draw ? 8 : 12 }} xs={{ span: 24 }}>
          <Form.Item label={haveTeamNames ? `${yes_team}` : 'YES'}>
            <Input size="large" value={probabilities.yes.value} placeholder="ex. 65" suffix='%' onChange={(ev) => handleChangeProbability(ev, 'yes')} />
          </Form.Item>
        </Col>

        <Col md={{ span: allow_draw ? 8 : 12 }} xs={{ span: 24 }}>
          <Form.Item label={haveTeamNames ? `${no_team}` : 'NO'} >
            <Input size="large" value={probabilities.no.value} placeholder={`ex. ${allow_draw ? 15 : 35}`} suffix='%' onChange={(ev) => handleChangeProbability(ev, 'no')} />
          </Form.Item>
        </Col>

        {allow_draw && <Col md={{ span: 8 }} xs={{ span: 24 }}>
          <Form.Item label="DRAW">
            <Input size="large" disabled={true} value={drawPercent} placeholder="ex. 20" suffix='%' />
          </Form.Item>
        </Col>}
      </Row>
    </>
    }

    {
      meta && <Form.Item>
        {!isFirstIssue && <div style={{ marginBottom: 15 }}>
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
          {meta?.issue_fee !== 0 && <div><span className="metaLabel">Issue fee</span>: {+Number(meta.issue_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
          {meta?.redeem_fee !== 0 && <div><span className="metaLabel">Redeem fee</span>: {+Number(meta.redeem_fee / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
          {meta?.fee !== 0 && <div><span className="metaLabel">Total fee</span>: {+Number((meta.fee + network_fee) / 10 ** reserve_decimals).toFixed(reserve_decimals)} {reserve_symbol}</div>}
        </div>

        {isFirstIssue && percentSum !== 100 && <div style={{ marginTop: 20 }}><Alert type="error" message="The percentage sum must be equal to 100" /></div>}
      </Form.Item>
    }

    <Form.Item>
      <QRButton size="large" type="primary" disabled={!valid} href={link}>Send{(reserveAmount.valid && reserveAmount.value) ? ` ${reserveAmount.value} ${reserve_symbol}` : ''}</QRButton>
    </Form.Item>

    {isFirstIssue && valid && <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 280, height: 280 }}>
        <Pie data={dataForPie} {...pieConfig} />
      </div>
    </div>}
  </Form >
}