import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type FormLabelProps = {
  info?: ReactNode | ((value: unknown) => ReactNode);
  children?: ReactNode;
  value?: unknown;
};

export const FormLabel = ({ info, children, value }: FormLabelProps) => {
  const transformInfo = typeof info === "function" ? info(value) : info;

  return (
    <span
      onClick={(e) => {
        e.nativeEvent.stopImmediatePropagation();
        e.stopPropagation();
      }}
    >
      {children !== undefined && <span className="text-muted-foreground">{children} </span>}

      {transformInfo ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex align-middle opacity-40">
              <Info className="size-[1em]" aria-hidden="true" />
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">{transformInfo}</TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
};
