import { encodeData } from "./encodeData";
import config from "appConfig";

const suffixes: Record<string, string> = {
  livenet: "",
  testnet: "-tn",
  devnet: "-dev",
};
const suffix = suffixes[config.ENVIRONMENT ?? "livenet"] ?? "";

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
