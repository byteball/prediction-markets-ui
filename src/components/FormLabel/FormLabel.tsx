import type { ReactNode } from "react";

import { InfoTooltip } from "components/InfoTooltip/InfoTooltip";

type FormLabelProps = {
  info?: ReactNode | ((value: unknown) => ReactNode);
  children?: ReactNode;
  value?: unknown;
};

export const FormLabel = ({ info, children, value }: FormLabelProps) => {
  const transformInfo = typeof info === "function" ? info(value) : info;

  return (
    <span>
      {children !== undefined && <span className="text-muted-foreground">{children} </span>}
      {transformInfo ? <InfoTooltip title={transformInfo} /> : null}
    </span>
  );
};
