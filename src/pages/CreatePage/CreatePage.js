import { Button, Result, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { Layout } from "components/Layout/Layout"
import { CreateForm } from "forms/CreateForm";
import { removeCreationOrder, selectCreationOrder } from "store/slices/settingsSlice";
import { CreatePredictionMarket } from "./CreatePredictionMarket";
import { RegisterSymbols } from "./RegSymbol";

export const CreatePage = () => {
  const creationOrder = useSelector(selectCreationOrder);
  const dispatch = useDispatch();

  const symbolsAlreadyReg = creationOrder ? (creationOrder.yes_symbol && creationOrder.no_symbol && (!creationOrder.data.allow_draw || creationOrder.draw_symbol)) || creationOrder.cancelRegSymbol : false;

  return <Layout>
    <Typography.Title level={1}>Create</Typography.Title>
    <Typography.Paragraph>On this page you can create a prediction market</Typography.Paragraph>

    {!creationOrder ? <CreateForm /> : <div>
      {(creationOrder.status === 'order' || creationOrder.status === 'pending') && <CreatePredictionMarket data={creationOrder.data} status={creationOrder.status} />}
      {creationOrder.status === 'created' && !symbolsAlreadyReg && <RegisterSymbols />}
      {creationOrder.status === 'created' && symbolsAlreadyReg && <Result status="success" title="Prediction market created successfully" extra={
        <Link to={`/market/${creationOrder.prediction_address}`}>
          <Button onClick={() => dispatch(removeCreationOrder())}>Go to the market</Button>
        </Link>} />}
    </div>}
  </Layout>
}