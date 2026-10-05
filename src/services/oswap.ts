import axios from "axios";

const instance = axios.create({ baseURL: "https://v2-data.oswap.io/api/v1" });

/** Flat map of `PAIR_QUOTE -> rate`, e.g. `{ GBYTE_USD: 5.07, BTC_USD: 62661 }`. */
type ExchangeRates = Record<string, number | undefined>;

/**
 * Current GBYTE (base asset) price in USD, sourced exclusively from Oswap's
 * exchange-rates feed. The response is a flat map of `PAIR_QUOTE -> rate`, with
 * the GBYTE/USD rate under the `GBYTE_USD` key.
 */
export const getBaseUsdRate = async (): Promise<number | undefined> => {
  const { data } = await instance.get<ExchangeRates | undefined>("/exchangeRates");
  return data?.GBYTE_USD;
};
