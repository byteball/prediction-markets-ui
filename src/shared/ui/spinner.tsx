import type { ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "cn";

export const Spinner = ({ className, ...props }: ComponentProps<typeof Loader2>) => <Loader2 className={cn("size-8 animate-spin text-primary", className)} aria-label="loading" {...props} />;

/** Centered spinner for a loading block or page. */
export const SpinnerBlock = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("flex justify-center py-10", className)} {...props}>
    <Spinner />
  </div>
);
