import { Col, Form, Input, Row, Select, Typography } from "antd";
import { FormLabel } from "components/FormLabel/FormLabel";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveCreationOrder, selectReserveAssets } from "store/slices/settingsSlice";
import QRButton from "obyte-qr-button";
import { Img } from "react-image";
import moment from "moment";

import appConfig from "appConfig";
import { paramList } from "./CreateForm";
import { generateLink } from "utils";

import styles from "components/PredictionList/PredictionItem.module.css";

export const CreateNowForm = ({ feed_name, end_of_trading_period, expect_datafeed_value, yes_team_id, no_team_id, yes_team, no_team }) => {
  const oracle = appConfig.CATEGORIES.sport.oracles[0].address;

  const [issueFee, setIssueFee] = useState({ value: paramList.issue_fee.initValue !== undefined ? paramList.issue_fee.initValue : '', valid: paramList.issue_fee.initValue !== undefined });
  const [redeemFee, setRedeemFee] = useState({ value: paramList.redeem_fee.initValue !== undefined ? paramList.redeem_fee.initValue : '', valid: paramList.redeem_fee.initValue !== undefined });
  const [arbProfitFee, setArbProfitFee] = useState({ value: paramList.arb_profit_fee.initValue !== undefined ? paramList.arb_profit_fee.initValue : '', valid: paramList.arb_profit_fee.initValue !== undefined });
  const [reserveAsset, setReserveAsset] = useState({ value: paramList.reserve_asset.initValue !== undefined ? paramList.reserve_asset.initValue : '', valid: true });

  const reserveAssets = useSelector(selectReserveAssets);

  const dispatch = useDispatch();

  const handleChangeValue = (evOrValue, type) => {
    const value = type === 'reserve_asset' ? evOrValue : evOrValue.target.value;
    const valid = paramList[type].validator ? paramList[type].validator(value) : true;

    if (type === 'issue_fee') {
      setIssueFee({ value, valid });
    } else if (type === 'redeem_fee') {
      setRedeemFee({ value, valid });
    } else if (type === 'arb_profit_fee') {
      setArbProfitFee({ value, valid });
    } else if (type === 'reserve_asset') {
      setReserveAsset({ value, valid });
    }
  }

  const data = {
    oracle,
    end_of_trading_period,
    feed_name,
    comparison: '==',
    datafeed_value: expect_datafeed_value,
    waiting_period_length: 5 * 24 * 3600, // 5 days
    issue_fee: issueFee.value / 100,
    redeem_fee: redeemFee.value / 100,
    arb_profit_tax: arbProfitFee.value / 100,
    allow_draw: 1,
    datafeed_draw_value: 'draw',
    reserve_asset: reserveAsset.value,
    reserve_decimals: reserveAssets[reserveAsset.value].decimals
  }

  const create = () => {
    dispatch(saveCreationOrder({...data, yes_team, no_team}));
  }

  const link = generateLink({ amount: 2e4, data, aa: appConfig.FACTORY_AA });

  return <Form layout="vertical">

    <Row gutter={8} align='middle' style={{ marginBottom: 20 }}>
      <Col sm={{ span: 8 }} xs={{ span: 24 }} style={{ textAlign: 'center' }}>
        <Img src={[`https://crests.football-data.org/${yes_team_id}.png`, `https://crests.football-data.org/${yes_team_id}.svg`]} className={styles.crests} />
        <div className={styles.teamWrap}>
          <Typography.Text style={{ color: appConfig.YES_COLOR, textOverflow: 'ellipsis', display: 'block' }} ellipsis={true}><small>{yes_team}</small></Typography.Text>
        </div>
      </Col>

      <Col sm={{ span: 8 }} xs={{ span: 24 }} style={{ textAlign: 'center' }} className={styles.draw}>
        <b style={{ fontSize: 24 }}>VS</b>
        <div>
          <small>{moment.unix(end_of_trading_period).format('lll')}</small>
        </div>
      </Col>

      <Col sm={{ span: 8 }} xs={{ span: 24 }} style={{ textAlign: 'center' }}>
        <Img
          src={[`https://crests.football-data.org/${no_team_id}.png`, `https://crests.football-data.org/${no_team_id}.svg`]}
          className={styles.crests}
        />
        <div className={styles.teamWrap}>
          <Typography.Text style={{ color: appConfig.NO_COLOR, textOverflow: 'ellipsis', display: 'block' }} ellipsis={true}><small>{no_team}</small></Typography.Text>
        </div>
      </Col>
    </Row>

    <Form.Item validateStatus='success' label={<FormLabel info={paramList.reserve_asset.description}>Reserve asset</FormLabel>}>
      <Select onChange={(ev) => handleChangeValue(ev, 'reserve_asset')} size="large" value={reserveAsset.value}>
        {!reserveAssets && <Select.Option value='base'>GBYTE</Select.Option>}
        {reserveAssets && Object.entries(reserveAssets).map(([asset, { symbol }]) => <Select.Option key={asset} value={asset}>{symbol}</Select.Option>)}
      </Select>
    </Form.Item>

    <Row gutter={16}>
      <Col xs={{ span: 24 }} md={{ span: 24 }}>
        <Form.Item validateStatus={issueFee.value !== '' ? (issueFee.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.issue_fee.description}>Issue fee</FormLabel>}>
          <Input size="large" suffix={<span>%</span>} placeholder={paramList.issue_fee.placeholder} value={issueFee.value} onChange={(ev) => handleChangeValue(ev, 'issue_fee')} />
        </Form.Item>
      </Col>

      <Col xs={{ span: 24 }} md={{ span: 24 }}>
        <Form.Item validateStatus={redeemFee.value !== '' ? (redeemFee.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.redeem_fee.description}>Redeem fee</FormLabel>}>
          <Input size="large" suffix={<span>%</span>} placeholder={paramList.redeem_fee.placeholder} value={redeemFee.value} onChange={(ev) => handleChangeValue(ev, 'redeem_fee')} />
        </Form.Item>
      </Col>

      <Col xs={{ span: 24 }} md={{ span: 24 }}>
        <Form.Item validateStatus={arbProfitFee.value !== '' ? (arbProfitFee.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.arb_profit_fee.description}>Arbitrageur profit fee</FormLabel>}>
          <Input size="large" suffix={<span>%</span>} placeholder={paramList.arb_profit_fee.placeholder} value={arbProfitFee.value} onChange={(ev) => handleChangeValue(ev, 'arb_profit_fee')} />
        </Form.Item>
      </Col>
    </Row>

    <QRButton href={link} type="primary" disabled={!issueFee.valid || !redeemFee.valid || !arbProfitFee.valid} onClick={create} size="large">Create</QRButton>
  </Form>
}