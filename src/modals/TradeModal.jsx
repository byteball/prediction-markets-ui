import { Button, Drawer, Tooltip, Typography } from "antd";
import { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import ReactGA from "react-ga";
import { useTranslation } from "react-i18next";

import { SwitchActions } from "components/SwitchActions/SwitchActions";
import { BuyForm, RedeemForm } from "forms";
import { useWindowSize } from "hooks";
import { selectActiveMarketStatus } from "store/slices/activeSlice";
import { capitalizeFirstLetter } from "utils";

const { Title } = Typography;

export const TradeModal = memo(({ disabled, visible, setVisible, yes_team, no_team, reserve }) => {
  const [action, setAction] = useState('buy'); // buy or redeem

  const status = useSelector(selectActiveMarketStatus);
  const [width] = useWindowSize();
  const [buyAmount, setBuyAmount] = useState({ value: '', valid: true });
  const [redeemAmount, setRedeemAmount] = useState({ value: '', valid: true });
  const { t } = useTranslation();

  const open = () => {
    setVisible(true);

    ReactGA.event({
      category: "user-engagement",
      action: "click-trade"
    });
  }

  const close = () => setVisible(false);

  useEffect(() => {
    if (visible) {
      if (visible.action) {
        setAction(visible.action)
      } else {
        setAction('buy')
      }

      if (visible.action === 'buy') {
        ReactGA.event({
          category: "user-engagement",
          action: "click-buy",
          label: visible.type
        });
      } else if (visible.action === 'redeem') {
        ReactGA.event({
          category: "user-engagement",
          action: "click-sell",
          label: visible.type
        });
      }
    }
  }, [visible]);

  return <>
    {visible && <Helmet title={`Prophet prediction markets — ${t("modals.trade.title", "Trade")}`} />}

    {reserve === 0 && !disabled ? <Tooltip title={t("modals.trade.liquidity_first", "Please add liquidity first")}><Button size="large" type="primary" disabled={true}>{t("modals.trade.title", "Trade")}</Button></Tooltip>
      : <Button type="primary" size="large" disabled={disabled} onClick={open}>{t("modals.trade.title", "Trade")}</Button>}

    {status === 'loaded' && <Drawer
      width={width > 640 ? 640 : width}
      placement="right"
      size="large"
      visible={visible}
      onClose={close}
    >

      <Title level={2}>{t("modals.trade.title", "Trade")}</Title>
      <SwitchActions data={[{ value: 'buy', text: capitalizeFirstLetter(t("common.buy", "buy")) }, { value: 'redeem', text: capitalizeFirstLetter(t("common.sell", "sell")), disabled: true }]} onChange={(action) => setAction(action)} value={action} />

      {action === 'buy' && <BuyForm
        amount={buyAmount}
        setAmount={setBuyAmount}
        type={visible.type}
        yes_team={yes_team}
        no_team={no_team}
      />}

      {action === 'redeem' && <RedeemForm
        amount={redeemAmount}
        setAmount={setRedeemAmount}
        type={visible.type}
        yes_team={yes_team}
        no_team={no_team}
      />}
    </Drawer>}
  </>
})