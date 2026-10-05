import { Button, Result, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import { CreateForm } from "forms";
import { removeCreationOrder, selectCreationOrder } from "store/slices/settingsSlice";
import { WaitingPredictionMarket } from "./WaitingPredictionMarket";
import { PageProvider } from "components/PageProvider/PageProvider";
// import { RegisterSymbols } from "./RegSymbol";

export const CreatePage = () => {
  const creationOrder = useSelector(selectCreationOrder);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // const symbolsAlreadyReg = creationOrder ? (creationOrder.yes_symbol && creationOrder.no_symbol && (!creationOrder.data.allow_draw || creationOrder.draw_symbol)) || creationOrder.cancelRegSymbol : false;

  return <>
    <Typography.Title level={1}>{t("pages.create.title", "Create new prediction market")}</Typography.Title>
    <Helmet title={`Prophet prediction markets — ${t("pages.create.short_title", "Create new market")}`} />

    <PageProvider />

    {(!creationOrder || creationOrder.status === 'order') ? <CreateForm /> : <div>
      {(creationOrder.status === 'pending') && <WaitingPredictionMarket />}
      {creationOrder.status === 'created' && <Result status="success" title={t("pages.create.successfully", "Prediction market created successfully")} extra={
        <Link to={`/market/${creationOrder.prediction_address}`}>
          <Button onClick={() => dispatch(removeCreationOrder())}>{t("pages.create.go_to_market", "Go to the market")}</Button>
        </Link>} />}
    </div>}
  </>
}