import { truncate } from "lodash-es";
import { capitalizeFirstLetter } from "./capitalizeFirstLetter";
import { encodeData } from "./encodeData";
import { generateLink } from "./generateLink";
import { generateTextEvent } from "./generateTextEvent";
import { getEstimatedAPY } from "./getEstimatedAPY";
import { getExchangeResult } from "./getExchangeResult";
import { getMarketPriceByType } from "./getMarketPriceByType";
import { getEmojiByType, getSportNameByType } from "./getTabNameByType";
import { transformChampionshipName } from "./transformChampionshipName";
import { getOracleName } from "./getOracleName";
import { getCategoryName } from "./getCategoryName";
import { getAlternatePaths, getAlternateMetaList } from "./getAlternatePaths";
import { botCheck } from "./botCheck";
import { isDrawAllowed } from "./isDrawAllowed";
import { getTokenlessSymbols, resolveTokenlessSymbols } from "./getTokenlessSymbols";
import { normalizeStateVars } from "./normalizeStateVars";

export {
  encodeData,
  getTokenlessSymbols,
  resolveTokenlessSymbols,
  normalizeStateVars,
  generateLink,
  getExchangeResult,
  getMarketPriceByType,
  getEmojiByType,
  generateTextEvent,
  truncate,
  getEstimatedAPY,
  transformChampionshipName,
  capitalizeFirstLetter,
  getSportNameByType,
  getOracleName,
  getCategoryName,
  getAlternatePaths,
  getAlternateMetaList,
  botCheck,
  isDrawAllowed
}