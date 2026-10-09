import { encodeData } from "@/shared/lib/encode-data";
import { buildClaimProfitLink } from "./claim-link";

const AA = "MARKETAAADDRESSXXXXXXXXXXXXXXXXX";
const WALLET = "WALLETADDRESSXXXXXXXXXXXXXXXXXXX";
const YES_ASSET = "yesAsset+base64/id=";

const query = (link: string) => Object.fromEntries(new URL(link.replace(/^obyte(-tn|-dev)?:/, "http://x/")).searchParams);
const payload = (link: string) => JSON.parse(decodeURIComponent(escape(atob(query(link).base64data))));

describe("buildClaimProfitLink", () => {
  it("for a tokened market sends the winner tokens with claim_profit in data", () => {
    const link = buildClaimProfitLink({ aa: AA, isTokenless: false, asset: YES_ASSET, decimals: 2, amount: "10.001", walletAddress: WALLET });

    expect(query(link)).toMatchObject({ amount: "1001", asset: YES_ASSET, from_address: WALLET, single_address: "1" });
    expect(payload(link)).toEqual({ claim_profit: 1 });
  });

  it("for a tokenless market sends only the trigger fee and ignores the amount", () => {
    const link = buildClaimProfitLink({ aa: AA, isTokenless: true, asset: YES_ASSET, decimals: 2, amount: "10", walletAddress: null });

    expect(query(link)).toEqual({ amount: "10000", asset: "base", base64data: encodeData({ claim_profit: 1 }), single_address: "1" });
  });
});
