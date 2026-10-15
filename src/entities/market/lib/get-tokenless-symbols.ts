import { isSportOracle } from "@/entities/oracle/@x/market";

export type OutcomeSymbols = {
  yes_symbol: string;
  no_symbol: string;
  draw_symbol: string;
};

/**
 * Symbols for the outcomes of a tokenless market (it has no registered assets).
 * Sport markets use the team abbreviations from the feed name (`<championship>_<yes>_<no>_<date>`),
 * every other market uses plain YES / NO / DRAW.
 */
export const getTokenlessSymbols = ({ feed_name, oracle }: { feed_name: string; oracle?: string }): OutcomeSymbols => {
  const [, yes_team, no_team] = isSportOracle(oracle) ? feed_name.split("_") : [];

  return yes_team && no_team ? { yes_symbol: yes_team, no_symbol: no_team, draw_symbol: "DRAW" } : { yes_symbol: "YES", no_symbol: "NO", draw_symbol: "DRAW" };
};
