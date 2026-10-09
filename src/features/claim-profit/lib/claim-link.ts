import { generateLink, TRIGGER_ONLY_AMOUNT } from "@/shared/lib/generate-link";

type AmountLike = string | number | undefined;

export type ClaimProfitLinkParams = {
  aa: string | null;
  isTokenless?: boolean;
  asset?: string;
  decimals?: number;
  amount: AmountLike;
  walletAddress?: string | null;
};

/** Wallet deep link that claims the winnings: the winner tokens for a tokened market, a bare trigger for a tokenless one. */
export const buildClaimProfitLink = ({ aa, isTokenless, asset, decimals = 0, amount, walletAddress }: ClaimProfitLinkParams): string => {
  const from_address = walletAddress || undefined;

  // The tokenless AA claims the whole position and must not receive the reserve asset.
  if (isTokenless) {
    return generateLink({ aa, amount: TRIGGER_ONLY_AMOUNT, data: { claim_profit: 1 }, is_single: true, from_address });
  }

  return generateLink({ aa, asset, is_single: true, amount: Math.ceil(Number(amount) * 10 ** decimals), data: { claim_profit: 1 }, from_address });
};
