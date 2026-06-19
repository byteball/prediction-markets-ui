import { toKrakenAsset } from "./symbolMap";

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
