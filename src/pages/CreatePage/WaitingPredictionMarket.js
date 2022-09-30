import { Result } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export const WaitingPredictionMarket = () => {
    const { t } = useTranslation();

    return (<Result
        icon={<LoadingOutlined />}
        title={t("pages.create.creating", "Creating prediction market")}
        subTitle={t("pages.create.waiting", "Waiting for stabilization...")}
    />)
}