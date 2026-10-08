import moment from "moment";

import appConfig from "appConfig";
import http from "services/http";
import obyte from "services/obyte";

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

const isSportOracle = (oracle?: string) => !!oracle && appConfig.CATEGORIES.sport.oracles.some(({ address }) => address === oracle);

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

// Same loop as checkAndTransformSymbol in prophet-backend/db/api/registerSymbols.js: appends _2, _3... while the symbol is taken.
const checkAndTransformSymbol = async (symbol: string, tokenRegistry: string): Promise<string> => {
  const asset = await http.getAssetBySymbol(tokenRegistry, symbol);

  if (!asset) {
    return symbol;
  }

  const split = symbol.split("_");
  const hasNumber = !isNaN(Number(split[split.length - 1]));

  if (hasNumber) {
    const newNumber = split.length >= 2 && hasNumber ? Number(split[split.length - 1]) + 1 : 2;
    const transformedSymbol = (hasNumber ? split.slice(0, -1).join("_") : symbol) + "_" + newNumber;

    return await checkAndTransformSymbol(transformedSymbol, tokenRegistry);
  }

  return await checkAndTransformSymbol(`${symbol}_2`, tokenRegistry);
};

export const resolveTokenlessSymbols = async (params: GetTokenlessSymbolsParams): Promise<OutcomeSymbols> => {
  const tokenRegistry: string = obyte.api.getOfficialTokenRegistryAddress();
  const { yes_symbol, no_symbol, draw_symbol } = getTokenlessSymbols(params);

  const [yes, no, draw] = await Promise.all([checkAndTransformSymbol(yes_symbol, tokenRegistry), checkAndTransformSymbol(no_symbol, tokenRegistry), checkAndTransformSymbol(draw_symbol, tokenRegistry)]);

  return { yes_symbol: yes, no_symbol: no, draw_symbol: draw };
};
