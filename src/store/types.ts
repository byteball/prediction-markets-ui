import type { Candle as CurrencyCandle } from "services/marketData";

export type { CurrencyCandle };

export type OutcomeType = "yes" | "no" | "draw";

export type StateVarValue = string | number | boolean | { [key: string]: StateVarValue };

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

export type ReserveAssets = Record<string, { symbol: string; decimals: number }>;

export type MarketDates = { created_at: number; committed_at?: number };

export type ReserveRates = Record<string, number>;

type CreationOrderStatus = "order" | "pending" | "created";

export interface CreationOrderData {
  oracle: string;
  feed_name: string;
  reserve_asset: string;
  comparison: string;
  datafeed_value: string | number;
  datafeed_draw_value?: string | number;
  event_date: string;
  waiting_period_length: number;
  issue_fee: number;
  redeem_fee: number;
  arb_profit_tax: number;
  allow_draw?: boolean | number;
  is_tokenless?: boolean;
  quiet_period: number;
  reserve_decimals?: number;
  yes_team?: string;
  no_team?: string;
}

export interface CreationOrder {
  data: CreationOrderData;
  status: CreationOrderStatus;
  creation_unit_id?: string;
  prediction_address?: string;
  yes_asset?: string;
  no_asset?: string;
  draw_asset?: string;
  yes_symbol?: string;
  no_symbol?: string;
  draw_symbol?: string;
}

export type WalletBalance = Record<string, { stable: number; pending: number; total?: number; is_private?: number } | undefined>;

export interface Bridge {
  bridge_id: number;
  home_network: string;
  home_asset: string;
  home_asset_decimals: number;
  home_symbol: string;
  foreign_network: string;
  foreign_asset: string;
  foreign_asset_decimals: number;
  foreign_symbol: string;
}

export type ObyteMessagePayload = {
  asset?: string;
  outputs?: { address: string; amount: number }[];
} & Record<string, unknown>;

export interface ObyteMessage {
  app: string;
  payload_location?: string;
  payload_hash?: string;
  payload: ObyteMessagePayload;
}

export type ObyteUnit = {
  unit: string;
  messages: ObyteMessage[];
  authors?: { address: string }[];
  timestamp?: number;
};

export interface AAResponseVars {
  profit?: number;
  next_coef?: number;
  arb_profit_tax?: number;
  [name: string]: string | number | boolean | undefined;
}

interface AAResponse {
  responseVars?: AAResponseVars;
  error?: string;
}

type UpdatedStateVars = Record<string, Record<string, { value: StateVarValue; old_value?: StateVarValue; delta?: number }>>;

export interface AAResponseBody {
  aa_address: string;
  trigger_address: string;
  trigger_unit: string;
  trigger_initial_unit?: string;
  bounced: boolean;
  response: AAResponse;
  response_unit?: string | null;
  timestamp: number;
  updatedStateVars?: UpdatedStateVars;
  objResponseUnit?: ObyteUnit | null;
}

type AAEventBody = { aa_address: string; unit?: ObyteUnit } & Partial<Omit<AAResponseBody, "aa_address">>;

export interface HubMessage {
  subject?: string;
  body?: AAEventBody;
}

export interface FactoryPredictionVar {
  yes_asset?: string;
  no_asset?: string;
  draw_asset?: string;
  is_tokenless?: boolean;
  [name: string]: StateVarValue | undefined;
}
