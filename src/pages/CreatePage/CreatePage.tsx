import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import { CreateForm } from "forms";
import { removeCreationOrder, selectCreationOrder } from "store/slices/settingsSlice";
import { WaitingPredictionMarket } from "./WaitingPredictionMarket";
import { PageProvider } from "components/PageProvider/PageProvider";

import { Button } from "@/components/ui/button";
import { Result } from "@/components/ui/result";

export const CreatePage = () => {
  const creationOrder = useSelector(selectCreationOrder);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  return (
    <>
      <h1 className="mb-[0.5em] text-[44px] leading-[1.23] font-semibold">{t("pages.create.title", "Create new prediction market")}</h1>
      <Helmet title={`Prophet prediction markets — ${t("pages.create.short_title", "Create new market")}`} />

      <PageProvider />

      {!creationOrder || creationOrder.status === "order" ? (
        <CreateForm />
      ) : (
        <div>
          {creationOrder.status === "pending" && <WaitingPredictionMarket />}
          {creationOrder.status === "created" && (
            <Result
              status="success"
              title={t("pages.create.successfully", "Prediction market created successfully")}
              extra={
                <Button variant="outline" asChild onClick={() => dispatch(removeCreationOrder())}>
                  <Link to={`/market/${creationOrder.prediction_address}`}>{t("pages.create.go_to_market", "Go to the market")}</Link>
                </Button>
              }
            />
          )}
        </div>
      )}
    </>
  );
};
