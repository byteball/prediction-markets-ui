import type { Candle as CurrencyCandle } from "@/shared/api/market-data";

export type { CurrencyCandle };

export type OutcomeType = "yes" | "no" | "draw";

/** AA parameters of a market plus what the app resolves around them (symbols, decimals, league, odds). */
export interface MarketParams {
  oracle: string;
  feed_name: string;
  reserve_asset: string;
  comparison: string;
  datafeed_value: string | number;
  datafeed_draw_value?: string | number;
  event_date: number;
  waiting_period_length: number;
  issue_fee: number;
  redeem_fee: number;
  arb_profit_tax: number;
  allow_draw?: boolean | number;
  is_tokenless?: boolean;
  quiet_period?: number;
  yes_symbol: string;
  no_symbol: string;
  draw_symbol?: string;
  reserve_symbol: string;
  yes_decimals: number;
  no_decimals: number;
  draw_decimals: number;
  reserve_decimals: number;
  base_aa: string;
  created_at: number;
  committed_at?: number;
  first_trade_ts?: number | null;
  league?: string | null;
  league_emblem?: string | null;
  yes_odds: number | null;
  no_odds: number | null;
  draw_odds: number | null;
  yes_crest_url: string | null;
  no_crest_url: string | null;
}

export type OutcomeAmounts = { yes: number; no: number; draw: number };

export type MarketStateVars = {
  yes_asset?: string;
  no_asset?: string;
  draw_asset?: string;
  supplies?: OutcomeAmounts;
  supply_yes?: number;
  supply_no?: number;
  supply_draw?: number;
  reserve?: number;
  coef?: number;
  result?: OutcomeType | null;
  [balanceVar: `balance_${string}`]: OutcomeAmounts | undefined;
};

export interface Team {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

export type Candle = {
  aa_address?: string;
  start_timestamp: number;
  open_supply_yes: number;
  open_supply_no: number;
  open_supply_draw: number;
  open_yes_price: number;
  open_no_price: number;
  open_draw_price: number;
  open_reserve: number;
  open_coef: number;
  close_supply_yes: number;
  close_supply_no: number;
  close_supply_draw: number;
  close_yes_price: number;
  close_no_price: number;
  close_draw_price: number;
  close_reserve: number;
  close_coef: number;
  reserve_to_usd_rate?: number | null;
};

export type RecentEventType = "add_liquidity" | "buy_by_type" | "buy" | "redeem" | "claim_profit";

export interface RecentEvent {
  type: RecentEventType;
  aa_address: string;
  trigger_unit: string;
  trigger_address: string;
  response_unit?: string | null;
  timestamp: number;
  reserve_amount: number;
  yes_amount: number;
  no_amount: number;
  draw_amount: number;
  supply_yes?: number;
  supply_no?: number;
  supply_draw?: number;
  yes_price?: number;
  no_price?: number;
  draw_price?: number;
  reserve?: number;
  coef?: number;
  [responseVar: string]: unknown;
}

export type MarketDates = { created_at: number; committed_at?: number };

/** A market as the backend lists it (GET /markets) — a flat summary, not the full AA state. */
export type MarketListItem = {
  aa_address?: string;
  reserve_asset?: string;
  reserve?: number;
  reserve_decimals?: number;
  reserve_symbol?: string;
  yes_price?: number;
  no_price?: number;
  draw_price?: number;
  allow_draw?: boolean | number;
  event_date: number;
  /** Daily YES price history for the sparkline. */
  candles?: { price: number }[];
  yes_symbol?: string;
  is_tokenless?: boolean | number;
  result?: OutcomeType | null;
  waiting_period_length?: number;
  quiet_period?: number;
  feed_name?: string;
  /** Calendar entries carry the value the oracle is expected to compare against. */
  expect_datafeed_value?: string | number;
  datafeed_value?: string | number;
  oracle?: string;
  comparison?: string;
  yes_team_id?: number | string;
  no_team_id?: number | string;
  yes_team?: string;
  no_team?: string;
  yes_crest_url?: string | null;
  no_crest_url?: string | null;
  league?: string;
  supply_yes?: number;
  supply_no?: number;
  supply_draw?: number;
  coef?: number;
  apy?: number;
};

/**
 * A calendar entry (GET /calendar): an upcoming event that may or may not have a market yet.
 * Same shape as a listed market; `aa_address` is absent when the market has not been created.
 */
export type CalendarItem = MarketListItem;
