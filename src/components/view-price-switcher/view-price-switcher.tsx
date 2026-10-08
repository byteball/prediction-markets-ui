import { useTranslation } from "react-i18next";
import { Switch as SwitchPrimitive } from "radix-ui";

import { changeViewType, selectPriceOrOdds } from "@/store/slices/settings-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useTapTooltip } from "@/hooks/use-tap-tooltip";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const ViewPriceSwitcher = () => {
  const dispatch = useAppDispatch();
  const priceOrOdds = useAppSelector(selectPriceOrOdds);
  const { t } = useTranslation();
  const { open, onOpenChange, triggerProps } = useTapTooltip();
  const isOdds = priceOrOdds === "odds";
  const description = t("view_price_switcher.desc", "Switch between displaying prices of Yes/No/Draw tokens and odds (as is common in sports betting)");

  return (
    <Tooltip open={open} onOpenChange={onOpenChange}>
      <TooltipTrigger asChild {...triggerProps}>
        <SwitchPrimitive.Root
          checked={isOdds}
          onClick={() => dispatch(changeViewType())}
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
