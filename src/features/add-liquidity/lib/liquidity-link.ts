import { generateLink } from "@/shared/lib/generate-link";

type AmountLike = string | number | undefined;

export type AddLiquidityData = { add_liquidity: 1; yes_amount_ratio?: number; no_amount_ratio?: number };

/** AA payload of a liquidity deposit; the first issue also carries the chosen outcome split. */
export const buildAddLiquidityData = ({ isFirstIssue, yesPercent, noPercent }: { isFirstIssue: boolean; yesPercent: AmountLike; noPercent: AmountLike }): AddLiquidityData => {
  const data: AddLiquidityData = { add_liquidity: 1 };

  if (isFirstIssue) {
    data.yes_amount_ratio = Number(yesPercent) / 100;
    data.no_amount_ratio = Number(noPercent) / 100;
  }

  return data;
};

export type AddLiquidityLinkParams = {
  aa: string | null;
  reserveAsset?: string;
  /** Gross stake already expressed in the reserve asset's smallest unit. */
  amountInPennies: number;
  data: AddLiquidityData;
  walletAddress?: string | null;
};

export const buildAddLiquidityLink = ({ aa, reserveAsset, amountInPennies, data, walletAddress }: AddLiquidityLinkParams): string =>
  generateLink({ aa, asset: reserveAsset, is_single: true, amount: amountInPennies, data, from_address: walletAddress || undefined });
