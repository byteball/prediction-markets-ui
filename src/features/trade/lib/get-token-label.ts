import type { OutcomeType } from "@/entities/market";

type Token = { symbol: string; type: OutcomeType };

/**
 * Label of a registered outcome token in the trade forms.
 * Sport market: `Mexico (MEXWC)`, other markets: `BTCUP (YES-token)`.
 */
export const getTokenLabel = (token: Token, yes_team?: string, no_team?: string): string => {
  if (!yes_team || !no_team) {
    return `${token.symbol} (${token.type.toUpperCase()}-token)`;
  }

  const outcomeNames = { yes: yes_team, no: no_team, draw: "Draw" };

  return `${outcomeNames[token.type]} (${token.symbol})`;
};
