import { Button, Drawer, Typography } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import ReactGA from "react-ga";
import { useTranslation } from "react-i18next";

import { useWindowSize } from "hooks";
import { AddLiquidityForm } from "forms";
import { selectActiveMarketStatus } from "store/slices/activeSlice";

const { Title } = Typography;

export const AddLiquidityModal = ({ disabled, yes_team, no_team }) => {
  const [visible, setVisible] = useState(false);

  const status = useSelector(selectActiveMarketStatus);
  const [width] = useWindowSize();
  const { t } = useTranslation();

  const open = () => {
    setVisible(true);

    ReactGA.event({
      category: "user-engagement",
      action: "click-add-liquidity"
    });
  };

  const close = () => setVisible(false);

  return <>
    {visible && <Helmet title={`Prophet prediction markets — ${t("modals.add_liquidity.title", "Add liquidity")}`} />}
    <Button type="primary" size="large" disabled={disabled} onClick={open}>{t("modals.add_liquidity.title", "Add liquidity")}</Button>

    {status === 'loaded' && <Drawer
      width={width > 640 ? 640 : width}
      placement="right"
      size="large"
      visible={visible}
      onClose={close}
    >

      <Title level={2}>{t("modals.add_liquidity.title", "Add liquidity")}</Title>
      <AddLiquidityForm
        yes_team={yes_team}
        no_team={no_team}
        visible={visible}
      />
    </Drawer>}
  </>
}