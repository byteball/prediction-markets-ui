import { Button, Result, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

import { Layout } from "components/Layout/Layout"
import { CreateForm } from "forms";
import { removeCreationOrder, selectCreationOrder } from "store/slices/settingsSlice";
import { WaitingPredictionMarket } from "./WaitingPredictionMarket";
// import { RegisterSymbols } from "./RegSymbol";

export const CreatePage = () => {
  const creationOrder = useSelector(selectCreationOrder);
  const dispatch = useDispatch();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [])

  // const symbolsAlreadyReg = creationOrder ? (creationOrder.yes_symbol && creationOrder.no_symbol && (!creationOrder.data.allow_draw || creationOrder.draw_symbol)) || creationOrder.cancelRegSymbol : false;

  return <Layout>
    <Typography.Title level={1}>Create new market</Typography.Title>
    <Helmet title="Prophet prediction markets — Create new market" />
    {(!creationOrder || creationOrder.status === 'order') ? <CreateForm /> : <div>
      {(creationOrder.status === 'pending') && <WaitingPredictionMarket />}
      {creationOrder.status === 'created' && <Result status="success" title="Prediction market created successfully" extra={
        <Link to={`/market/${creationOrder.prediction_address}`}>
          <Button onClick={() => dispatch(removeCreationOrder())}>Go to the market</Button>
        </Link>} />}
    </div>}
  </Layout>
}