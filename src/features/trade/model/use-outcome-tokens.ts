import { useEffect, useMemo, useState } from "react";

import { useAppSelector } from "@/shared/lib/redux";
import { selectActiveAddress, selectActiveMarketParams, selectActiveMarketStateVars, selectActiveOutcomeLabels, selectActiveTeams, type OutcomeType } from "@/entities/market";

import { getTokenLabel } from "../lib/get-token-label";

export type OutcomeToken = { symbol: string; label: string; asset?: string; type: OutcomeType; decimals: number };

/**
 * The outcome tokens of the opened market (YES, NO and DRAW when allowed) and the currently
 * selected one. The selection follows `preselected` and resets when the market changes.
 */
export const useOutcomeTokens = (preselected?: OutcomeType) => {
  const address = useAppSelector(selectActiveAddress);
  const { yes_symbol, no_symbol, draw_symbol, allow_draw, yes_decimals, no_decimals, draw_decimals, is_tokenless } = useAppSelector(selectActiveMarketParams);
  const { yes_asset, no_asset, draw_asset } = useAppSelector(selectActiveMarketStateVars);
  const labels = useAppSelector(selectActiveOutcomeLabels);
  const teams = useAppSelector(selectActiveTeams);

  const tokens = useMemo<OutcomeToken[]>(() => {
    const list = [
      { symbol: yes_symbol, asset: yes_asset, type: "yes" as const, decimals: yes_decimals },
      { symbol: no_symbol, asset: no_asset, type: "no" as const, decimals: no_decimals },
      ...(allow_draw ? [{ symbol: draw_symbol!, asset: draw_asset, type: "draw" as const, decimals: draw_decimals }] : []),
    ];

    // A tokenless market has no registered tokens, so its outcomes are shown by their plain labels.
    return list.map((token) => ({ ...token, label: is_tokenless ? labels[token.type] : getTokenLabel(token, teams.yes?.name, teams.no?.name) }));
  }, [yes_symbol, no_symbol, draw_symbol, allow_draw, yes_asset, no_asset, draw_asset, yes_decimals, no_decimals, draw_decimals, is_tokenless, labels, teams]);

  const [currentType, setCurrentType] = useState<OutcomeType | undefined>(preselected);

  useEffect(() => {
    setCurrentType(preselected);
  }, [address, preselected]);

  const currentToken = tokens.find((token) => token.type === currentType) ?? tokens[0];

  return { tokens, currentToken, selectToken: setCurrentType };
};
