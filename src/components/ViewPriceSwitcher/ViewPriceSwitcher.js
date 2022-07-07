import { Switch, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";

import { changeViewType, selectPriceOrCoef } from "store/slices/settingsSlice";

export const ViewPriceSwitcher = () => {
  const dispatch = useDispatch();
  const priceOrCoef = useSelector(selectPriceOrCoef);

  return <Tooltip title="Switch between displaying prices of Yes/No/Draw tokens and coefficients (as is common in sports betting)">
    <Switch checkedChildren="coef" unCheckedChildren="prices" checked={priceOrCoef === 'coef'} onChange={() => dispatch(changeViewType())} />
  </Tooltip>
}