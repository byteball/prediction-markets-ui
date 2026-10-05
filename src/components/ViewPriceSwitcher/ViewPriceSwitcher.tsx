import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Switch as SwitchPrimitive } from "radix-ui";

import { changeViewType, selectPriceOrOdds } from "store/slices/settingsSlice";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const ViewPriceSwitcher = () => {
  const dispatch = useDispatch();
  const priceOrOdds = useSelector(selectPriceOrOdds);
  const { t } = useTranslation();
  const isOdds = priceOrOdds === "odds";
  const description = t("view_price_switcher.desc", "Switch between displaying prices of Yes/No/Draw tokens and odds (as is common in sports betting)");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SwitchPrimitive.Root
          checked={isOdds}
          onCheckedChange={() => dispatch(changeViewType())}
          aria-label={description}
          className="group/switch relative inline-flex h-[22px] min-w-[44px] cursor-pointer items-center rounded-full bg-white/25 align-middle text-xs leading-none text-white transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-checked:bg-primary"
        >
          <span className="pointer-events-none block pr-[7px] pl-[25px] transition-[padding] group-aria-checked/switch:pr-[25px] group-aria-checked/switch:pl-[7px]">
            {isOdds ? t("view_price_switcher.odds", "odds") : t("view_price_switcher.prices", "prices")}
          </span>
          <SwitchPrimitive.Thumb className="pointer-events-none absolute top-[2px] left-[2px] size-[18px] rounded-full bg-white shadow-sm transition-[left,right] data-[state=checked]:left-auto data-[state=checked]:right-[2px]" />
        </SwitchPrimitive.Root>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{description}</TooltipContent>
    </Tooltip>
  );
};
