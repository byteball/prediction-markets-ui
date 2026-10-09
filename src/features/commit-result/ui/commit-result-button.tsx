import { useTranslation } from "react-i18next";

import { generateLink, TRIGGER_ONLY_AMOUNT } from "@/shared/lib/generate-link";
import { useAppSelector } from "@/shared/lib/redux";
import { Button } from "@/shared/ui/button";
import { QRButton } from "@/shared/ui/qr-button/qr-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { selectActiveAddress, selectActiveDatafeedValue } from "@/entities/market";

/**
 * Commits the oracle's posted result into the opened market. Enabled only once the oracle has
 * published a value for the market's feed.
 */
export const CommitResultButton = () => {
  const { t } = useTranslation();
  const address = useAppSelector(selectActiveAddress);
  const datafeedValue = useAppSelector(selectActiveDatafeedValue);

  if (datafeedValue) {
    return (
      <QRButton size="lg" href={generateLink({ aa: address, amount: TRIGGER_ONLY_AMOUNT, data: { commit: 1 } })}>
        {t("pages.market.commit_result", "Commit result")}
      </QRButton>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button size="lg" variant="outline" disabled={true}>
            {t("pages.market.commit_result", "Commit result")}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{t("pages.market.not_published", "Oracle has not published results yet")}</TooltipContent>
    </Tooltip>
  );
};
