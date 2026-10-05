import type { ReactNode } from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type ModalSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
};

/**
 * The right-side panel every modal of the app used to render with antd `Drawer` (width 640, full
 * width on phones). Content is scrollable; the title is a real heading for screen readers.
 */
export const ModalSheet = ({ open, onOpenChange, title, description, children }: ModalSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-6 data-[side=right]:sm:max-w-[640px]">
      <SheetHeader className="p-0 pb-4">
        <SheetTitle className="text-2xl font-semibold">{title}</SheetTitle>
        {description ? <SheetDescription>{description}</SheetDescription> : <SheetDescription className="sr-only">{title}</SheetDescription>}
      </SheetHeader>
      {children}
    </SheetContent>
  </Sheet>
);
