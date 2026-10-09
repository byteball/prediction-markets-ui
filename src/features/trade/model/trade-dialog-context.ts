import { createContext, useContext } from "react";

import type { OutcomeType } from "@/entities/market";

export type TradeAction = "buy" | "redeem";

/** What the opener asked for: a preselected outcome and/or action, both optional. */
export type TradeDialogRequest = { type?: OutcomeType; action?: TradeAction };

export type TradeDialogContextValue = {
  /** Address of the market the dialog belongs to; the dialog resets when it changes. */
  marketAddress: string | null | undefined;
  isOpen: boolean;
  request: TradeDialogRequest | null;
  open: (request?: TradeDialogRequest) => void;
  close: () => void;
};

export const TradeDialogContext = createContext<TradeDialogContextValue | null>(null);

export const useTradeDialog = (): TradeDialogContextValue => {
  const context = useContext(TradeDialogContext);

  if (!context) throw new Error("useTradeDialog must be used inside TradeDialogProvider");

  return context;
};
