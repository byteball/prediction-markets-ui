import { Form, Input, Row, Col, Select, Switch, DatePicker, Button, Divider } from "antd";
import { useState } from "react";
import obyte from "obyte";
import { isNumber, union } from "lodash";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";

import { FormLabel } from "components/FormLabel/FormLabel";
import { addExtraCategory, saveCreationOrder, selectCategories, selectExtraCategories, selectReserveAssets } from "store/slices/settingsSlice";

export const paramList = {
  event: {
    description: 'info',
    placeholder: "Example: Will $ETH be above $3,250 on April 13th, 2023?",
    validator: (value) => {
      const len = value.length;
      return len >= 5 && len <= 128
    },
    errorMessage: "The event must be greater than or equal to 5 characters and less than or equal to 128 characters."
  },
  allow_draw: {
    description: 'info',
  },
  oracle: {
    description: 'info',
    placeholder: "MDKKPO375Q5M3GDET2X4H4ZNSO...",
    validator: (value) => {
      return value && obyte.utils.isValidAddress(value);
    },
    errorMessage: "Oracle address isn't valid."
  },
  feed_name: {
    description: 'info',
    placeholder: "ETH_TO_USD",
    validator: (value) => {
      return value && value.trim().length > 0
    }
  },
  reserve_asset: {
    initValue: 'base',
    description: 'info',
  },
  comparison: {
    initValue: '==',
    description: 'info',
  },
  datafeed_value: {
    description: 'info',
    placeholder: "3251",
    validator: (value) => {
      return value && value.trim().length > 0
    }
  },
  datafeed_draw_value: {
    description: 'info',
    placeholder: "3250",
    validator: (value) => {
      return value && value.trim().length > 0
    }
  },
  end_of_trading_period: {
    description: 'info',
    placeholder: "Select a date",
    validator: (value) => {
      const timestamp = moment.utc(value).startOf("day").unix();
      return timestamp > dateNow
    },
    errorMessage: "You have chosen the past or present day."
  },
  waiting_period_length: {
    initValue: 5,
    description: 'info',
    placeholder: "5",
    validator: (value) => {
      return value && isNumber(Number(value)) && Number(value) >= 0
    }
  },
  issue_fee: {
    description: 'info',
    placeholder: "1",
    initValue: 1,
    validator: (value) => {
      return value && isNumber(Number(value)) && Number(value) >= 0 && Number(value) < 100
    }
  },
  redeem_fee: {
    description: 'info',
    placeholder: "2",
    initValue: 2,
    validator: (value) => {
      return value && isNumber(Number(value)) && Number(value) >= 0 && Number(value) < 100
    }
  },
  arb_profit_fee: {
    description: 'info',
    placeholder: "90",
    initValue: 90,
    validator: (value) => {
      return value && isNumber(Number(value)) && Number(value) >= 0 && Number(value) < 100
    }
  },
}

const dateNow = moment.utc().startOf("day").unix();

export const CreateForm = () => {
  // states
  const [event, setEvent] = useState({ value: paramList.event.initValue !== undefined ? paramList.event.initValue : '', valid: paramList.event.initValue !== undefined });
  const [allowDraw, setAllowDraw] = useState({ value: paramList.allow_draw.initValue !== undefined ? paramList.allow_draw.initValue : '', valid: true });
  const [oracle, setOracle] = useState({ value: paramList.oracle.initValue !== undefined ? paramList.oracle.initValue : '', valid: paramList.oracle.initValue !== undefined })
  const [feedName, setFeedName] = useState({ value: paramList.feed_name.initValue !== undefined ? paramList.feed_name.initValue : '', valid: paramList.feed_name.initValue !== undefined });
  const [reserveAsset, setReserveAsset] = useState({ value: paramList.reserve_asset.initValue !== undefined ? paramList.reserve_asset.initValue : '', valid: true });
  const [comparison, setComparison] = useState({ value: paramList.comparison.initValue !== undefined ? paramList.comparison.initValue : '', valid: true });
  const [datafeedValue, setDataFeedValue] = useState({ value: paramList.datafeed_value.initValue !== undefined ? paramList.datafeed_value.initValue : '', valid: paramList.datafeed_value.initValue !== undefined });
  const [datafeedDrawValue, setDataFeedDrawValue] = useState({ value: paramList.datafeed_draw_value.initValue !== undefined ? paramList.datafeed_draw_value.initValue : '', valid: paramList.datafeed_draw_value.initValue !== undefined });
  const [endOfTradingPeriod, setEndOfTradingPeriod] = useState({ value: paramList.end_of_trading_period.initValue !== undefined ? paramList.end_of_trading_period.initValue : '', valid: paramList.end_of_trading_period.initValue !== undefined });
  const [waitingPeriodLength, setWaitingPeriodLength] = useState({ value: paramList.waiting_period_length.initValue !== undefined ? paramList.waiting_period_length.initValue : '', valid: paramList.waiting_period_length.initValue !== undefined });
  const [issueFee, setIssueFee] = useState({ value: paramList.issue_fee.initValue !== undefined ? paramList.issue_fee.initValue : '', valid: paramList.issue_fee.initValue !== undefined });
  const [redeemFee, setRedeemFee] = useState({ value: paramList.redeem_fee.initValue !== undefined ? paramList.redeem_fee.initValue : '', valid: paramList.redeem_fee.initValue !== undefined });
  const [arbProfitFee, setArbProfitFee] = useState({ value: paramList.arb_profit_fee.initValue !== undefined ? paramList.arb_profit_fee.initValue : '', valid: paramList.arb_profit_fee.initValue !== undefined });
  const [category, setCategory] = useState({ value: null, valid: true });

  const [extraCategory, setExtraCategory] = useState({ value: '', valid: true });
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const reserveAssets = useSelector(selectReserveAssets);
  const categories = useSelector(selectCategories);
  const extraCategories = useSelector(selectExtraCategories);

  const dispatch = useDispatch();

  // handles
  const handleChangeValue = (evOrValue, type) => {
    const value = (type === 'allow_draw' || type === 'reserve_asset' || type === 'comparison' || type === 'end_of_trading_period') ? evOrValue : evOrValue.target.value;
    const valid = paramList[type].validator ? paramList[type].validator(value) : true;

    if (type === 'event') {
      setEvent({ value, valid });
    } else if (type === 'allow_draw') {
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
    } else if (type === 'end_of_trading_period') {
      setEndOfTradingPeriod({ value, valid });
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
    return moment.utc(date).startOf("day").unix() <= dateNow
  }

  const isValidForm = event.valid && oracle.valid && feedName.valid && datafeedValue.valid && endOfTradingPeriod.valid && waitingPeriodLength.valid && issueFee.valid && redeemFee.valid && (allowDraw.value ? datafeedDrawValue.valid : 1) && arbProfitFee.valid;

  const save = () => {
    if (!isValidForm) return null;

    const data = {
      event: event.value,
      oracle: oracle.value,
      feed_name: feedName.value,
      reserve_asset: reserveAsset.value,
      comparison: comparison.value,
      datafeed_value: datafeedValue.value,
      end_of_trading_period: moment.utc(endOfTradingPeriod.value).startOf("day").unix(),
      waiting_period_length: waitingPeriodLength.value * 24 * 3600,
      issue_fee: issueFee.value / 100,
      redeem_fee: redeemFee.value / 100,
      arb_profit_tax: arbProfitFee.value / 100
    }

    if (category.value) {
      data.category = category.value;
    }

    if (allowDraw.value) {
      data.allow_draw = 1;
      data.datafeed_draw_value = datafeedDrawValue.value;
    }

    dispatch(saveCreationOrder(data));
  }

  const isValidCategory = (value) => {
    const trimValueLength = value.trim().length;
    return trimValueLength <= 14 && trimValueLength > 0;
  }

  const handleChangeExtraCategory = (e) => {
    const value = String(e.target.value);

    setExtraCategory({ value, valid: isValidCategory(value) });
  }

  const saveExtraCategory = () => {
    const value = String(extraCategory.value).trim().toLowerCase();

    if (extraCategory.valid) {
      setCategory({ value, valid: true })
      setExtraCategory({ value: '', valid: true });

      dispatch(addExtraCategory(value));
    }
  }

  return <Form layout="vertical">
    <Form.Item help={event.value !== '' && !event.valid ? paramList.event.errorMessage : ''} validateStatus={event.value !== '' ? (event.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.event.description}>Event</FormLabel>}>
      <Input value={event.value} autoFocus={true} size="large" onChange={(ev) => handleChangeValue(ev, 'event')} placeholder={paramList.event.placeholder} />
    </Form.Item>
    <Row gutter={16}>
      <Col xs={{ span: 24 }} md={{ span: 8 }}>
        <Form.Item label={<FormLabel info="desc category">Category</FormLabel>}>
          <Select
            size="large"
            defaultActiveFirstOption={false}
            value={category.value}
            className='firstBigLetter'
            onChange={(c) => setCategory({ value: c, valid: true })}
            onDropdownVisibleChange={() => setCategorySearchQuery('')}
            showSearch={true}
            dropdownRender={menu => (
              <>
                {menu}
                <Divider style={{ margin: '8px 0' }} />

                <div style={{ padding: '0 8px 4px', display: 'flex' }}>
                  <Input placeholder="Category" style={{ flex: 1, marginRight: 8 }} value={extraCategory.value} onChange={handleChangeExtraCategory} />
                  <Button type="primary" disabled={!extraCategory.valid || !extraCategory.value} onClick={saveExtraCategory}>Add</Button>
                </div>
              </>
            )}>

            {(!categorySearchQuery || categorySearchQuery.includes('No category')) && <Select.Option value={null}>No category</Select.Option>}

            {union(categories, extraCategories || []).filter((category) => !categorySearchQuery || category.includes(categorySearchQuery)).map(category => <Select.Option value={category}>{category}</Select.Option>)}
          </Select>
        </Form.Item>
      </Col>
    </Row>
    <Form.Item>
      <FormLabel info={paramList.allow_draw.description}>Allow draw</FormLabel> <Switch style={{ marginLeft: 10 }} onChange={(ev) => handleChangeValue(ev, 'allow_draw')} defaultChecked={allowDraw.value} />
    </Form.Item>

    <Row gutter={16}>
      <Col xs={{ span: 24 }} md={{ span: 12 }}>
        <Form.Item help={oracle.value !== '' && !oracle.valid ? paramList.oracle.errorMessage : ''} validateStatus={oracle.value !== '' ? (oracle.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.oracle.description}>Oracle</FormLabel>}>
          <Input size="large" onChange={(ev) => handleChangeValue(ev, 'oracle')} value={oracle.value} placeholder={paramList.oracle.placeholder} />
        </Form.Item>
      </Col>

      <Col xs={{ span: 24 }} md={{ span: 12 }}>
        <Form.Item help={feedName.value !== '' && !feedName.valid ? paramList.feed_name.errorMessage : ''} validateStatus={feedName.value !== '' ? (feedName.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.feed_name.description}>Feed name</FormLabel>}>
          <Input size="large" onChange={(ev) => handleChangeValue(ev, 'feed_name')} value={feedName.value} placeholder={paramList.feed_name.placeholder} />
        </Form.Item>
      </Col>
    </Row>

    <Form.Item validateStatus='success' label={<FormLabel info={paramList.reserve_asset.description}>Reserve asset</FormLabel>}>
      <Select onChange={(ev) => handleChangeValue(ev, 'reserve_asset')} size="large" value={reserveAsset.value}>
        {!reserveAssets && <Select.Option value='base'>GBYTE</Select.Option>}
        {reserveAssets && Object.entries(reserveAssets).map(([name, value]) => <Select.Option key={value} value={value}>{name}</Select.Option>)}
      </Select>
    </Form.Item>

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

    <Row gutter={16}>
      <Col xs={{ span: 24 }} md={{ span: 12 }}>
        <Form.Item help={endOfTradingPeriod.value !== '' && !endOfTradingPeriod.valid ? paramList.end_of_trading_period.errorMessage : ''} validateStatus={endOfTradingPeriod.value !== '' ? (endOfTradingPeriod.valid ? 'success' : 'error') : undefined} label={<FormLabel info={paramList.end_of_trading_period.description}>Expiry trading period date (UTC)</FormLabel>}>
          <DatePicker allowClear={false} disabledDate={dateFilter} size="large" format="YYYY-MM-DD" showToday={false} value={endOfTradingPeriod.value} onChange={(ev) => handleChangeValue(ev, 'end_of_trading_period')} style={{ width: '100%' }} placeholder={paramList.end_of_trading_period.placeholder} />
        </Form.Item>
      </Col>
      <Col xs={{ span: 24 }} md={{ span: 12 }}>
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

    <Row>
      <Form.Item>
        <Button disabled={!isValidForm} size="large" onClick={save} type="primary">Continue</Button>
      </Form.Item>
    </Row>
  </Form>
}