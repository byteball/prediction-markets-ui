import type { CSSProperties, ReactNode } from "react";
import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type InfoTooltipProps = {
  title: ReactNode;
  style?: CSSProperties;
};

export const InfoTooltip = ({ title, style = {} }: InfoTooltipProps) => {
  return (
    <span
      className="inline-flex align-middle"
      onClick={(e) => {
        e.nativeEvent.stopImmediatePropagation();
        e.stopPropagation();
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex opacity-40" style={style}>
            <Info className="size-[1em]" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{title}</TooltipContent>
      </Tooltip>
    </span>
  );
};
