import type { ReactNode } from "react";
import { cn } from "cn";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "components/ui/sheet";

type ModalSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  headerClassName?: string;
  children: ReactNode;
};

export const ModalSheet = ({ open, onOpenChange, title, description, headerClassName, children }: ModalSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-6 data-[side=right]:sm:max-w-[640px]">
      <SheetHeader className={cn("p-0 pb-4", headerClassName)}>
        <SheetTitle className="text-[35px] font-semibold leading-[1.35] text-white/85">{title}</SheetTitle>
        {description ? <SheetDescription>{description}</SheetDescription> : <SheetDescription className="sr-only">{title}</SheetDescription>}
      </SheetHeader>
      {children}
    </SheetContent>
  </Sheet>
);
