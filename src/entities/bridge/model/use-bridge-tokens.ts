import { useMemo } from "react";

import { useAppSelector } from "@/shared/lib/redux";

import { selectTokensByNetwork } from "./bridges-slice";

/** A token the user may pay with: the reserve asset on Obyte, or an EVM token bridged through Counterstake. */
export type FromToken = { asset: string; decimals: number; symbol: string; foreign_asset: string; network: string };

export type FromTokenOption = { value: string; label: string; text: string; group: string };

const SEPARATOR = "__";

/** Serialises a token into the combobox option value (and back). */
export const encodeFromToken = ({ network, asset, decimals, foreign_asset, symbol }: FromToken): string => [network, asset, decimals, foreign_asset, symbol].join(SEPARATOR);

export const decodeFromToken = (value: string): FromToken => {
  const [network, asset, decimals, foreign_asset, ...symbol] = value.split(SEPARATOR);

  return { asset, decimals: Number(decimals || 0), symbol: symbol.join(SEPARATOR), network, foreign_asset };
};

export const obyteReserveToken = (reserve: { asset: string; decimals: number; symbol: string }): FromToken => ({ asset: reserve.asset, decimals: reserve.decimals, symbol: reserve.symbol, foreign_asset: "no", network: "Obyte" });

/** Combobox options: the market's reserve asset first, then every bridged EVM token grouped by network. */
export const useBridgeTokenOptions = (reserve: { asset: string; decimals: number; symbol: string }): FromTokenOption[] => {
  const tokensByNetwork = useAppSelector(selectTokensByNetwork);

  return useMemo(
    () => [
      { value: encodeFromToken(obyteReserveToken(reserve)), label: reserve.symbol, text: reserve.symbol, group: "Obyte" },
      ...Object.entries(tokensByNetwork).flatMap(([network, items]) =>
        items.map((item) => ({
          value: encodeFromToken({ network, asset: item.home_asset, decimals: item.home_asset_decimals, foreign_asset: item.foreign_asset, symbol: item.home_symbol }),
          label: item.home_symbol,
          text: item.home_symbol,
          group: network,
        }))
      ),
    ],
    [tokensByNetwork, reserve.asset, reserve.decimals, reserve.symbol]
  );
};
