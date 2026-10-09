import type { OutcomeType } from "@/entities/market";

export const tokenLabel = (token: { symbol: string; type: OutcomeType }, yes_team?: string, no_team?: string): string =>
  yes_team && no_team ? `${token.type === "draw" ? "Draw" : token.type === "yes" ? yes_team : no_team} (${token.symbol})` : `${token.symbol} (${token.type.toUpperCase()}-token)`;
