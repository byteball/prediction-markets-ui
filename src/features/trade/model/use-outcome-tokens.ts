import { useEffect, useMemo, useState } from "react";

import { useAppSelector } from "@/shared/lib/redux";
import { selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars, type OutcomeType } from "@/entities/market";

export type OutcomeToken = { symbol: string; asset?: string; type: OutcomeType; decimals: number };

/**
 * The outcome tokens of the opened market (YES, NO and DRAW when allowed) and the currently
 * selected one. The selection follows `preselected` and resets when the market changes.
 */
export const useOutcomeTokens = (preselected?: OutcomeType) => {
  const address = useAppSelector(selectActiveAddress);
  const { yes_symbol, no_symbol, draw_symbol, allow_draw, yes_decimals, no_decimals, draw_decimals } = useAppSelector(selectActiveMarketParams);
  const { yes_asset, no_asset, draw_asset } = useAppSelector(selectActiveMarketStateVars);

  const tokens = useMemo<OutcomeToken[]>(() => {
    const list: OutcomeToken[] = [
      { symbol: yes_symbol, asset: yes_asset, type: "yes", decimals: yes_decimals },
      { symbol: no_symbol, asset: no_asset, type: "no", decimals: no_decimals },
    ];

    if (allow_draw) {
      list.push({ symbol: draw_symbol!, asset: draw_asset, decimals: draw_decimals, type: "draw" });
    }

    return list;
  }, [yes_symbol, no_symbol, draw_symbol, allow_draw, yes_asset, no_asset, draw_asset, yes_decimals, no_decimals, draw_decimals]);

  const [currentType, setCurrentType] = useState<OutcomeType | undefined>(preselected);

  useEffect(() => {
    setCurrentType(preselected);
  }, [address, preselected]);

  const currentToken = tokens.find((token) => token.type === currentType) ?? tokens[0];

  return { tokens, currentToken, selectToken: setCurrentType };
};
