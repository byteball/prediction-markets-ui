import { InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip, Typography } from "antd";

export const FormLabel = ({ info, children, value }) => {
  const transformInfo = typeof info === 'function' ? info(value) : info;

  return <span onClick={(e) => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
  }}>
    <Typography.Text type='secondary'>{children} </Typography.Text>
    
    <Tooltip title={transformInfo} trigger={["hover"]}>
      <InfoCircleOutlined style={{ opacity: .4 }} />
    </Tooltip>
  </span>
}