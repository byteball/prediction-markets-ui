import { Button, Drawer, Typography } from "antd";
import { useState } from "react";
import moment from "moment";

import { useWindowSize } from "hooks/useWindowSize";

const { Title } = Typography;

export const ViewParamsModal = ({ event, reserve_asset, allow_draw, oracle, feed_name, comparison, datafeed_value, datafeed_draw_value, end_of_trading_period, waiting_period_length, issue_fee, redeem_fee, arb_profit_tax }) => {
  const [visible, setVisible] = useState(false);
  const [width] = useWindowSize();
  
  const open = () => setVisible(true);
  const close = () => setVisible(false);

  return <>
    <Button size="large" onClick={open}>View params</Button>
    <Drawer
      width={width > 640 ? 640 : width}
      placement="right"
      size="large"
      visible={visible}
      onClose={close}
    >
      <Title level={2}>View params</Title>
      <p><b>Event: </b>{event}</p>
      <p><b>Reserve asset: </b>{reserve_asset}</p>
      <p><b>Allow draw: </b>{allow_draw ? 'true' : 'false'}</p>
      <p><b>Oracle: </b>{oracle}</p>
      <p><b>Feed name: </b>{feed_name}</p>
      <p><b>Comparison: </b>{comparison}</p>
      <p><b>Datafeed value: </b>{datafeed_value}</p>
      {allow_draw && <p><b>datafeed draw value: </b>{datafeed_draw_value}</p>}
      <p><b>End of trading period: </b>{moment.unix(end_of_trading_period).utc().format('ll')}</p>
      <p><b>Waiting period length: </b>{waiting_period_length} seconds</p>
      <p><b>Issue fee: </b>{issue_fee * 100}%</p>
      <p><b>Redeem fee: </b>{redeem_fee * 100}%</p>
      <p><b>Arb profit tax: </b>{arb_profit_tax * 100}%</p>
    </Drawer>
  </>
}