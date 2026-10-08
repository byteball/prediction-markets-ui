import obyte from "obyte";

export type ObyteHubApi = {
  heartbeat(): void;
  getOfficialTokenRegistryAddress(): string;
  getDataFeed(params: { oracles: string[]; feed_name: string; ifnone?: string | number | boolean }): Promise<unknown>;
  getSymbolByAsset(tokenRegistryAddress: string, asset: string): Promise<string>;
  getAssetBySymbol(tokenRegistryAddress: string, symbol: string): Promise<string | null>;
  getBalances(addresses: string[]): Promise<Record<string, Record<string, { stable: number; pending: number; total?: number }>> | undefined>;
  getAaResponseChain(params: { trigger_unit: string }): Promise<unknown[]>;
  getJoint(unit: string): Promise<{ joint: { unit: Record<string, unknown> & { unit: string } } }>;
};

export type ObyteClient = {
  api: ObyteHubApi;
  client: { ws: WebSocket };
  onConnect(cb: () => void): void;
  subscribe(cb: (err: unknown, result: unknown) => void): void;
  justsaying(subject: string, body?: unknown): void;
};

const client: ObyteClient = new obyte.Client(
  `wss://obyte.org/bb${import.meta.env.REACT_APP_ENVIRONMENT === "testnet" ? "-test" : ""}`,
  {
    testnet: import.meta.env.REACT_APP_ENVIRONMENT === "testnet",
    reconnect: true,
  }
);

export default client;
