import { useTranslation } from "react-i18next";

import { Result } from "@/components/ui/result";

export const WaitingPredictionMarket = () => {
  const { t } = useTranslation();

  return <Result status="loading" title={t("pages.create.creating", "Creating prediction market")} subTitle={t("pages.create.waiting", "Waiting for stabilization...")} />;
};
