import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { TradeDialogContext, type TradeDialogRequest } from "./trade-dialog-context";

/**
 * Open/close state of the trade dialog, shared by everything on a market page that can open it
 * (the Trade button, the buy/sell actions of the outcome cards). Navigating to another market
 * closes the dialog so its form state never leaks from market A to market B.
 */
export const TradeDialogProvider = ({ marketAddress, children }: { marketAddress: string | null | undefined; children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [request, setRequest] = useState<TradeDialogRequest | null>(null);

  useEffect(() => {
    setIsOpen(false);
    setRequest(null);
  }, [marketAddress]);

  const open = useCallback((nextRequest?: TradeDialogRequest) => {
    setRequest(nextRequest ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ marketAddress, isOpen, request, open, close }), [marketAddress, isOpen, request, open, close]);

  return <TradeDialogContext.Provider value={value}>{children}</TradeDialogContext.Provider>;
};
