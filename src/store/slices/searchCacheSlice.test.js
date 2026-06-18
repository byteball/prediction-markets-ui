import reducer, { cacheSearchResult, clearSearchCache, selectSearchCache } from "./searchCacheSlice";

describe("searchCacheSlice", () => {
  it("stores a resolved id under provider + symbol", () => {
    const state = reducer(undefined, cacheSearchResult({ provider: "coingecko", symbol: "BTC", key: "bitcoin" }));
    expect(state.results).toEqual({ coingecko: { BTC: "bitcoin" } });
  });

  it("keeps the same symbol separate per provider", () => {
    let state = reducer(undefined, cacheSearchResult({ provider: "coingecko", symbol: "BTC", key: "bitcoin" }));
    state = reducer(state, cacheSearchResult({ provider: "coinpaprika", symbol: "BTC", key: "btc-bitcoin" }));

    expect(state.results.coingecko.BTC).toBe("bitcoin");
    expect(state.results.coinpaprika.BTC).toBe("btc-bitcoin");
  });

  it("ignores incomplete payloads", () => {
    expect(reducer(undefined, cacheSearchResult({ provider: "coingecko", symbol: "BTC" })).results).toEqual({});
    expect(reducer(undefined, cacheSearchResult({ symbol: "BTC", key: "bitcoin" })).results).toEqual({});
    expect(reducer(undefined, cacheSearchResult(undefined)).results).toEqual({});
  });

  it("clears the cache", () => {
    let state = reducer(undefined, cacheSearchResult({ provider: "x", symbol: "Y", key: "z" }));
    state = reducer(state, clearSearchCache());
    expect(state.results).toEqual({});
  });

  it("selector returns the results map", () => {
    expect(selectSearchCache({ searchCache: { results: { a: { B: "c" } } } })).toEqual({ a: { B: "c" } });
  });
});
