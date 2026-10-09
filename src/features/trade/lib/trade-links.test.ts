import { encodeData } from "@/shared/lib/encode-data";
import { buildBuyLink, buildRedeemLink } from "./trade-links";

const AA = "MARKETAAADDRESSXXXXXXXXXXXXXXXXX";
const WALLET = "WALLETADDRESSXXXXXXXXXXXXXXXXXXX";
const YES_ASSET = "yesAsset+base64/id=";

const query = (link: string) => Object.fromEntries(new URL(link.replace(/^obyte(-tn|-dev)?:/, "http://x/")).searchParams);
const payload = (link: string) => JSON.parse(decodeURIComponent(escape(atob(query(link).base64data))));

describe("buildBuyLink", () => {
  it("sends the stake in the reserve asset, rounded up to the smallest unit, with the outcome in data", () => {
    const link = buildBuyLink({ aa: AA, reserveAsset: "base", reserveDecimals: 9, amount: "0.1234567891", type: "yes", walletAddress: WALLET });

    expect(link).toMatch(new RegExp(`^obyte(-tn|-dev)?:${AA}\\?`));
    expect(query(link)).toMatchObject({ amount: "123456790", asset: "base", from_address: WALLET, single_address: "1" });
    expect(payload(link)).toEqual({ type: "yes" });
  });

  it("sends an empty payload while no outcome is chosen and no wallet is set", () => {
    const link = buildBuyLink({ aa: AA, reserveAsset: "SOME", reserveDecimals: 2, amount: 1, walletAddress: null });

    expect(query(link)).toEqual({ amount: "100", asset: "SOME", base64data: encodeData({}), single_address: "1" });
  });
});

describe("buildRedeemLink", () => {
  it("for a tokened market sends the outcome tokens themselves, rounded up", () => {
    const link = buildRedeemLink({ aa: AA, isTokenless: false, tokenType: "no", tokenAsset: YES_ASSET, tokenDecimals: 4, amount: "1.00001", walletAddress: WALLET });

    expect(query(link)).toEqual({ amount: "10001", asset: YES_ASSET, from_address: WALLET, single_address: "1" });
  });

  it("for a tokenless market sends only the trigger fee and a negative outcome amount in data", () => {
    const link = buildRedeemLink({ aa: AA, isTokenless: true, tokenType: "draw", tokenDecimals: 4, amount: "2.5", walletAddress: WALLET });

    expect(query(link)).toMatchObject({ amount: "10000", asset: "base", from_address: WALLET, single_address: "1" });
    expect(payload(link)).toEqual({ draw_amount: -25000 });
  });

  it("rounds the tokenless amount to the nearest unit (not up)", () => {
    expect(payload(buildRedeemLink({ aa: AA, isTokenless: true, tokenType: "yes", tokenDecimals: 0, amount: "2.4" }))).toEqual({ yes_amount: -2 });
    expect(payload(buildRedeemLink({ aa: AA, isTokenless: true, tokenType: "yes", tokenDecimals: 0, amount: "2.5" }))).toEqual({ yes_amount: -3 });
  });

  it("defaults decimals to 0", () => {
    expect(query(buildRedeemLink({ aa: AA, tokenAsset: YES_ASSET, amount: "3" })).amount).toBe("3");
  });
});
