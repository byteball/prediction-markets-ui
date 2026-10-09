import { buildAddLiquidityData, buildAddLiquidityLink } from "./liquidity-link";

const AA = "MARKETAAADDRESSXXXXXXXXXXXXXXXXX";
const WALLET = "WALLETADDRESSXXXXXXXXXXXXXXXXXXX";

const query = (link: string) => Object.fromEntries(new URL(link.replace(/^obyte(-tn|-dev)?:/, "http://x/")).searchParams);
const payload = (link: string) => JSON.parse(decodeURIComponent(escape(atob(query(link).base64data))));

describe("buildAddLiquidityData", () => {
  it("adds the outcome ratios only on the first issue", () => {
    expect(buildAddLiquidityData({ isFirstIssue: true, yesPercent: "65", noPercent: 35 })).toEqual({ add_liquidity: 1, yes_amount_ratio: 0.65, no_amount_ratio: 0.35 });
    expect(buildAddLiquidityData({ isFirstIssue: false, yesPercent: "65", noPercent: 35 })).toEqual({ add_liquidity: 1 });
  });

  it("turns empty inputs into zero ratios", () => {
    expect(buildAddLiquidityData({ isFirstIssue: true, yesPercent: "", noPercent: "" })).toEqual({ add_liquidity: 1, yes_amount_ratio: 0, no_amount_ratio: 0 });
  });
});

describe("buildAddLiquidityLink", () => {
  it("sends the gross amount already expressed in the smallest unit", () => {
    const data = buildAddLiquidityData({ isFirstIssue: true, yesPercent: 60, noPercent: 40 });
    const link = buildAddLiquidityLink({ aa: AA, reserveAsset: "base", amountInPennies: 100_010_000, data, walletAddress: WALLET });

    expect(query(link)).toMatchObject({ amount: "100010000", asset: "base", from_address: WALLET, single_address: "1" });
    expect(payload(link)).toEqual({ add_liquidity: 1, yes_amount_ratio: 0.6, no_amount_ratio: 0.4 });
  });
});
