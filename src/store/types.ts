// Shared shapes of the data the store holds. Runtime values are unchanged from the
// JavaScript version; this file only names them.

import type { Candle as CurrencyCandle } from "services/marketData";

export type { CurrencyCandle };

/** A market outcome; also the value of the AA's `result` state var once the market is resolved. */
export type OutcomeType = "yes" | "no" | "draw";

/** A value of an AA state var (`prediction_<address>` on the factory is an object). */
export type StateVarValue = string | number | boolean | { [key: string]: StateVarValue };

/**
 * Parameters of the active market as the UI reads them: the AA definition params merged with the
 * token-registry info, the backend dates/odds/crests and the league (see `setActiveMarket`).
 */
export interface MarketParams {
  // AA definition params (defaults applied by setActiveMarket)
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
  /** `1`/`true` on the AA; absent when a draw is not allowed. */
  allow_draw?: boolean | number;
  quiet_period?: number;
  // token registry
  yes_symbol: string;
  no_symbol: string;
  draw_symbol?: string;
  reserve_symbol: string;
  yes_decimals: number;
  no_decimals: number;
  draw_decimals: number;
  reserve_decimals: number;
  // backend
  base_aa: string;
  created_at: number;
  committed_at?: number;
  first_trade_ts?: number;
  league?: string | null;
  league_emblem?: string | null;
  yes_odds: number | null;
  no_odds: number | null;
  draw_odds: number | null;
  yes_crest_url: string | null;
  no_crest_url: string | null;
}

/** State vars of a market AA. The supplies/reserve/coef appear after the first trade. */
export type MarketStateVars = {
  yes_asset: string;
  no_asset: string;
  draw_asset?: string;
  supply_yes?: number;
  supply_no?: number;
  supply_draw?: number;
  reserve?: number;
  coef?: number;
  result?: OutcomeType | null;
};

/** A team of a sport market (backend `/team/:sport/:abbreviation`). */
export interface Team {
  id: number | string;
  name: string;
  [key: string]: unknown;
}

/** One daily candle of a market (backend `/daily_candles/:address`). */
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

/**
 * A trade event of the active market: a backend `trades` row, or an event built from a live
 * `light/aa_response` (see `addRecentEvent`, which spreads the AA response vars into it).
 */
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

/** A reserve asset supported by the backend (`/reserve_assets`), keyed by asset id. */
export interface ReserveAsset {
  symbol: string;
  decimals: number;
}

export type ReserveAssets = Record<string, ReserveAsset>;

/** USD rate per reserve asset id. */
export type ReserveRates = Record<string, number>;

export type CreationOrderStatus = "order" | "pending" | "created";

/** The factory request data of a market being created (see CreateForm / CreateNowForm). */
export interface CreationOrderData {
  oracle: string;
  feed_name: string;
  reserve_asset: string;
  comparison: string;
  datafeed_value: string | number;
  datafeed_draw_value?: string | number;
  /** `YYYY-MM-DDTHH:mm:ss` (UTC). */
  event_date: string;
  waiting_period_length: number;
  issue_fee: number;
  redeem_fee: number;
  arb_profit_tax: number;
  allow_draw?: boolean | number;
  quiet_period: number;
  reserve_decimals?: number;
  yes_team?: string;
  no_team?: string;
}

/** A market creation in progress, persisted in `settings.creationOrder`. */
export interface CreationOrder {
  data: CreationOrderData;
  status: CreationOrderStatus;
  creation_unit_id?: string;
  prediction_address?: string;
  yes_asset?: string;
  no_asset?: string;
  /** `checkCreationOrder` stores `allow_draw && <asset>`, so a falsy marker is kept for no-draw markets. */
  draw_asset?: string | false | 0;
  yes_symbol?: string;
  no_symbol?: string;
  draw_symbol?: string;
  cancelRegSymbol?: boolean;
}

/** Balance of one asset in the user's wallet (`getBalances`). */
export interface AssetBalance {
  stable: number;
  pending: number;
  total?: number;
  is_private?: number;
}

/** Balances of a wallet address, keyed by asset id (`base` for bytes). */
export type WalletBalance = Record<string, AssetBalance | undefined>;

/** A Counterstake bridge whose foreign side is Obyte (`getBridges`). */
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

// ---- Obyte hub messages (`client.subscribe`) -------------------------------------------------

export interface ObytePaymentOutput {
  address: string;
  amount: number;
}

/** Payload of a unit message: an `outputs` list for payments, arbitrary data for `data` messages. */
export type ObyteMessagePayload = {
  asset?: string;
  outputs?: ObytePaymentOutput[];
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

/** Response vars of an AA response (market AAs emit the amounts, `next_coef`, `arb_profit_tax`, `profit`, ...). */
export interface AAResponseVars {
  profit?: number;
  next_coef?: number;
  arb_profit_tax?: number;
  [name: string]: string | number | boolean | undefined;
}

export interface AAResponse {
  responseVars?: AAResponseVars;
  error?: string;
}

/** Updated state vars of a `light/aa_response`, keyed by AA address then var name. */
export type UpdatedStateVars = Record<string, Record<string, { value: StateVarValue; old_value?: StateVarValue; delta?: number }>>;

/** Body of a `light/aa_response` justsaying. */
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

/** Body of a `light/aa_request` justsaying. */
export interface AARequestBody {
  aa_address: string;
  unit: ObyteUnit;
}

/** Body of an AA event as the subscriber sees it before the subject is known. */
export type AAEventBody = { aa_address: string; unit?: ObyteUnit } & Partial<Omit<AAResponseBody, "aa_address">>;

/** A message received through `client.subscribe` (the hub's envelope is loosely typed; requests have no subject). */
export interface HubMessage {
  subject?: string;
  body?: AAEventBody;
}

/** The value the factory stores under `prediction_<address>` once a market is created. */
export interface FactoryPredictionVar {
  yes_asset: string;
  no_asset: string;
  draw_asset?: string;
  [name: string]: StateVarValue | undefined;
}
