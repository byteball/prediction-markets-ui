import { Button, Drawer, Typography } from "antd";
import { SingleTradeForm } from "forms/SingleTradeForm";
import { useWindowSize } from "hooks/useWindowSize";
import { useState } from "react";
import { useSelector } from "react-redux";
import { selectActiveMarketStatus } from "store/slices/activeSlice";

const { Title } = Typography;

export const TradeModal = ({ disabled }) => {
  const [visible, setVisible] = useState(false);
  const status = useSelector(selectActiveMarketStatus);
  const [width] = useWindowSize();

  const open = () => setVisible(true);
  const close = () => setVisible(false);

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
      <SingleTradeForm />
    </Drawer>}
  </>
}