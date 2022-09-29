import { Button, Drawer, Typography } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import { ClaimProfitForm } from "forms";
import { useWindowSize } from "hooks";
import {
  selectActiveAddress,
  selectActiveMarketParams,
  selectActiveMarketStateVars,
  selectActiveMarketStatus
} from "store/slices/activeSlice";
import { selectWalletAddress } from "store/slices/settingsSlice";

const { Title } = Typography;

export const ClaimProfitModal = ({ disabled, yes_team, no_team }) => {
  const [visible, setVisible] = useState(false);
  const status = useSelector(selectActiveMarketStatus);
  const address = useSelector(selectActiveAddress);
  const stateVars = useSelector(selectActiveMarketStateVars);
  const walletAddress = useSelector(selectWalletAddress);

  const { yes_decimals, no_decimals, draw_decimals, yes_symbol, no_symbol, draw_symbol, reserve_decimals, reserve_symbol } = useSelector(selectActiveMarketParams);

  const { result: winner, supply_yes, supply_no, supply_draw, reserve, yes_asset, no_asset, draw_asset } = stateVars;

  const supply = (winner === 'yes' ? supply_yes : (winner === 'no' ? supply_no : supply_draw) || 0);
  const decimals = (winner === 'yes' ? yes_decimals : (winner === 'no' ? no_decimals : draw_decimals) || 0);
  const asset = (winner === 'yes' ? yes_asset : (winner === 'no' ? no_asset : draw_asset) || 0);
  const symbol = (winner === 'yes' ? yes_symbol : (winner === 'no' ? no_symbol : draw_symbol) || 0);
  const winnerView = winner === 'yes' ? yes_team || 'Yes' : (winner === 'no' ? no_team || 'No' : 'Draw');

  const [width] = useWindowSize();
  const { t } = useTranslation();

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  return <>
    {visible && <Helmet title={`Prophet prediction markets — ${t("modals.claim_profit.title", "Claim profit")}`} />}
    <Button type="primary" size="large" disabled={disabled} onClick={open}>{t("modals.claim_profit.title", "Claim profit")}</Button>
    {status === 'loaded' && <Drawer
      width={width > 640 ? 640 : width}
      placement="right"
      size="large"
      visible={visible}
      onClose={close}
    >
      <Title level={2}>{t("modals.claim_profit.title", "Claim profit")}</Title>

      <Typography.Paragraph type="secondary">
        {t("modals.claim_profit.winner_desc", '"{{winner}}" was the right choice and you can collect your winnings', { winner: winnerView })}
      </Typography.Paragraph>

      <ClaimProfitForm
        address={address}
        supply={supply}
        reserve={reserve}
        decimals={decimals}
        walletAddress={walletAddress}
        reserve_decimals={reserve_decimals}
        reserve_symbol={reserve_symbol}
        asset={asset}
        symbol={symbol}
      />
    </Drawer>}
  </>
}