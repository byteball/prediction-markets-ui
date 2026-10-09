import moment from "moment";

import { isSportOracle } from "@/entities/oracle/@x/market";

export type OutcomeSymbols = {
  yes_symbol: string;
  no_symbol: string;
  draw_symbol: string;
};

type GetTokenlessSymbolsParams = {
  feed_name: string;
  event_date: number | string;
  oracle?: string;
};


export const getTokenlessSymbols = ({ feed_name, event_date, oracle }: GetTokenlessSymbolsParams): OutcomeSymbols => {
  if (isSportOracle(oracle)) {
    const [, yes_team, no_team] = feed_name.split("_");

    return {
      yes_symbol: `${feed_name}_${yes_team}`,
      no_symbol: `${feed_name}_${no_team}`,
      draw_symbol: `${feed_name}_DRAW`,
    };
  }

  const date = typeof event_date === "number" ? moment.unix(event_date).utc() : moment.utc(event_date, "YYYY-MM-DDTHH:mm:ss");
  const dateView = date.format(date.hours() === 0 && date.minutes() === 0 ? "YYYY-MM-DD" : "YYYY-MM-DD-hhmm");

  return {
    yes_symbol: `${feed_name}_${dateView}_YES`,
    no_symbol: `${feed_name}_${dateView}_NO`,
    draw_symbol: `${feed_name}_${dateView}_DRAW`,
  };
};
