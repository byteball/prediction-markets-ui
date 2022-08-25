import { Button, Drawer, Typography } from "antd";
import { useState } from "react";
import moment from "moment";
import { Helmet } from "react-helmet-async";

import { useWindowSize } from "hooks";

import appConfig from "appConfig";

const { Title } = Typography;

export const ViewParamsModal = ({ reserve_asset, allow_draw, oracle, feed_name, comparison, datafeed_value, datafeed_draw_value, event_date, waiting_period_length, issue_fee, redeem_fee, arb_profit_tax, aa_address, quiet_period = 0 }) => {
  const [visible, setVisible] = useState(false);
  const [width] = useWindowSize();

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  return <>
    {visible && <Helmet title="Prophet prediction markets — View params" />}
    <Button size="small" type="link" onClick={open}>View params</Button>
    <Drawer
      width={width > 640 ? 640 : width}
      placement="right"
      size="large"
      visible={visible}
      onClose={close}
    >
      <Title level={2} style={{ marginBottom: 0 }}>View params</Title>
      <p><a href={`https://${appConfig.ENVIRONMENT === 'testnet' ? 'testnet' : ''}explorer.obyte.org/#${aa_address}`} target="_blank" rel="noopener">View AA on explorer</a></p>
      <p><b>Reserve asset: </b>{reserve_asset}</p>
      <p><b>Allow draw: </b>{allow_draw ? 'yes' : 'no'}</p>
      <p><b>Oracle: </b><a href={`https://${appConfig.ENVIRONMENT === 'testnet' ? 'testnet' : ''}explorer.obyte.org/#${oracle}`} target="_blank" rel="noopener">{oracle}</a></p>
      <p><b>Feed name: </b>{feed_name}</p>
      <p><b>Comparison: </b>{comparison}</p>
      <p><b>Datafeed value: </b>{datafeed_value}</p>
      {allow_draw && <p><b>datafeed draw value: </b>{datafeed_draw_value}</p>}
      <p><b>End of trading period: </b>{moment.unix(event_date).format('lll')}</p>
      <p><b>Waiting period length: </b>{+Number(waiting_period_length / (24 * 3600)).toFixed(3)} days</p>
      <p><b>Quiet period: </b>{+Number(quiet_period / 3600).toFixed(3)} hours</p>
      <p><b>Issue fee: </b>{issue_fee * 100}%</p>
      <p><b>Redeem fee: </b>{redeem_fee * 100}%</p>
      <p><b>Arb profit tax: </b>{arb_profit_tax * 100}%</p>
    </Drawer>
  </>
}