import moment from "moment";

import appConfig from "appConfig";

// Draws are allowed for every sport league except the FIFA World Cup knockout (playoff) stage,
// where a match can no longer end in a draw. World Cup matches kicking off before the configured
// cutoff (group stage) keep draws enabled; later matches (playoff) have draws disabled.
export const isDrawAllowed = (league, eventDate) => {
  if (league !== "FIFA World Cup") return true;

  const cutoff = appConfig.ALLOW_DRAW_IN_FIFA_WORLD_CUP_BEFORE;
  if (!cutoff) return false;

  return moment.unix(eventDate).isBefore(moment.utc(cutoff));
};
