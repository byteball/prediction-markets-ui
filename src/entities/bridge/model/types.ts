/** A Counterstake bridge between an EVM network and Obyte, as the SDK describes it. */
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
