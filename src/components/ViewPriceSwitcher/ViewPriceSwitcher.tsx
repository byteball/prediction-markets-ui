import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import { changeViewType, selectPriceOrOdds } from "store/slices/settingsSlice";

import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const ViewPriceSwitcher = () => {
  const dispatch = useDispatch();
  const priceOrOdds = useSelector(selectPriceOrOdds);
  const { t } = useTranslation();
  const isOdds = priceOrOdds === "odds";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs select-none">
          <Switch size="sm" checked={isOdds} onCheckedChange={() => dispatch(changeViewType())} aria-label={t("view_price_switcher.desc", "Switch between displaying prices of Yes/No/Draw tokens and odds (as is common in sports betting)")} />
          <span className="text-muted-foreground">
            {isOdds ? t("view_price_switcher.odds", "odds") : t("view_price_switcher.prices", "prices")}
          </span>
        </label>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        {t("view_price_switcher.desc", "Switch between displaying prices of Yes/No/Draw tokens and odds (as is common in sports betting)")}
      </TooltipContent>
    </Tooltip>
  );
};
