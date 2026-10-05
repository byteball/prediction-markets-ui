import moment from "moment";

import { generateLink } from "./generateLink";
import { encodeData } from "./encodeData";

vi.mock("appConfig", () => ({
  __esModule: true,
  default: {
    ENVIRONMENT: "testnet",
    FACTORY_AAS: ["S6WVQ6JQCNQ27OQJM2IQDS6DYTKBM24G", "HUJCVN2ZTG6CWUEKG4LQDAMBWSVCSP5L"],
  },
}));

const AA = "VSO2MFNJURWFBEJULWXDQMCFDGSGIUFV";
const WALLET = "WMFLGI2GLAB2MDF2KQAH37VNRRMK7A5N";
const YES_ASSET = "yZ8oMSHEtXnPDrw3MqMA6vjFHdTdRgoMW9wnHuLYgrQ=";

const decode = (link: string): unknown => {
  const m = link.match(/base64data=([^&]+)/);
  return m ? JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1]))))) : undefined;
};

describe("payment link baseline", () => {
  it("encodeData is URL-safe base64 of JSON (utf-8)", () => {
    expect(encodeData({ type: "yes" })).toBe("eyJ0eXBlIjoieWVzIn0=");
    expect(encodeData({ e: "é" })).toBe("eyJlIjoiw6kifQ==");
  });

  it("BuyForm: reserve asset, amount in pennies, type payload, single address, from_address", () => {
    const link = generateLink({
      aa: AA, asset: "base", is_single: true,
      amount: Math.ceil(1 * 10 ** 9), data: { type: "yes" }, from_address: WALLET,
    });
    expect(link).toBe(
      `obyte-tn:${AA}?amount=1000000000&asset=base&base64data=eyJ0eXBlIjoieWVzIn0%3D&from_address=${WALLET}&single_address=1`
    );
    expect(decode(link)).toEqual({ type: "yes" });
  });

  it("BuyForm without wallet omits from_address", () => {
    const link = generateLink({ aa: AA, asset: "base", is_single: true, amount: 123456789, data: { type: "no" }, from_address: undefined });
    expect(link).toBe(`obyte-tn:${AA}?amount=123456789&asset=base&base64data=eyJ0eXBlIjoibm8ifQ%3D%3D&single_address=1`);
  });

  it("RedeemForm: token asset is URL-encoded, no data", () => {
    const link = generateLink({ aa: AA, asset: YES_ASSET, is_single: true, amount: Math.ceil(2.5 * 10 ** 9), from_address: WALLET });
    expect(link).toBe(
      `obyte-tn:${AA}?amount=2500000000&asset=yZ8oMSHEtXnPDrw3MqMA6vjFHdTdRgoMW9wnHuLYgrQ%3D&from_address=${WALLET}&single_address=1`
    );
  });

  it("ClaimProfitForm: claim_profit payload", () => {
    const link = generateLink({ aa: AA, asset: YES_ASSET, is_single: true, amount: Math.ceil(+"10" * 10 ** 9), data: { claim_profit: 1 }, from_address: undefined });
    expect(link).toBe(
      `obyte-tn:${AA}?amount=10000000000&asset=yZ8oMSHEtXnPDrw3MqMA6vjFHdTdRgoMW9wnHuLYgrQ%3D&base64data=eyJjbGFpbV9wcm9maXQiOjF9&single_address=1`
    );
  });

  it("AddLiquidityForm: first issue carries amount ratios", () => {
    const data = { add_liquidity: 1, yes_amount_ratio: 60 / 100, no_amount_ratio: 40 / 100 };
    const link = generateLink({ aa: AA, asset: "base", is_single: true, amount: 5000000000, data, from_address: WALLET });
    expect(decode(link)).toEqual({ add_liquidity: 1, yes_amount_ratio: 0.6, no_amount_ratio: 0.4 });
    expect(link).toBe(
      `obyte-tn:${AA}?amount=5000000000&asset=base&base64data=eyJhZGRfbGlxdWlkaXR5IjoxLCJ5ZXNfYW1vdW50X3JhdGlvIjowLjYsIm5vX2Ftb3VudF9yYXRpbyI6MC40fQ%3D%3D&from_address=${WALLET}&single_address=1`
    );
  });

  it("CreateForm: 20000 bytes to the last factory, event_date as UTC string, reserve_decimals stripped", () => {
    const eventDateUnix = 1803732540;
    const data = {
      oracle: "F4KHJUCLJKY4JV7M5F754LAJX4EB7M4N",
      feed_name: "GBYTE_USD",
      reserve_asset: "base",
      comparison: ">",
      datafeed_value: "5",
      event_date: moment.unix(eventDateUnix).utc().seconds(0).format("YYYY-MM-DDTHH:mm:ss"),
      waiting_period_length: 5 * 24 * 3600,
      issue_fee: 1 / 100,
      redeem_fee: 2 / 100,
      arb_profit_tax: 90 / 100,
      reserve_decimals: 9,
      quiet_period: 0 * 3600,
    };
    const link = generateLink({ amount: 2e4, data: { ...data, reserve_decimals: undefined }, aa: "HUJCVN2ZTG6CWUEKG4LQDAMBWSVCSP5L" });
    expect(link.startsWith("obyte-tn:HUJCVN2ZTG6CWUEKG4LQDAMBWSVCSP5L?amount=20000&asset=base&base64data=")).toBe(true);
    expect(decode(link)).toEqual({
      oracle: "F4KHJUCLJKY4JV7M5F754LAJX4EB7M4N",
      feed_name: "GBYTE_USD",
      reserve_asset: "base",
      comparison: ">",
      datafeed_value: "5",
      event_date: "2027-02-27T12:49:00",
      waiting_period_length: 432000,
      issue_fee: 0.01,
      redeem_fee: 0.02,
      arb_profit_tax: 0.9,
      quiet_period: 0,
    });
  });

  it("RegSymbol: token registry link", () => {
    const data = { asset: YES_ASSET, symbol: "GBYTE5USD-YES", decimals: 9, description: "yes" };
    const link = generateLink({ amount: Math.ceil(0.1 * 1e9), data, aa: "O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ" });
    expect(link).toBe(
      "obyte-tn:O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ?amount=100000000&asset=base&base64data=eyJhc3NldCI6InlaOG9NU0hFdFhuUERydzNNcU1BNnZqRkhkVGRSZ29NVzl3bkh1TFlnclE9Iiwic3ltYm9sIjoiR0JZVEU1VVNELVlFUyIsImRlY2ltYWxzIjo5LCJkZXNjcmlwdGlvbiI6InllcyJ9"
    );
  });

  it("MarketPage: commit result link", () => {
    expect(generateLink({ aa: AA, amount: 1e4, data: { commit: 1 } })).toBe(
      `obyte-tn:${AA}?amount=10000&asset=base&base64data=eyJjb21taXQiOjF9`
    );
  });
});

describe("event date baseline (DatePicker → unix → UTC payload)", () => {
  const toPayload = (unix: number) => moment.unix(unix).utc().seconds(0).format("YYYY-MM-DDTHH:mm:ss");

  it("local picker value and utc() give the same unix", () => {
    const local = moment("2027-02-27 15:49", "YYYY-MM-DD HH:mm");
    expect(local.clone().utc().unix()).toBe(local.unix());
  });

  it("seconds are dropped, minutes kept", () => {
    expect(toPayload(1803732540 + 37)).toBe("2027-02-27T12:49:00");
  });

  it("payload is UTC regardless of utcOffset of the source moment", () => {
    const m = moment.unix(1803732540).utcOffset(180);
    expect(toPayload(m.unix())).toBe("2027-02-27T12:49:00");
  });

  it("DST boundary dates round-trip through unix unchanged", () => {
    const unix = moment.utc("2027-03-28T01:30:00").unix();
    expect(toPayload(unix)).toBe("2027-03-28T01:30:00");
  });
});
