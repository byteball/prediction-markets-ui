import { getCurrencyPrice } from "services/marketData";
import { getBaseUsdRate } from "services/oswap";
import { updateReserveRate } from "./updateReserveRate";

// jest.mock is hoisted above the imports by babel-jest.
jest.mock("services/marketData", () => ({ getCurrencyPrice: jest.fn() }));
jest.mock("services/oswap", () => ({ getBaseUsdRate: jest.fn() }));

const ASSET = "lwvZjepKoGSiMIDalxi2GB8Pd+nK86Qsnsn1Ng7TAJE=";
const assets = {
  base: { symbol: "GBYTE", decimals: 9 },
  [ASSET]: { symbol: "USDC", decimals: 4 }
};

// Invoke the async thunk's payload creator directly with a fake dispatch/getState.
const run = (arg, state) => updateReserveRate(arg)(jest.fn(), () => ({ settings: state }));

beforeEach(() => {
  getCurrencyPrice.mockReset();
  getBaseUsdRate.mockReset();
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("updateReserveRate", () => {
  it("prices reserve assets via the market-data chain and base from oswap", async () => {
    getCurrencyPrice.mockResolvedValue(1);
    getBaseUsdRate.mockResolvedValue(30);

    const result = await run(
      { assets, reserveAssetsHaveBeenChanged: true },
      { reserveRates: {}, reserveAssets: {}, reserveRateUpdateTime: 0 }
    );

    expect(result.payload).toEqual({ base: 30, [ASSET]: 1 });
    expect(getBaseUsdRate).toHaveBeenCalledTimes(1);
    expect(getCurrencyPrice).toHaveBeenCalledWith({ from: "USDC", to: "USD" });
    expect(getCurrencyPrice).toHaveBeenCalledTimes(1); // base is not priced through the chain
  });

  it("omits base when oswap returns no rate", async () => {
    getCurrencyPrice.mockResolvedValue(1);
    getBaseUsdRate.mockResolvedValue(undefined);

    const result = await run(
      { assets, reserveAssetsHaveBeenChanged: true },
      { reserveRates: {}, reserveAssets: {}, reserveRateUpdateTime: 0 }
    );

    expect(result.payload).toEqual({ [ASSET]: 1 });
  });

  it("omits a reserve asset whose price could not be resolved (0)", async () => {
    getCurrencyPrice.mockResolvedValue(0);
    getBaseUsdRate.mockResolvedValue(30);

    const result = await run(
      { assets, reserveAssetsHaveBeenChanged: true },
      { reserveRates: {}, reserveAssets: {}, reserveRateUpdateTime: 0 }
    );

    expect(result.payload).toEqual({ base: 30 });
  });

  it("skips the refresh when rates are present, unchanged and recently updated", async () => {
    const recent = Math.floor(Date.now() / 1000);
    const result = await run(
      { assets, reserveAssetsHaveBeenChanged: false },
      { reserveRates: { base: 30 }, reserveAssets: assets, reserveRateUpdateTime: recent }
    );

    expect(result.payload).toBeUndefined();
    expect(getCurrencyPrice).not.toHaveBeenCalled();
    expect(getBaseUsdRate).not.toHaveBeenCalled();
  });

  it("refreshes stale rates even when unchanged", async () => {
    getCurrencyPrice.mockResolvedValue(1);
    getBaseUsdRate.mockResolvedValue(30);
    const stale = Math.floor(Date.now() / 1000) - 2000; // older than the 1800s window

    const result = await run(
      { assets, reserveAssetsHaveBeenChanged: false },
      { reserveRates: { base: 1 }, reserveAssets: assets, reserveRateUpdateTime: stale }
    );

    expect(result.payload).toEqual({ base: 30, [ASSET]: 1 });
  });
});
