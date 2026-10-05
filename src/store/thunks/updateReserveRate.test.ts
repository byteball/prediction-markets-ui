import { getCurrencyPrice } from "services/marketData";
import { getBaseUsdRate } from "services/oswap";
import { updateReserveRate, type UpdateReserveRateArgs } from "./updateReserveRate";
import type { RootState } from "store";
import type { SettingsState } from "store/slices/settingsSlice";

// vi.mock is hoisted above the imports by babel-vi.
vi.mock("services/marketData", () => ({ getCurrencyPrice: vi.fn() }));
vi.mock("services/oswap", () => ({ getBaseUsdRate: vi.fn() }));

const ASSET = "lwvZjepKoGSiMIDalxi2GB8Pd+nK86Qsnsn1Ng7TAJE=";
const assets = {
  base: { symbol: "GBYTE", decimals: 9 },
  [ASSET]: { symbol: "USDC", decimals: 4 }
};

// Invoke the async thunk's payload creator directly with a fake dispatch/getState.
const run = (arg: UpdateReserveRateArgs, state: Partial<SettingsState>) => updateReserveRate(arg)(vi.fn(), () => ({ settings: state }) as RootState, undefined);

beforeEach(() => {
  vi.mocked(getCurrencyPrice).mockReset();
  vi.mocked(getBaseUsdRate).mockReset();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe("updateReserveRate", () => {
  it("prices reserve assets via the market-data chain and base from oswap", async () => {
    vi.mocked(getCurrencyPrice).mockResolvedValue(1);
    vi.mocked(getBaseUsdRate).mockResolvedValue(30);

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
    vi.mocked(getCurrencyPrice).mockResolvedValue(1);
    vi.mocked(getBaseUsdRate).mockResolvedValue(undefined);

    const result = await run(
      { assets, reserveAssetsHaveBeenChanged: true },
      { reserveRates: {}, reserveAssets: {}, reserveRateUpdateTime: 0 }
    );

    expect(result.payload).toEqual({ [ASSET]: 1 });
  });

  it("omits a reserve asset whose price could not be resolved (0)", async () => {
    vi.mocked(getCurrencyPrice).mockResolvedValue(0);
    vi.mocked(getBaseUsdRate).mockResolvedValue(30);

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
    vi.mocked(getCurrencyPrice).mockResolvedValue(1);
    vi.mocked(getBaseUsdRate).mockResolvedValue(30);
    const stale = Math.floor(Date.now() / 1000) - 2000; // older than the 1800s window

    const result = await run(
      { assets, reserveAssetsHaveBeenChanged: false },
      { reserveRates: { base: 1 }, reserveAssets: assets, reserveRateUpdateTime: stale }
    );

    expect(result.payload).toEqual({ base: 30, [ASSET]: 1 });
  });
});
