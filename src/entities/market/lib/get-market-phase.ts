export type MarketPhase = "trading" | "quiet_period" | "claiming" | "waiting" | "resumed";

export type MarketPhaseInput = {
  /** Unix seconds when the event takes place. */
  event_date: number;
  /** Seconds before the event during which trading is closed. */
  quiet_period?: number;
  /** Seconds after the event during which the oracle result is awaited. */
  waiting_period_length: number;
  /** Outcome posted by the oracle, if any. */
  result?: string | null;
};

export type MarketPhaseView = {
  phase: MarketPhase;
  /** Buying, redeeming and adding liquidity are possible. */
  isTradeActive: boolean;
  /** The oracle result may be committed into the market. */
  canCommitResult: boolean;
  /** Winners may claim their profit. */
  canClaim: boolean;
  /** Unix seconds the countdown of the current phase runs to, if the phase has one. */
  timerExpiry?: number;
};

/**
 * Lifecycle of a market relative to `now` (unix seconds):
 * trading → quiet period → (result posted: claiming) | waiting for results → resumed trading.
 */
export const getMarketPhase = ({ event_date, quiet_period = 0, waiting_period_length, result }: MarketPhaseInput, now: number): MarketPhaseView => {
  if (event_date - quiet_period > now) {
    return { phase: "trading", isTradeActive: true, canCommitResult: false, canClaim: false, timerExpiry: event_date };
  }

  if (event_date > now) {
    return { phase: "quiet_period", isTradeActive: false, canCommitResult: false, canClaim: false };
  }

  if (result) {
    return { phase: "claiming", isTradeActive: false, canCommitResult: false, canClaim: true };
  }

  if (event_date + waiting_period_length > now) {
    return { phase: "waiting", isTradeActive: false, canCommitResult: true, canClaim: false, timerExpiry: event_date + waiting_period_length };
  }

  return { phase: "resumed", isTradeActive: true, canCommitResult: true, canClaim: false };
};
