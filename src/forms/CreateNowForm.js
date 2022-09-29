import { Col, Form, Input, Row, Select, Typography, DatePicker, AutoComplete } from "antd";
import { FormLabel } from "components/FormLabel/FormLabel";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveCreationOrder, selectReserveAssets } from "store/slices/settingsSlice";
import QRButton from "obyte-qr-button";
import { Img } from "react-image";
import moment from "moment";
import { debounce, isNaN } from "lodash";
import ReactGA from "react-ga";
import { useTranslation } from "react-i18next";

import { getParamList } from "./CreateForm";
import { generateLink, generateTextEvent } from "utils";

import styles from "components/PredictionList/PredictionItem.module.css";
import client from "services/obyte";

import appConfig from "appConfig";

const f = (x) => (~(x + "").indexOf(".") ? (x + "").split(".")[1].length : 0);

export const CreateNowForm = ({ feed_name, event_date, expect_datafeed_value, yes_team_id, no_team_id, yes_team, no_team, oracle, expect_comparison, waiting_period_length, quiet_period = 0 }) => {
  const paramList = getParamList();

  const [issueFee, setIssueFee] = useState({ value: paramList.issue_fee.initValue !== undefined ? paramList.issue_fee.initValue : '', valid: paramList.issue_fee.initValue !== undefined });
  const [redeemFee, setRedeemFee] = useState({ value: paramList.redeem_fee.initValue !== undefined ? paramList.redeem_fee.initValue : '', valid: paramList.redeem_fee.initValue !== undefined });
  const [arbProfitFee, setArbProfitFee] = useState({ value: paramList.arb_profit_fee.initValue !== undefined ? paramList.arb_profit_fee.initValue : '', valid: paramList.arb_profit_fee.initValue !== undefined });
  const [reserveAsset, setReserveAsset] = useState({ value: paramList.reserve_asset.initValue !== undefined ? paramList.reserve_asset.initValue : '', valid: true });
  const [comparison, setComparison] = useState({ value: expect_comparison || '>', valid: true });

  const [eventDate, setEventDate] = useState({ value: event_date, valid: true });
  const [feedName, setFeedName] = useState({ value: feed_name, valid: true });

  const [customOracle, setCustomOracle] = useState({ value: oracle, valid: true });
  const [currentFeedValue, setCurrentFeedValue] = useState({ value: undefined, valid: true, loading: true });

  const [datafeedValue, setDataFeedValue] = useState({ value: expect_datafeed_value, valid: true });
  const [quietPeriod, setQuietPeriod] = useState({ value: +Number(quiet_period / 3600).toFixed(6), valid: true });
  const [waitingPeriodLength, setWaitingPeriodLength] = useState({ value: +Number(waiting_period_length / (24 * 3600)).toFixed(6), valid: true });

  const dateFilter = (date) => {
    return date.unix() < moment().hours(0).minutes(0).seconds(0).milliseconds(0).unix()
  }

  const reserveAssets = useSelector(selectReserveAssets);

  const dispatch = useDispatch();
  const { t } = useTranslation();
  useEffect(() => {
    handleChangeFeedName(feed_name);
  }, [feed_name]);

  const handleChangeValue = (evOrValue, type) => {
    let value;

    if (['reserve_asset', 'feed_name', 'comparison'].includes(type)) {
      value = evOrValue;
    } else if (type === 'event_date') {
      value = evOrValue.utc().unix();
    } else {
      value = evOrValue.target.value;
    }

    const valid = paramList[type].validator ? paramList[type].validator(value) : true;

    if (type === 'issue_fee') {
      setIssueFee({ value, valid });
    } else if (type === 'redeem_fee') {
      setRedeemFee({ value, valid });
    } else if (type === 'arb_profit_fee') {
      setArbProfitFee({ value, valid });
    } else if (type === 'reserve_asset') {
      setReserveAsset({ value, valid });
    } else if (type === 'event_date') {
      setEventDate({ value, valid });
    } else if (type === 'datafeed_value' && f(value) <= 9) {
      setDataFeedValue({ value, valid: valid && !isNaN(Number(value)) });
    } else if (type === 'waiting_period_length' && f(value) <= 7) {
      setWaitingPeriodLength({ value, valid });
    } else if (type === 'quiet_period') {
      setQuietPeriod({ value, valid });
    } else if (type === 'feed_name') {
      setFeedName({ value, valid });
    } else if (type === 'comparison') {
      setComparison({ value, valid });
    }
  }

  const type = appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === oracle) ? 'sport' : 'currency';

  const data = {
    oracle: type === 'sport' ? oracle : customOracle.value,
    event_date: moment.unix(type === 'sport' ? event_date : eventDate.value).utc().format('YYYY-MM-DDTHH:mm:ss'),
    feed_name: String(type === 'sport' ? feed_name : feedName.value).toUpperCase(),
    comparison: type === 'sport' ? '==' : comparison.value,
    datafeed_value: type === 'sport' ? expect_datafeed_value : datafeedValue.value,
    waiting_period_length: type === 'sport' ? 3 * 24 * 3600 : Math.ceil(waitingPeriodLength.value * 24 * 3600),
    issue_fee: issueFee.value / 100,
    redeem_fee: redeemFee.value / 100,
    arb_profit_tax: arbProfitFee.value / 100,
    allow_draw: type === 'sport' ? 1 : undefined,
    datafeed_draw_value: type === 'sport' ? 'draw' : undefined,
    reserve_asset: reserveAsset.value,
    quiet_period: (type === 'sport' ? 0 : quietPeriod.value) * 3600
  }

  const create = () => {
    dispatch(saveCreationOrder({ ...data, yes_team, no_team, reserve_decimals: reserveAssets[reserveAsset.value].decimals }));

    ReactGA.event({
      category: "Create",
      action: `Create ${type} market`,
      label: data.oracle
    });
  }

  const link = generateLink({ amount: 2e4, data, aa: appConfig.FACTORY_AAS[appConfig.FACTORY_AAS.length - 1] });

  let event;

  if (type !== 'sport') {
    event = generateTextEvent({ oracle: customOracle.value, event_date: eventDate.valid ? eventDate.value : event_date, feed_name: type === 'sport' ? feed_name : feedName.value, datafeed_value: datafeedValue.valid ? datafeedValue.value : expect_datafeed_value, comparison: type === 'sport' ? '==' : comparison.value })
  }

  let dataFeedCurrency = '';

  if (type === 'currency') {
    if (feedName.value) {
      const split = String(feedName.value)?.split("_");

      if (split.length === 2) {
        dataFeedCurrency = split[split.length - 1];
      }
    }
  }

  const handleChangeFeedName = async (value) => {
    handleChangeValue(String(value).toUpperCase(), 'feed_name');
    setCurrentFeedValue({ value: undefined, valid: false, loading: true });

    const oracle = appConfig.CATEGORIES.currency.oracles.find(({ feedNames }) => feedNames.includes(value));

    if (oracle) {
      setCustomOracle({ value: oracle.address, valid: true })
    }

    getDataFeed(String(value, oracle?.address));
  }

  const currencyFeedNameList = useMemo(() => {
    const feedNameList = [];
    appConfig.CATEGORIES.currency.oracles.forEach(({ feedNames }) => feedNameList.push(...feedNames));

    return feedNameList;
  }, []);

  const getDataFeed = debounce(async (feed_name, foundOracle) => {
    let value = undefined;
    let oracle = foundOracle;

    if (foundOracle) {
      const data = await client.api.getDataFeed({ oracles: [foundOracle], feed_name: String(feed_name).toUpperCase(), ifnone: false });
      if (data) {
        value = data;
      }
    } else {
      for (let { address } of appConfig.CATEGORIES.currency.oracles) {

        const data = await client.api.getDataFeed({ oracles: [address], feed_name: String(feed_name).toUpperCase(), ifnone: false });

        if (data) {
          value = data;
          oracle = address;
          break;
        };
      }
    }

    setCustomOracle({ value: oracle, valid: !!oracle });
    setCurrentFeedValue({ value, valid: true, loading: false });
  }, 1200);

  return <Form layout="vertical">
    {type === 'sport' ? <Row gutter={8} align='middle' style={{ marginBottom: 20 }}>
      <Col sm={{ span: 8 }} xs={{ span: 24 }} style={{ textAlign: 'center' }}>
        <Img src={[`https://crests.football-data.org/${yes_team_id}.svg`, `https://crests.football-data.org/${yes_team_id}.png`]} className={styles.crests} />
        <div className={styles.teamWrap}>
          <Typography.Text style={{ color: appConfig.YES_COLOR, textOverflow: 'ellipsis', display: 'block' }} ellipsis={true}><small>{yes_team}</small></Typography.Text>
        </div>
      </Col>

      <Col sm={{ span: 8 }} xs={{ span: 24 }} style={{ textAlign: 'center' }} className={styles.draw}>
        <b style={{ fontSize: 24 }}>VS</b>
        <div>
          <small>{moment.unix(event_date).format('lll')}</small>
        </div>
      </Col>

      <Col sm={{ span: 8 }} xs={{ span: 24 }} style={{ textAlign: 'center' }}>
        <Img
          src={[`https://crests.football-data.org/${no_team_id}.svg`, `https://crests.football-data.org/${no_team_id}.png`]}
          className={styles.crests}
        />
        <div className={styles.teamWrap}>
          <Typography.Text style={{ color: appConfig.NO_COLOR, textOverflow: 'ellipsis', display: 'block' }} ellipsis={true}><small>{no_team}</small></Typography.Text>
        </div>
      </Col>
    </Row> : <Row style={{ minHeight: 77 }}>
      <Typography.Title level={5}>{event}</Typography.Title>
    </Row>}

    <Row gutter={16}>
      {type === 'currency' && <>
        <Col xs={{ span: 24 }} md={{ span: 24 }}>
          <Row gutter={8}>
            <Col flex="150px" style={{ fontSize: 18 }}>
              <div style={{ height: 38, display: 'flex', alignItems: 'center' }}><span>{t("forms.create_now.market_pair", "Market pair")}</span></div>
            </Col>

            <Col flex="auto">
              <Form.Item extra={currentFeedValue.loading ? 'Loading rate...' : <span style={{ color: currentFeedValue.value ? 'green' : 'red' }}>{currentFeedValue.value ? t("forms.create_now.current_rate", "Current rate: {{value}} {{symbol}}", { value: currentFeedValue.value, symbol: dataFeedCurrency }) : t("forms.create_now.no_pair", 'Pair not found')}</span>} validateStatus={feedName.value !== '' ? (feedName.valid ? 'success' : 'error') : undefined}>
                <AutoComplete
                  autoComplete="off"
                  placeholder={paramList.feed_name.placeholder}
                  value={feedName.value}
                  onSearch={handleChangeFeedName}
                  onSelect={handleChangeFeedName}
                  size="large"
                >
                  {currencyFeedNameList.map(feedName => <AutoComplete.Option key={feedName} value={feedName}>{feedName}</AutoComplete.Option>)}
                </AutoComplete>
              </Form.Item>
            </Col>
          </Row>
        </Col>

        <Col xs={{ span: 24 }} md={{ span: 24 }}>
          <Row gutter={8}>
            <Col flex="150px" style={{ fontSize: 18 }}>
              <div style={{ height: 38, display: 'flex', alignItems: 'center' }}><span>{t("forms.create_now.be_above", "to be above")}</span></div>
            </Col>
            <Col flex="auto">
              <Form.Item validateStatus={datafeedValue.value !== '' ? (datafeedValue.valid ? 'success' : 'error') : undefined} >
                <Input suffix={dataFeedCurrency} size="large" onChange={(ev) => handleChangeValue(ev, 'datafeed_value')} value={datafeedValue.value} placeholder={paramList.datafeed_value.placeholder} />
              </Form.Item>
            </Col>
          </Row>
        </Col>

        <Col xs={{ span: 24 }} md={{ span: 24 }}>
          <Row gutter={8}>
            <Col flex="150px" style={{ fontSize: 18 }}>
              <div style={{ height: 38, display: 'flex', alignItems: 'center' }}><span>{t("forms.create_now.on", "on")}</span></div>
            </Col>
            <Col flex="auto">
              <Form.Item help={eventDate.value !== '' && !eventDate.valid ? paramList.event_date.errorMessage : ''} validateStatus={eventDate.value !== '' ? (eventDate.valid ? 'success' : 'error') : undefined}>
                <DatePicker allowClear={false} showTime={true} disabledDate={dateFilter} size="large" format="YYYY-MM-DD HH:mm" showNow={false} value={moment.unix(eventDate.value)} onChange={(ev) => handleChangeValue(ev, 'event_date')} style={{ width: '100%' }} placeholder={paramList.event_date.placeholder} />
              </Form.Item>
            </Col>
          </Row>
        </Col>
      </>}

      <Col xs={{ span: 24 }} md={{ span: 24 }}>
        <Form.Item validateStatus='success' label={<FormLabel info={paramList.reserve_asset.description}>{paramList.reserve_asset.name}</FormLabel>}>
          <Select onChange={(ev) => handleChangeValue(ev, 'reserve_asset')} size="large" value={reserveAsset.value}>
            {!reserveAssets && <Select.Option value='base'>GBYTE</Select.Option>}
            {reserveAssets && Object.entries(reserveAssets).map(([asset, { symbol }]) => <Select.Option key={asset} value={asset}>{symbol}</Select.Option>)}
          </Select>
        </Form.Item>
      </Col>

      <Col xs={{ span: 24 }} md={{ span: 24 }}>
        <Form.Item validateStatus={issueFee.value !== '' ? (issueFee.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.issue_fee.description}>{paramList.issue_fee.name}</FormLabel>}>
          <Input size="large" suffix={<span>%</span>} placeholder={paramList.issue_fee.placeholder} value={issueFee.value} onChange={(ev) => handleChangeValue(ev, 'issue_fee')} />
        </Form.Item>
      </Col>

      <Col xs={{ span: 24 }} md={{ span: 24 }}>
        <Form.Item validateStatus={redeemFee.value !== '' ? (redeemFee.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.redeem_fee.description}>{paramList.redeem_fee.name}</FormLabel>}>
          <Input size="large" suffix={<span>%</span>} placeholder={paramList.redeem_fee.placeholder} value={redeemFee.value} onChange={(ev) => handleChangeValue(ev, 'redeem_fee')} />
        </Form.Item>
      </Col>

      <Col xs={{ span: 24 }} md={{ span: 24 }}>
        <Form.Item validateStatus={arbProfitFee.value !== '' ? (arbProfitFee.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.arb_profit_fee.description}>{paramList.arb_profit_fee.name}</FormLabel>}>
          <Input size="large" suffix={<span>%</span>} placeholder={paramList.arb_profit_fee.placeholder} value={arbProfitFee.value} onChange={(ev) => handleChangeValue(ev, 'arb_profit_fee')} />
        </Form.Item>
      </Col>

      {type !== 'sport' && <Col xs={{ span: 24 }} md={{ span: 24 }}>
        <Form.Item validateStatus={quietPeriod.value !== '' ? (quietPeriod.valid ? 'success' : 'error') : undefined} label={<FormLabel value={quietPeriod.valid ? quietPeriod.value : 0} info={paramList.quiet_period.description}>{paramList.quiet_period.name}</FormLabel>}>
          <Input size="large" placeholder={paramList.quiet_period.placeholder} onChange={(ev) => handleChangeValue(ev, 'quiet_period')} value={quietPeriod.value} />
        </Form.Item>
      </Col>}
    </Row>

    <QRButton href={link} type="primary" disabled={!issueFee.valid || !redeemFee.valid || !arbProfitFee.valid || (type === 'currency' && (!eventDate.valid || !datafeedValue.valid || !customOracle.valid || currentFeedValue.loading))} onClick={create} size="large">{t("forms.common.create", "Create")}</QRButton>
  </Form >
}