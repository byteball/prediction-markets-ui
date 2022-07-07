import { truncate } from "lodash";
import { encodeData } from "./encodeData";
import { generateLink } from "./generateLink";
import { generateTextEvent } from "./generateTextEvent";
import { getExchangeResult } from "./getExchangeResult";
import { getMarketPriceByType } from "./getMarketPriceByType";
import { getEmojiByType } from "./getTabNameByType";
import { responseToEvent } from "./responseToEvent";

export {
  encodeData,
  generateLink,
  getExchangeResult,
  getMarketPriceByType,
  responseToEvent,
  getEmojiByType,
  generateTextEvent,
  truncate
}