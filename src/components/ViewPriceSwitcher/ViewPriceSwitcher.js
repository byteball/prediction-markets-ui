import { Switch, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";

import { changeViewType, selectPriceOrOdds } from "store/slices/settingsSlice";

export const ViewPriceSwitcher = () => {
  const dispatch = useDispatch();
  const priceOrOdds = useSelector(selectPriceOrOdds);

  return <Tooltip title="Switch between displaying prices of Yes/No/Draw tokens and odds (as is common in sports betting)">
    <Switch checkedChildren="odds" unCheckedChildren="prices" checked={priceOrOdds === 'odds'} onChange={() => dispatch(changeViewType())} />
  </Tooltip>
}