import type { CSSProperties, ReactNode } from "react";
import { Info } from "lucide-react";

import { useTapTooltip } from "@/hooks/use-tap-tooltip";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type InfoTooltipProps = {
  title: ReactNode;
  style?: CSSProperties;
};

export const InfoTooltip = ({ title, style = {} }: InfoTooltipProps) => {
  const { open, onOpenChange, triggerProps } = useTapTooltip();

  return (
    <span
      className="inline-flex align-middle"
      onClick={(e) => {
        e.nativeEvent.stopImmediatePropagation();
        e.stopPropagation();
      }}
    >
      <Tooltip open={open} onOpenChange={onOpenChange}>
        <TooltipTrigger asChild {...triggerProps}>
          <span className="inline-flex opacity-40" style={style}>
            <Info className="size-[1em]" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{title}</TooltipContent>
      </Tooltip>
    </span>
  );
};
