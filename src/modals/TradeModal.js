import { Button, Drawer, Tooltip, Typography } from "antd";
import { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import ReactGA from "react-ga";

import { SwitchActions } from "components/SwitchActions/SwitchActions";
import { BuyForm, RedeemForm } from "forms";
import { useWindowSize } from "hooks";
import { selectActiveMarketStatus } from "store/slices/activeSlice";

const { Title } = Typography;

export const TradeModal = memo(({ disabled, visible, setVisible, yes_team, no_team, reserve }) => {
  const [action, setAction] = useState('buy'); // buy or redeem

  const status = useSelector(selectActiveMarketStatus);
  const [width] = useWindowSize();
  const [buyAmount, setBuyAmount] = useState({ value: '', valid: true });
  const [redeemAmount, setRedeemAmount] = useState({ value: '', valid: true });

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
    {visible && <Helmet title="Prophet prediction markets — Trade" />}

    {reserve === 0 && !disabled ? <Tooltip title="Please add liquidity first"><Button size="large" type="primary" disabled={true}>Trade</Button></Tooltip>
      : <Button type="primary" size="large" disabled={disabled} onClick={open}>Trade</Button>}

    {status === 'loaded' && <Drawer
      width={width > 640 ? 640 : width}
      placement="right"
      size="large"
      visible={visible}
      onClose={close}
    >

      <Title level={2}>Trade</Title>
      <SwitchActions data={[{ value: 'buy', text: 'Buy' }, { value: 'redeem', text: 'Sell', disabled: true }]} onChange={(action) => setAction(action)} value={action} />

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