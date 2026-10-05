import axios from "axios";
import type { Mock } from "vitest";

import { getBaseUsdRate } from "./oswap";

// vi.mock is hoisted above the imports; the factory must not touch outer variables.
vi.mock("axios", () => {
  const get = vi.fn();
  return { __esModule: true, default: { create: vi.fn(() => ({ get })) } };
});

// The factory above returns a plain mock for every axios.create(); view it as such.
const mockGet = axios.create().get as Mock;

beforeEach(() => mockGet.mockReset());

describe("getBaseUsdRate", () => {
  it("reads GBYTE_USD from the flat oswap exchange-rates feed", async () => {
    mockGet.mockResolvedValue({ data: { BTC_USD: 62661, GBYTE_USD: 5.07214917477073, GBYTE_BTC: 0.00008 } });

    expect(await getBaseUsdRate()).toBe(5.07214917477073);
    expect(mockGet).toHaveBeenCalledWith("/exchangeRates");
  });

  it("returns undefined when the field is missing", async () => {
    mockGet.mockResolvedValue({ data: { BTC_USD: 62661 } });
    expect(await getBaseUsdRate()).toBeUndefined();
  });
});
