import axios from "axios";

import { getBaseUsdRate } from "./oswap";

// jest.mock is hoisted above the imports by babel-jest.
jest.mock("axios", () => {
  const get = jest.fn();
  return { __esModule: true, default: { create: jest.fn(() => ({ get })) } };
});

const mockGet = axios.create().get;

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
