import { Button, Drawer, Typography } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { isBoolean } from "lodash";

import { SwitchActions } from "components/SwitchActions/SwitchActions";
import { BuyForm } from "forms/BuyForm";
import { RedeemForm } from "forms/RedeemForm";
import { useWindowSize } from "hooks/useWindowSize";
import { selectActiveMarketStatus } from "store/slices/activeSlice";

const { Title } = Typography;

export const TradeModal = ({ disabled, visible, setVisible }) => {
  const [action, setAction] = useState('buy'); // buy or redeem

  const status = useSelector(selectActiveMarketStatus);
  const [width] = useWindowSize();

  const open = () => setVisible(true);
  const close = () => setVisible(false);
  let type;
  let customAction;

  if (!isBoolean(visible)) {
    type = visible.type;
    customAction = visible.action
  }

  useEffect(() => {
    if (customAction) {
      setAction(customAction)
    } else {
      setAction('buy')
    }
  }, [visible]);


  return <>
    <Button type="primary" size="large" disabled={disabled} onClick={open}>Trade</Button>

    {status === 'loaded' && <Drawer
      width={width > 640 ? 640 : width}
      placement="right"
      size="large"
      visible={visible}
      onClose={close}
    >

      <Title level={2}>Trade</Title>
      <SwitchActions data={[{ value: 'buy', text: 'Buy' }, { value: 'redeem', text: 'Redeem' }]} onChange={(action) => setAction(action)} value={action} />

      {action === 'buy' ? <BuyForm type={type} /> : <RedeemForm type={type} />}
    </Drawer>}
  </>
}