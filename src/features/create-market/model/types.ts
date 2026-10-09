export type CreationOrderStatus = "order" | "pending" | "created";

/** Parameters the user chose for a new market; sent to the factory AA. */
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

/** A market creation in progress: ordered → pending (factory request seen) → created (market deployed). */
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
