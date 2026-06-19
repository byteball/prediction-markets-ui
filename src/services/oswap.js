import axios from "axios";

const instance = axios.create({ baseURL: "https://v2-data.oswap.io/api/v1" });

/**
 * Current GBYTE (base asset) price in USD, sourced exclusively from Oswap's
 * exchange-rates feed. The response is a flat map of `PAIR_QUOTE -> rate`, with
 * the GBYTE/USD rate under the `GBYTE_USD` key.
 *
 * @returns {Promise<number|undefined>}
 */
export const getBaseUsdRate = async () => {
  const { data } = await instance.get("/exchangeRates");
  return data?.GBYTE_USD;
};
