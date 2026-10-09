import { ENVIRONMENT } from "@/shared/config/env";

import { encodeData } from "./encode-data";

const suffixes: Record<string, string> = {
  livenet: "",
  testnet: "-tn",
  devnet: "-dev",
};
const suffix = suffixes[ENVIRONMENT ?? "livenet"] ?? "";

/** Fee-only payment that triggers an AA without transferring any asset to it. */
export const TRIGGER_ONLY_AMOUNT = 1e4;

export type GenerateLinkParams = {
  amount: number;
  data?: unknown;
  from_address?: string;
  aa: string | null | undefined;
  asset?: string | number | null;
  is_single?: boolean;
};

export const generateLink = ({ amount, data, from_address, aa, asset, is_single }: GenerateLinkParams): string => {
  let link = `obyte${suffix}:${aa}?amount=${Math.round(amount)}&asset=${encodeURIComponent(asset || "base")}`;
  if (data) link += "&base64data=" + encodeURIComponent(encodeData(data));
  if (from_address) link += "&from_address=" + from_address;
  if (is_single) link += "&single_address=1";
  return link;
};
