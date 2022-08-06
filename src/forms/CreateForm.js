import { Form, Input, Row, Col, Select, Switch, DatePicker, Alert } from "antd";
import { useState } from "react";
import obyte from "obyte";
import { isEmpty, isNumber } from "lodash";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import QRButton from "obyte-qr-button";
import ReactGA from "react-ga";

import { FormLabel } from "components/FormLabel/FormLabel";
import { saveCreationOrder, selectReserveAssets } from "store/slices/settingsSlice";
import appConfig from "appConfig";
import { PredictionItem } from "components/PredictionList/PredictionItem";
import { generateLink } from "utils";
import { Link } from "react-router-dom";

export const paramList = {
  allow_draw: {
    description: 'Whether to allow a 3rd outcome along with Yes and No. It’s common in some sports.',
  },
  oracle: {
    description: 'Address of the oracle that will post the result',
    placeholder: "MDKKPO375Q5M3GDET2X4H4ZNSO...",
    validator: (value) => {
      return value && obyte.utils.isValidAddress(value);
    },
    errorMessage: "Oracle address isn't valid."
  },
  feed_name: {
    description: 'Name of the data feed posted by the oracle',
    placeholder: "ETH_USD",
    validator: (value) => {
      return value && value.trim().length > 0
    }
  },
  reserve_asset: {
    initValue: 'base',
    description: 'The asset used to make bets on the outcomes. Profits are paid in the same asset.',
  },
  comparison: {
    initValue: '==',
    description: 'How the actual data feed value posted by the oracle will be compared against the “Data feed value”',
  },
  datafeed_value: {
    description: 'The benchmark value that will be compared with the actual data feed value',
    placeholder: "3251",
    validator: (value) => {
      return value && value.trim().length > 0
    }
  },
  datafeed_draw_value: {
    description: 'The draw value that will be compared with the actual data feed value',
    placeholder: "3250",
    validator: (value) => {
      return value && value.trim().length > 0
    }
  },
  event_date: {
    description: 'The future date when the event (such as a sports event, elections, or a measurement of a currency exchange rate) is supposed to happen. Trading stops at this date and hour.',
    placeholder: "Select a date",
    validator: (value) => {
      return value > moment().unix();
    },
    errorMessage: "You have chosen the past or present day."
  },
  waiting_period_length: {
    initValue: 5,
    description: 'How many days after the date of the event to wait for the oracle to post the result. If the oracle doesn’t post during this period, trading resumes.',
    placeholder: "5",
    validator: (value) => {
      return value && isNumber(Number(value)) && Number(value) >= 0
    }
  },
  issue_fee: {
    description: 'The fee charged when buying tokens. The tokens represent bets on specific outcomes. The fee is added to the pool and adds to the income of the holders of the winning token.',
    placeholder: "1",
    initValue: 1,
    validator: (value) => {
      return value && isNumber(Number(value)) && Number(value) >= 0 && Number(value) < 100
    }
  },
  redeem_fee: {
    description: 'The fee charged when selling tokens while trading is active (normally, before the event). Like the issue fee, the fee is added to the pool and adds to the income of the holders of the winning token.',
    placeholder: "2",
    initValue: 2,
    validator: (value) => {
      return value && isNumber(Number(value)) && Number(value) >= 0 && Number(value) < 100
    }
  },
  arb_profit_fee: {
    description: 'The fee charged from the implied arbitrageur profit, assuming they buy or sell tokens to arbitrage against other markets where the same event is traded. The implied profit is proportional to the price change caused by the trade. Like other fees, this fee is added to the pool and adds to the income of the holders of the winning token.',
    placeholder: "90",
    initValue: 90,
    validator: (value) => {
      return value && isNumber(Number(value)) && Number(value) >= 0 && Number(value) < 100
    }
  },
  quiet_period: {
    initValue: 0,
    description: (value) => `Trading stops ${value} hours before the event`,
    placeholder: "0",
    validator: (value) => {
      return value && isNumber(Number(value)) && Number(value) >= 0
    }
  },
}

export const CreateForm = () => {
  // states
  const [allowDraw, setAllowDraw] = useState({ value: paramList.allow_draw.initValue !== undefined ? paramList.allow_draw.initValue : '', valid: true });
  const [oracle, setOracle] = useState({ value: paramList.oracle.initValue !== undefined ? paramList.oracle.initValue : '', valid: paramList.oracle.initValue !== undefined })
  const [feedName, setFeedName] = useState({ value: paramList.feed_name.initValue !== undefined ? paramList.feed_name.initValue : '', valid: paramList.feed_name.initValue !== undefined });
  const [reserveAsset, setReserveAsset] = useState({ value: paramList.reserve_asset.initValue !== undefined ? paramList.reserve_asset.initValue : '', valid: true });
  const [comparison, setComparison] = useState({ value: paramList.comparison.initValue !== undefined ? paramList.comparison.initValue : '', valid: true });
  const [datafeedValue, setDataFeedValue] = useState({ value: paramList.datafeed_value.initValue !== undefined ? paramList.datafeed_value.initValue : '', valid: paramList.datafeed_value.initValue !== undefined });
  const [datafeedDrawValue, setDataFeedDrawValue] = useState({ value: paramList.datafeed_draw_value.initValue !== undefined ? paramList.datafeed_draw_value.initValue : '', valid: paramList.datafeed_draw_value.initValue !== undefined });
  const [eventDate, setEventDate] = useState({ value: paramList.event_date.initValue !== undefined ? paramList.event_date.initValue : '', valid: paramList.event_date.initValue !== undefined });
  const [waitingPeriodLength, setWaitingPeriodLength] = useState({ value: paramList.waiting_period_length.initValue !== undefined ? paramList.waiting_period_length.initValue : '', valid: paramList.waiting_period_length.initValue !== undefined });
  const [issueFee, setIssueFee] = useState({ value: paramList.issue_fee.initValue !== undefined ? paramList.issue_fee.initValue : '', valid: paramList.issue_fee.initValue !== undefined });
  const [redeemFee, setRedeemFee] = useState({ value: paramList.redeem_fee.initValue !== undefined ? paramList.redeem_fee.initValue : '', valid: paramList.redeem_fee.initValue !== undefined });
  const [arbProfitFee, setArbProfitFee] = useState({ value: paramList.arb_profit_fee.initValue !== undefined ? paramList.arb_profit_fee.initValue : '', valid: paramList.arb_profit_fee.initValue !== undefined });
  const [category, setCategory] = useState({ value: 'misc', valid: true });
  const [quietPeriod, setQuietPeriod] = useState({ value: paramList.quiet_period.initValue !== undefined ? paramList.quiet_period.initValue : '', valid: paramList.quiet_period.initValue !== undefined });

  const reserveAssets = useSelector(selectReserveAssets);

  const dispatch = useDispatch();

  // handles
  const handleChangeValue = (evOrValue, type) => {
    let value;

    if (['allow_draw', 'reserve_asset', 'comparison', 'oracle', 'feed_name'].includes(type)) {
      value = evOrValue;
    } else if (type === 'event_date') {
      value = evOrValue.unix();
    } else {
      value = evOrValue.target.value;
    }

    const valid = paramList[type].validator ? paramList[type].validator(value) : true;

    if (type === 'allow_draw') {
      setAllowDraw({ value, valid });
    } else if (type === 'oracle') {
      setOracle({ value, valid });
    } else if (type === 'feed_name') {
      setFeedName({ value, valid });
    } else if (type === 'reserve_asset') {
      setReserveAsset({ value, valid });
    } else if (type === 'comparison') {
      setComparison({ value, valid });
    } else if (type === 'datafeed_value') {
      setDataFeedValue({ value, valid });
    } else if (type === 'datafeed_draw_value') {
      setDataFeedDrawValue({ value, valid });
    } else if (type === 'event_date') {
      setEventDate({ value, valid });
    } else if (type === 'quiet_period') {
      setQuietPeriod({ value, valid });
    } else if (type === 'waiting_period_length') {
      setWaitingPeriodLength({ value, valid });
    } else if (type === 'issue_fee') {
      setIssueFee({ value, valid });
    } else if (type === 'redeem_fee') {
      setRedeemFee({ value, valid });
    } else if (type === 'arb_profit_fee') {
      setArbProfitFee({ value, valid });
    }
  }

  const dateFilter = (date) => {
    return date.unix() < moment().hours(0).minutes(0).seconds(0).milliseconds(0).unix()
  }

  const isValidForm = oracle.valid && feedName.valid && datafeedValue.valid && eventDate.valid && waitingPeriodLength.valid && issueFee.valid && redeemFee.valid && quietPeriod.valid && (allowDraw.value ? datafeedDrawValue.valid : 1) && arbProfitFee.valid;

  const data = {
    oracle: oracle.value,
    feed_name: feedName.value,
    reserve_asset: reserveAsset.value,
    comparison: comparison.value,
    datafeed_value: datafeedValue.value,
    event_date: moment.unix(eventDate.value).utc().format('YYYY-MM-DDTHH:mm:ss'),
    waiting_period_length: waitingPeriodLength.value * 24 * 3600,
    issue_fee: issueFee.value / 100,
    redeem_fee: redeemFee.value / 100,
    arb_profit_tax: arbProfitFee.value / 100,
    reserve_decimals: reserveAssets[reserveAsset.value]?.decimals,
    quiet_period: quietPeriod.value * 3600
  }

  if (allowDraw.value) {
    data.allow_draw = 1;
    data.datafeed_draw_value = datafeedDrawValue.value;
  }

  const save = () => {
    if (!isValidForm) return null;

    ReactGA.event({
      category: "Create",
      action: `Create ${category.value} market`,
      label: data.oracle
    });

    dispatch(saveCreationOrder(data));
  }

  const infoByCurrentCategory = appConfig.CATEGORIES[category.value] || {};

  const handleChangeCategory = (value) => {
    const infoByCurrentCategory = appConfig.CATEGORIES[value] || {};

    if (value === 'misc') {
      setOracle({ value: '', valid: false })
    } else if (value === 'currency') {
      setFeedName({ value: '', valid: false });
    }

    if (value !== 'misc' && !isEmpty(infoByCurrentCategory.oracles)) {
      const value = infoByCurrentCategory.oracles[0].address;
      setOracle({ value, valid: true })
    }

    setCategory({ value, valid: true });
  }

  const feedNames = infoByCurrentCategory?.oracles?.find(({ address }) => address === oracle.value)?.feedNames;

  const link = generateLink({ amount: 2e4, data: { ...data, reserve_decimals: undefined }, aa: appConfig.FACTORY_AA });

  const timeZone = moment().utcOffset() / 60;

  return <Form layout="vertical">
    <Row gutter={16}>
      <Col xs={{ span: 24 }} md={{ span: 8 }}>
        <Form.Item
          label={<FormLabel info="Type of the market. There are custom interfaces for sport and currencies.">Category</FormLabel>}>
          <Select
            size="large"
            defaultActiveFirstOption={false}
            value={category.value}
            className='firstBigLetter'
            onChange={handleChangeCategory}
            showSearch={true}>
            {Object.keys(appConfig.CATEGORIES).map((category) => <Select.Option key={category} className="firstBigLetter" value={category}>{category}</Select.Option>)}
            <Select.Option key="misc" value="misc">Misc</Select.Option>
          </Select>
        </Form.Item>
      </Col>
    </Row>

    {category.value === 'currency' && <Form.Item>
      <Alert
        type="warning"
        message={<span>Creating markets for currency events is easier by finding them in the <Link to="/currency#calendar">calendar</Link> on the main page</span>}
      />
    </Form.Item>}

    {category.value !== 'sport' && <>
      <Form.Item>
        <FormLabel info={paramList.allow_draw.description}>Allow draw</FormLabel> <Switch style={{ marginLeft: 10 }} onChange={(ev) => handleChangeValue(ev, 'allow_draw')} defaultChecked={allowDraw.value} />
      </Form.Item>

      <Row gutter={16}>
        <Col xs={{ span: 24 }} md={{ span: 12 }}>
          <Form.Item help={(oracle.value !== '' && !oracle.valid) ? paramList.oracle.errorMessage : ''} validateStatus={oracle.value !== '' ? (oracle.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.oracle.description}>Oracle</FormLabel>}>
            {infoByCurrentCategory.oracles ? <Select onChange={(value) => handleChangeValue(value, 'oracle')} size="large" value={oracle.value}>
              {infoByCurrentCategory.oracles.map(({ address, name }) => <Select.Option key={address} value={address}>{name} ({address})</Select.Option>)}
            </Select> : <Input size="large" onChange={(ev) => handleChangeValue(ev.target.value, 'oracle')} value={oracle.value} placeholder={paramList.oracle.placeholder} />}
          </Form.Item>
        </Col>

        <Col xs={{ span: 24 }} md={{ span: 12 }}>
          <Form.Item help={feedName.value !== '' && !feedName.valid ? paramList.feed_name.errorMessage : ''} validateStatus={feedName.value !== '' ? (feedName.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.feed_name.description}>Feed name</FormLabel>}>
            {(category.value !== 'currency' || !feedNames || feedNames.length === 0)
              ? <Input size="large" onChange={(ev) => handleChangeValue(ev.target.value, 'feed_name')} value={feedName.value} placeholder={paramList.feed_name.placeholder} />
              : <Select
                size="large"
                onChange={(value) => handleChangeValue(value, 'feed_name')}
                value={feedName.value}
                showSearch
                placeholder={paramList.feed_name.placeholder}>
                {feedNames.map(feedName => <Select.Option key={feedName} value={feedName}>{feedName}</Select.Option>)}
              </Select>}
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={{ span: 24 }} md={{ span: allowDraw.value ? 8 : 12 }}>
          <Form.Item validateStatus='success' label={<FormLabel info={paramList.comparison.description}>Comparison</FormLabel>}>
            <Select onChange={(ev) => handleChangeValue(ev, 'comparison')} size="large" value={comparison.value}>
              <Select.Option value='=='>=</Select.Option>
              <Select.Option value='>'>{'>'}</Select.Option>
              <Select.Option value='<'>{'<'}</Select.Option>
              <Select.Option value='>='>{'>='}</Select.Option>
              <Select.Option value='<='>{'<='}</Select.Option>
              <Select.Option value='!='>!=</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={{ span: 24 }} md={{ span: allowDraw.value ? 8 : 12 }}>
          <Form.Item validateStatus={datafeedValue.value !== '' ? (datafeedValue.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.datafeed_value.description}>Data feed value</FormLabel>}>
            <Input size="large" onChange={(ev) => handleChangeValue(ev, 'datafeed_value')} value={datafeedValue.value} placeholder={paramList.datafeed_value.placeholder} />
          </Form.Item>
        </Col>

        {allowDraw.value && <Col xs={{ span: 24 }} md={{ span: 8 }}>
          <Form.Item validateStatus={datafeedDrawValue.value !== '' ? (datafeedDrawValue.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.datafeed_draw_value.description}>Draw data feed value</FormLabel>}>
            <Input size="large" onChange={(ev) => handleChangeValue(ev, 'datafeed_draw_value')} value={datafeedDrawValue.value} placeholder={paramList.datafeed_draw_value.placeholder} />
          </Form.Item>
        </Col>}
      </Row>

      <Form.Item validateStatus='success' label={<FormLabel info={paramList.reserve_asset.description}>Reserve asset</FormLabel>}>
        <Select onChange={(ev) => handleChangeValue(ev, 'reserve_asset')} size="large" value={reserveAsset.value}>
          {!reserveAssets && <Select.Option value='base'>GBYTE</Select.Option>}
          {reserveAssets && Object.entries(reserveAssets).map(([asset, { symbol }]) => <Select.Option key={asset} value={asset}>{symbol}</Select.Option>)}
        </Select>
      </Form.Item>

      <Row gutter={16}>
        <Col xs={{ span: 24 }} md={{ span: 8 }}>
          <Form.Item help={eventDate.value !== '' && !eventDate.valid ? paramList.event_date.errorMessage : ''} validateStatus={eventDate.value !== '' ? (eventDate.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.event_date.description}>Date of the event (GMT{timeZone >= 0 ? '+' : '-'}{timeZone})</FormLabel>}>
            <DatePicker allowClear={false} disabledDate={dateFilter} size="large" format="YYYY-MM-DD HH:mm" showToday={false} showTime={true} showNow={false} value={eventDate.value ? moment.unix(eventDate.value) : undefined} onChange={(ev) => handleChangeValue(ev, 'event_date')} style={{ width: '100%' }} placeholder={paramList.event_date.placeholder} />
          </Form.Item>
        </Col>

        <Col xs={{ span: 24 }} md={{ span: 8 }}>
          <Form.Item validateStatus={quietPeriod.value !== '' ? (quietPeriod.valid ? 'success' : 'error') : undefined} label={<FormLabel value={quietPeriod.valid ? quietPeriod.value : 0} info={paramList.quiet_period.description}>Quiet period (in hours)</FormLabel>}>
            <Input size="large" placeholder={paramList.quiet_period.placeholder} onChange={(ev) => handleChangeValue(ev, 'quiet_period')} value={quietPeriod.value} />
          </Form.Item>
        </Col>

        <Col xs={{ span: 24 }} md={{ span: 8 }}>
          <Form.Item validateStatus={waitingPeriodLength.value !== '' ? (waitingPeriodLength.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.waiting_period_length.description}>Duration of the waiting period (in days)</FormLabel>}>
            <Input size="large" placeholder={paramList.waiting_period_length.placeholder} onChange={(ev) => handleChangeValue(ev, 'waiting_period_length')} value={waitingPeriodLength.value} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={{ span: 24 }} md={{ span: 8 }}>
          <Form.Item validateStatus={issueFee.value !== '' ? (issueFee.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.issue_fee.description}>Issue fee</FormLabel>}>
            <Input size="large" suffix={<span>%</span>} placeholder={paramList.issue_fee.placeholder} value={issueFee.value} onChange={(ev) => handleChangeValue(ev, 'issue_fee')} />
          </Form.Item>
        </Col>

        <Col xs={{ span: 24 }} md={{ span: 8 }}>
          <Form.Item validateStatus={redeemFee.value !== '' ? (redeemFee.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.redeem_fee.description}>Redeem fee</FormLabel>}>
            <Input size="large" suffix={<span>%</span>} placeholder={paramList.redeem_fee.placeholder} value={redeemFee.value} onChange={(ev) => handleChangeValue(ev, 'redeem_fee')} />
          </Form.Item>
        </Col>

        <Col xs={{ span: 24 }} md={{ span: 8 }}>
          <Form.Item validateStatus={arbProfitFee.value !== '' ? (arbProfitFee.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.arb_profit_fee.description}>Arbitrageur profit fee</FormLabel>}>
            <Input size="large" suffix={<span>%</span>} placeholder={paramList.arb_profit_fee.placeholder} value={arbProfitFee.value} onChange={(ev) => handleChangeValue(ev, 'arb_profit_fee')} />
          </Form.Item>
        </Col>
      </Row>

      {isValidForm && <div style={{ maxWidth: 780 }}>
        <div style={{ marginBottom: 10 }}>
          <FormLabel info="This is how the market you want to create will look like">Preview</FormLabel>
        </div>

        <PredictionItem
          preview
          oracle={oracle.value}
          feed_name={feedName.value}
          event_date={eventDate.value}
          waiting_period_length={waitingPeriodLength.value}
          allow_draw={allowDraw.value}
          comparison={comparison.value}
          reserve_symbol={reserveAssets[reserveAsset.value].symbol}
          datafeed_value={datafeedValue.value}
          quiet_period={quietPeriod.value}
          candles={[0, 3, 5, 6.6, 7.8, 8.62]}
        />
      </div>}
    </>}

    {category.value === 'sport' && <Form.Item>
      <Alert
        type="warning"
        message={<span>To create markets for sports events find them in the <Link to="/soccer/all#calendar">calendar</Link> on the main page</span>}
      />
    </Form.Item>}

    {category.value !== 'sport' && <Row>
      <Form.Item>
        <QRButton
          disabled={!isValidForm || category.value === 'sport'}
          size="large"
          onClick={save}
          href={link}
          type="primary">
          Create
        </QRButton>
      </Form.Item>
    </Row>}
  </Form>
}