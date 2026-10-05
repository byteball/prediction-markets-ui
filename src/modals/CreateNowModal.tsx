import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import { CreateNowForm } from "forms";
import type { CreateNowFormProps } from "forms/CreateNowForm";

import { Button } from "@/components/ui/button";
import { ModalSheet } from "./ModalSheet";

type CreateNowModalProps = CreateNowFormProps;

export const CreateNowModal = (props: CreateNowModalProps) => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      {visible && <Helmet title={`Prophet prediction markets — ${t("modals.create_now.title", "Create market")}`} />}
      <Button size="lg" onClick={() => setVisible(true)}>
        {t("modals.create_now.title", "Create market")}
      </Button>
      <ModalSheet open={visible} onOpenChange={setVisible} title={t("modals.create_now.title", "Create market")}>
        <CreateNowForm key={`${props.feed_name} ${props.event_date} ${props.expect_datafeed_value}`} {...props} />
        <Outlet />
      </ModalSheet>
    </>
  );
};
