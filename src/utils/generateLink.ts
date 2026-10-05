import { encodeData } from "./encodeData";
import config from "appConfig";

const suffixes: Record<string, string> = {
  livenet: "",
  testnet: "-tn",
  devnet: "-dev",
};
const suffix = suffixes[config.ENVIRONMENT ?? "livenet"] ?? "";

export type GenerateLinkParams = {
  /** Amount in the asset's smallest units; rounded to an integer. */
  amount: number;
  /** Optional AA trigger data, sent as `base64data`. */
  data?: unknown;
  from_address?: string;
  /** Destination AA address. */
  aa: string | null | undefined;
  /** Asset id; `base` (bytes) when omitted. */
  asset?: string | number | null;
  is_single?: boolean;
};

/** Builds an `obyte:` / `obyte-tn:` payment URI for the wallet (see paymentLinks.baseline.test.ts for the exact format). */
export const generateLink = ({ amount, data, from_address, aa, asset, is_single }: GenerateLinkParams): string => {
  let link = `obyte${suffix}:${aa}?amount=${Math.round(amount)}&asset=${encodeURIComponent(asset || "base")}`;
  if (data) link += "&base64data=" + encodeURIComponent(encodeData(data));
  if (from_address) link += "&from_address=" + from_address;
  if (is_single) link += "&single_address=1";
  return link;
};
