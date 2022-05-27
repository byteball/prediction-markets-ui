import { List } from "antd";
import { PredictionItem } from "./PredictionItem";

export const PredictionList = ({ data: dataSource }) => <List
  dataSource={dataSource}
  renderItem={PredictionItem}
/>