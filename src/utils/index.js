import { truncate } from "lodash";
import { encodeData } from "./encodeData";
import { generateLink } from "./generateLink";
import { generateTextEvent } from "./generateTextEvent";
import { getEstimateAPY } from "./getEstimateAPY";
import { getExchangeResult } from "./getExchangeResult";
import { getMarketPriceByType } from "./getMarketPriceByType";
import { getEmojiByType } from "./getTabNameByType";

export {
  encodeData,
  generateLink,
  getExchangeResult,
  getMarketPriceByType,
  getEmojiByType,
  generateTextEvent,
  truncate,
  getEstimateAPY
}