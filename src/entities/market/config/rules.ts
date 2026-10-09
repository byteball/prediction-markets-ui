// Domain rules that are configuration rather than code.

/**
 * FIFA World Cup matches kicking off before this moment belong to the group stage, where a draw is
 * possible; later matches are knockout games that cannot end in a draw. Kept as a mutable holder so
 * tests can override it; null disables draws for every World Cup match.
 */
export const ALLOW_DRAW_IN_FIFA_WORLD_CUP_BEFORE: { value: string | null } = { value: "2026-06-28T19:00:00Z" };
