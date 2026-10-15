import type { MarketParams, Team } from "../model/types";

export type OutcomeLabels = { yes: string; no: string; draw: string };

export const getOutcomeLabels = (params: MarketParams, teams: { yes: Team | null; no: Team | null }): OutcomeLabels => ({
  yes: (params.is_tokenless && teams.yes?.name) || params.yes_symbol,
  no: (params.is_tokenless && teams.no?.name) || params.no_symbol,
  draw: params.draw_symbol ?? "DRAW",
});
