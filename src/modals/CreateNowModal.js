import { Button, Drawer, Typography } from "antd";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { useWindowSize } from "hooks";
import { CreateNowForm } from "forms";

const { Title } = Typography;

export const CreateNowModal = (props) => {
  const [visible, setVisible] = useState(false);
  const [width] = useWindowSize();

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  return <>
    {visible && <Helmet title="Prophet prediction markets — Create new market"/>}
    <Button size="large" type="primary" onClick={open}>Create market</Button>
    <Drawer
      width={width > 640 ? 640 : width}
      placement="right"
      size="large"
      visible={visible}
      onClose={close}
      autoFocus={true}
      destroyOnClose={true}
      forceRender={true}
    >
      <Title level={2}>Create market</Title>
      <CreateNowForm {...props} />
      <Outlet /> 
    </Drawer>
  </>
}