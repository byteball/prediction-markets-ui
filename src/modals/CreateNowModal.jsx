import { Button, Drawer, Typography } from "antd";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import { useWindowSize } from "hooks";
import { CreateNowForm } from "forms";

const { Title } = Typography;

export const CreateNowModal = (props) => {
  const [visible, setVisible] = useState(false);
  const [width] = useWindowSize();
  const { t } = useTranslation();

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  return <>
    {visible && <Helmet title={`Prophet prediction markets — ${t("modals.create_now.title", "Create market")}`} />}
    <Button size="large" type="primary" onClick={open}>{t("modals.create_now.title", "Create market")}</Button>
    <Drawer
      width={width > 640 ? 640 : width}
      placement="right"
      size="large"
      key={`${props.feed_name} ${props.event_date} ${props.expect_datafeed_value}`}
      visible={visible}
      onClose={close}
      autoFocus={true}
      destroyOnClose={true}
      forceRender={true}
    >
      <Title level={2}>{t("modals.create_now.title", "Create market")}</Title>
      <CreateNowForm {...props} />
      <Outlet />
    </Drawer>
  </>
}