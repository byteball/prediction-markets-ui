import { Switch, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import { changeViewType, selectPriceOrOdds } from "store/slices/settingsSlice";

export const ViewPriceSwitcher = () => {
  const dispatch = useDispatch();
  const priceOrOdds = useSelector(selectPriceOrOdds);
  const { t } = useTranslation();

  return <Tooltip title={t("view_price_switcher.desc", "Switch between displaying prices of Yes/No/Draw tokens and odds (as is common in sports betting)")}>
    <Switch checkedChildren={t("view_price_switcher.odds", "odds")} unCheckedChildren={t("view_price_switcher.prices", "prices")} checked={priceOrOdds === 'odds'} onChange={() => dispatch(changeViewType())} />
  </Tooltip>
}