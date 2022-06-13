import { Button, Drawer, Typography } from "antd";
import { useState } from "react";
import { Outlet } from "react-router-dom";

import { useWindowSize } from "hooks/useWindowSize";
import { CreateNowForm } from "forms/CreateNowForm";

const { Title } = Typography;

export const CreateNowModal = (props) => {
  const [visible, setVisible] = useState(false);
  const [width] = useWindowSize();

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  return <>
    <Button size="large" type="primary" onClick={open}>Create now</Button>
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