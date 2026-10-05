import { InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";

export const InfoTooltip = ({ title, style = {} }) => {
  return <span onClick={(e) => {
    e.nativeEvent.stopImmediatePropagation();
    e.stopPropagation();
  }}>
    <Tooltip title={title} trigger={["hover"]}>
      <InfoCircleOutlined style={{ opacity: .4, ...style }} />
    </Tooltip>
  </span>
}