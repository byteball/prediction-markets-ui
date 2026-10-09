import { encodeData } from "./encode-data";
import { generateLink } from "./generate-link";

// Characterization tests for the Obyte wallet deep link. The link format is a contract with the
// wallet app, so these pin every query parameter the forms rely on.

const AA = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
// The protocol prefix depends on REACT_APP_ENVIRONMENT from the .env in use; it is pinned separately below.
const PREFIX = generateLink({ aa: AA, amount: 1 }).split(":")[0];

describe("generateLink", () => {
  it("builds the minimal link with the amount rounded and the base asset by default", () => {
    expect(PREFIX).toMatch(/^obyte(-tn|-dev)?$/);
    expect(generateLink({ aa: AA, amount: 10_000.4 })).toBe(`${PREFIX}:${AA}?amount=10000&asset=base`);
    expect(generateLink({ aa: AA, amount: 10_000.5 })).toBe(`${PREFIX}:${AA}?amount=10001&asset=base`);
  });

  it("url-encodes a custom asset id", () => {
    const asset = "n9y3VomFJWVUyWz1DG5t2wW7G6W5k2x+Cz1Yf9h2AbY=";

    expect(generateLink({ aa: AA, amount: 1, asset })).toBe(`${PREFIX}:${AA}?amount=1&asset=${encodeURIComponent(asset)}`);
  });

  it("falls back to base when the asset is null or empty", () => {
    expect(generateLink({ aa: AA, amount: 1, asset: null })).toContain("asset=base");
    expect(generateLink({ aa: AA, amount: 1, asset: "" })).toContain("asset=base");
  });

  it("appends base64data, from_address and single_address in that order", () => {
    const data = { type: "yes" };
    const link = generateLink({ aa: AA, amount: 1e4, data, from_address: "FROMADDRESS", is_single: true });

    expect(link).toBe(`${PREFIX}:${AA}?amount=10000&asset=base&base64data=${encodeURIComponent(encodeData(data))}&from_address=FROMADDRESS&single_address=1`);
  });

  it("drops the from_address and single_address parts when not requested", () => {
    const link = generateLink({ aa: AA, amount: 1e4, data: { claim_profit: 1 } });

    expect(link).not.toContain("from_address");
    expect(link).not.toContain("single_address");
    expect(link).toContain("base64data=");
  });

  it("omits undefined fields from the encoded payload", () => {
    const link = generateLink({ aa: AA, amount: 1, data: { type: undefined } });

    expect(link).toContain(`base64data=${encodeURIComponent(btoa("{}"))}`);
  });

  it("keeps unicode in the payload intact", () => {
    const data = { feed_name: "Реал — Барса" };
    const link = generateLink({ aa: AA, amount: 1, data });
    const encoded = decodeURIComponent(link.split("base64data=")[1]);

    expect(decodeURIComponent(escape(atob(encoded)))).toBe(JSON.stringify(data));
  });

  describe("protocol prefix per environment", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    const linkFor = async (environment: string) => {
      vi.stubEnv("REACT_APP_ENVIRONMENT", environment);
      vi.resetModules();
      const { generateLink: generate } = await import("./generate-link");

      return generate({ aa: AA, amount: 1 });
    };

    it("is obyte: on livenet, obyte-tn: on testnet and obyte-dev: on devnet", async () => {
      expect(await linkFor("livenet")).toMatch(/^obyte:/);
      expect(await linkFor("testnet")).toMatch(/^obyte-tn:/);
      expect(await linkFor("devnet")).toMatch(/^obyte-dev:/);
    });
  });
});
