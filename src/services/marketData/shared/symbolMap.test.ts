import { toKrakenAsset, toPreciousMetalProxy } from "./symbolMap";

describe("toKrakenAsset", () => {
  it("translates Kraken's non-standard asset codes", () => {
    expect(toKrakenAsset("BTC")).toBe("XBT");
    expect(toKrakenAsset("DOGE")).toBe("XDG");
  });

  it("passes through standard symbols unchanged", () => {
    expect(toKrakenAsset("ETH")).toBe("ETH");
    expect(toKrakenAsset("USD")).toBe("USD");
  });
});

describe("toPreciousMetalProxy", () => {
  it("maps precious-metal tickers to their tokenized proxy", () => {
    expect(toPreciousMetalProxy("XAU")).toBe("PAXG");
    expect(toPreciousMetalProxy("XAG")).toBe("KAG");
  });

  it("is case-insensitive", () => {
    expect(toPreciousMetalProxy("xau")).toBe("PAXG");
  });

  it("passes through non-metal symbols unchanged", () => {
    expect(toPreciousMetalProxy("BTC")).toBe("BTC");
    expect(toPreciousMetalProxy("USD")).toBe("USD");
  });
});
