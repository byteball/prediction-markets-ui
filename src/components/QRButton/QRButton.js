import React from "react";
import QRButtonEng from "obyte-qr-button";
import { Trans, useTranslation } from 'react-i18next';

export const QRButton = React.forwardRef(({config={}, ...props}, ref) => {
  const { t } = useTranslation();
  return <QRButtonEng ref={ref} {...props} config={
    {
      title: <Trans i18nKey="qr_button.title"><span>Scan this QR code <br /> with your mobile phone</span></Trans>,
      downloadTitle: t("qr_button.download_title", "Download Obyte wallet"),
      tooltip: t("qr_button.tooltip", "This will open your Obyte wallet installed on this computer and send the transaction"),
      tooltipMobile: t("qr_button.tooltip_mob", "Send the transaction from your mobile phone"),
      install: t("qr_button.install", "Install Obyte wallet for [ios] or [android] if you don't have one yet"),
      obyteIn: t("qr_button.obyte_in", "Obyte in"),
      ...config
    }
  } />;
});