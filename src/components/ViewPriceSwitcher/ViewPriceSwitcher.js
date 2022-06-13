import { Switch } from "antd";
import { useDispatch, useSelector } from "react-redux";

import { changeViewType, selectPriceOrCoef } from "store/slices/settingsSlice";

export const ViewPriceSwitcher = () => {
  const dispatch = useDispatch();
  const priceOrCoef = useSelector(selectPriceOrCoef);

  return <Switch checkedChildren="coef" unCheckedChildren="prices" checked={priceOrCoef === 'coef'} onChange={() => dispatch(changeViewType())} />
}