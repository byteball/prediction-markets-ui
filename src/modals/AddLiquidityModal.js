import { Button, Drawer, Typography } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";

import { useWindowSize } from "hooks/useWindowSize";
import { selectActiveMarketStatus } from "store/slices/activeSlice";
import { AddLiquidityForm } from "forms";

const { Title } = Typography;

export const AddLiquidityModal = ({ disabled, yes_team, no_team }) => {
  const [visible, setVisible] = useState(false);

  const status = useSelector(selectActiveMarketStatus);
  const [width] = useWindowSize();

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  return <>
    <Button type="primary" size="large" disabled={disabled} onClick={open}>Add liquidity</Button>

    {status === 'loaded' && <Drawer
      width={width > 640 ? 640 : width}
      placement="right"
      size="large"
      visible={visible}
      onClose={close}
    >

      <Title level={2}>Add liquidity</Title>
      <AddLiquidityForm yes_team={yes_team} no_team={no_team} />
    </Drawer>}
  </>
}