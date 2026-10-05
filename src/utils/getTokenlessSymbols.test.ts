import appConfig from "appConfig";

import { getTokenlessSymbols } from "./getTokenlessSymbols";

describe("getTokenlessSymbols", () => {
  it("names currency outcomes by feed, UTC date and time, like the registered GBYTE_USD_2024-02-29-0431_YES", () => {
    expect(getTokenlessSymbols({ feed_name: "GBYTE_USD", event_date: 1709181060, oracle: "F4KHJUCLJKY4JV7M5F754LAJX4EB7M4N" })).toEqual({
      yes_symbol: "GBYTE_USD_2024-02-29-0431_YES",
      no_symbol: "GBYTE_USD_2024-02-29-0431_NO",
      draw_symbol: "GBYTE_USD_2024-02-29-0431_DRAW",
    });
  });

  it("drops the time part at midnight UTC, like ETH_BTC_2026-05-01_YES", () => {
    expect(getTokenlessSymbols({ feed_name: "ETH_BTC", event_date: 1777593600 }).yes_symbol).toBe("ETH_BTC_2026-05-01_YES");
  });

  it("accepts the creation-order date string", () => {
    expect(getTokenlessSymbols({ feed_name: "ETH_BTC", event_date: "2026-05-01T00:00:00" }).no_symbol).toBe("ETH_BTC_2026-05-01_NO");
  });

  it("names sport outcomes by the team abbreviations in the feed name", () => {
    const oracle = appConfig.CATEGORIES.sport.oracles[0].address;

    expect(getTokenlessSymbols({ feed_name: "CL_FER_QAR_2022-08-09", event_date: 1660068000, oracle })).toEqual({
      yes_symbol: "CL_FER_QAR_2022-08-09_FER",
      no_symbol: "CL_FER_QAR_2022-08-09_QAR",
      draw_symbol: "CL_FER_QAR_2022-08-09_DRAW",
    });
  });
});
