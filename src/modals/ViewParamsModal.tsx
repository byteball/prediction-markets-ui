import { useState } from "react";
import moment from "moment";
import { Helmet } from "react-helmet-async";
import ReactGA from "react-ga4";
import { useTranslation } from "react-i18next";

import { getParamList } from "forms/createParams";

import { getExplorerUrl } from "utils";

import { Button } from "@/components/ui/button";
import { ModalSheet } from "./ModalSheet";

type ViewParamsModalProps = {
  reserve_asset: string;
  allow_draw?: boolean | number;
  oracle: string;
  feed_name: string;
  comparison: string;
  datafeed_value: string | number;
  datafeed_draw_value?: string | number;
  event_date: number;
  waiting_period_length: number;
  issue_fee: number;
  redeem_fee: number;
  arb_profit_tax: number;
  aa_address: string;
  quiet_period?: number;
};


export const ViewParamsModal = ({
  reserve_asset,
  allow_draw,
  oracle,
  feed_name,
  comparison,
  datafeed_value,
  datafeed_draw_value,
  event_date,
  waiting_period_length,
  issue_fee,
  redeem_fee,
  arb_profit_tax,
  aa_address,
  quiet_period = 0,
}: ViewParamsModalProps) => {
  const [visible, setVisible] = useState(false);
  const paramList = getParamList();
  const { t } = useTranslation();

  const open = () => {
    setVisible(true);

    ReactGA.event({
      category: "user-engagement",
      action: "click-view-params",
    });
  };

  return (
    <>
      {visible && <Helmet title={`Prophet prediction markets — ${t("modals.view_params.title", "View params")}`} />}
      <Button size="sm" variant="link" onClick={open}>
        {t("modals.view_params.title", "View params")}
      </Button>
      <ModalSheet open={visible} onOpenChange={setVisible} title={t("modals.view_params.title", "View params")} headerClassName="pb-0">
        <div className="text-base">
          <p>
            <a href={getExplorerUrl("address", aa_address)} target="_blank" rel="noopener">
              {t("modals.view_params.explorer", "View AA on explorer")}
            </a>
          </p>
          <p>
            <b>{paramList.reserve_asset.name}: </b>
            {reserve_asset}
          </p>
          <p>
            <b>{paramList.allow_draw.name}: </b>
            {allow_draw ? t("common.yes", "yes") : t("common.no", "no")}
          </p>
          <p>
            <b>{paramList.oracle.name}: </b>
            <a href={getExplorerUrl("address", oracle)} target="_blank" rel="noopener">
              {oracle}
            </a>
          </p>
          <p>
            <b>{paramList.feed_name.name}: </b>
            {feed_name}
          </p>
          <p>
            <b>{paramList.comparison.name}: </b>
            {comparison}
          </p>
          <p>
            <b>{paramList.datafeed_value.name}: </b>
            {datafeed_value}
          </p>
          {allow_draw && (
            <p>
              <b>{paramList.datafeed_draw_value.name}: </b>
              {datafeed_draw_value}
            </p>
          )}
          <p>
            <b>{paramList.event_date.name}: </b>
            {moment.unix(event_date).format("lll")}
          </p>
          <p>
            <b>{paramList.waiting_period_length.name}: </b>
            {+Number(waiting_period_length / (24 * 3600)).toFixed(3)} {t("common.days", "days")}
          </p>
          <p>
            <b>{paramList.quiet_period.name}: </b>
            {+Number(quiet_period / 3600).toFixed(3)} {t("common.hours", "hours")}
          </p>
          <p>
            <b>{paramList.issue_fee.name}: </b>
            {issue_fee * 100}%
          </p>
          <p>
            <b>{paramList.redeem_fee.name}: </b>
            {redeem_fee * 100}%
          </p>
          <p>
            <b>{paramList.arb_profit_fee.name} </b>
            {arb_profit_tax * 100}%
          </p>
        </div>
      </ModalSheet>
    </>
  );
};
