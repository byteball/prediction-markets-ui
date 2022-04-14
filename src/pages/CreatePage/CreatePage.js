import { Button, Result, Typography } from "antd"
import { Layout } from "components/Layout/Layout"
import { CreateForm } from "forms/CreateForm";
import QRButton from "obyte-qr-button";
import { useSelector } from "react-redux";
import { selectCreationOrder } from "store/slices/settingsSlice";
import { CreatePredictionMarket } from "./CreatePredictionMarket";



export const CreatePage = () => {
  const creationOrder = useSelector(selectCreationOrder);

  return <Layout>
    <Typography.Title level={1}>Create</Typography.Title>
    <Typography.Paragraph>On this page you can create a prediction market</Typography.Paragraph>

    {!creationOrder ? <CreateForm /> : <div>
      {(creationOrder.status === 'order' || creationOrder.status === 'pending') && <CreatePredictionMarket data={creationOrder.data} status={creationOrder.status} />}
    </div>}
  </Layout>
}