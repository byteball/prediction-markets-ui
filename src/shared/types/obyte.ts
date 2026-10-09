// Shapes of the Obyte protocol objects the app receives from the hub (light client subscriptions
// and the HTTP API). Nothing here is specific to prediction markets.

export type StateVarValue = string | number | boolean | { [key: string]: StateVarValue };

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

export type UpdatedStateVars = Record<string, Record<string, { value: StateVarValue; old_value?: StateVarValue; delta?: number }>>;

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

export type AAEventBody = { aa_address: string; unit?: ObyteUnit } & Partial<Omit<AAResponseBody, "aa_address">>;

export interface HubMessage {
  subject?: string;
  body?: AAEventBody;
}

/** One hub subscription event: [name, message]. */
export type HubEvent = [string, HubMessage];

export interface FactoryPredictionVar {
  yes_asset?: string;
  no_asset?: string;
  draw_asset?: string;
  is_tokenless?: boolean;
  [name: string]: StateVarValue | undefined;
}
