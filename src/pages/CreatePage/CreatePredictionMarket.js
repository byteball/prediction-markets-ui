import { Button, Result } from "antd";
import QRButton from "obyte-qr-button";
import { useDispatch } from "react-redux";

import { removeCreationOrder } from "store/slices/settingsSlice";
import { generateLink } from "utils/generateLink";
import config from "appConfig";
import { LoadingOutlined } from "@ant-design/icons";

export const CreatePredictionMarket = ({ data, status }) => {
  const dispatch = useDispatch();
  const link = generateLink({ amount: 2e4, data, aa: config.FACTORY_AA });

  return <>
    {status === 'order' ? <Result
      title="Create prediction market"
      extra={
        <QRButton type="primary" size="large" href={link} key="create-btn">
          Create
        </QRButton>
      }
    /> : <Result icon={<LoadingOutlined />} title="Create prediction market" />}

    <div style={{ textAlign: "center" }}>
      <Button type="link" danger onClick={() => dispatch(removeCreationOrder())}>Cancel creation</Button>
    </div>
  </>
}