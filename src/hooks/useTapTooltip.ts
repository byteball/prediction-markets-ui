import { useState, type MouseEvent, type PointerEvent } from "react";

// Radix Tooltip closes on pointerdown/click and never opens from a tap; preventDefault() skips those internal handlers so the trigger can toggle a controlled open.
export const useTapTooltip = () => {
  const [open, setOpen] = useState(false);

  const triggerProps = {
    onPointerDown: (e: PointerEvent) => e.preventDefault(),
    onPointerLeave: (e: PointerEvent) => {
      if (e.pointerType === "touch") e.preventDefault();
    },
    onClick: (e: MouseEvent) => {
      e.preventDefault();
      setOpen((isOpen) => !isOpen);
    },
  };

  return { open, onOpenChange: setOpen, triggerProps };
};
