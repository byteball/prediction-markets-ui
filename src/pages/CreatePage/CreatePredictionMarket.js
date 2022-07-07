import { Result } from "antd";
import QRButton from "obyte-qr-button";
import { LoadingOutlined } from "@ant-design/icons";

import { generateLink } from "utils";

import config from "appConfig";

export const CreatePredictionMarket = ({ data, status }) => {
  const link = generateLink({ amount: 2e4, data, aa: config.FACTORY_AA });

  return <>
    {status === 'order' ? <Result
      title="Creating prediction market"
      extra={
        <QRButton type="primary" size="large" href={link} key="create-btn">
          Create
        </QRButton>
      }
    /> : <Result icon={<LoadingOutlined />} title="Create prediction market" subTitle="Waiting for stabilization..." />}
  </>
}