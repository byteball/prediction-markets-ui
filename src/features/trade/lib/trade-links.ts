import { generateLink, TRIGGER_ONLY_AMOUNT } from "@/shared/lib/generate-link";
import type { OutcomeType } from "@/entities/market";

// Pure builders of the wallet deep links sent by the buy / redeem forms. They carry the exact
// rounding and payload shape the market AA expects, so the forms only pass user input through.

type AmountLike = string | number | undefined;

export type BuyLinkParams = {
  aa: string | null;
  reserveAsset?: string;
  reserveDecimals: number;
  amount: AmountLike;
  type?: OutcomeType;
  walletAddress?: string | null;
};

export const buildBuyLink = ({ aa, reserveAsset, reserveDecimals, amount, type, walletAddress }: BuyLinkParams): string =>
  generateLink({
    aa,
    asset: reserveAsset,
    is_single: true,
    amount: Math.ceil(Number(amount) * 10 ** reserveDecimals),
    data: { type },
    from_address: walletAddress || undefined,
  });

export type RedeemLinkParams = {
  aa: string | null;
  isTokenless?: boolean;
  tokenType?: OutcomeType;
  tokenAsset?: string;
  tokenDecimals?: number;
  amount: AmountLike;
  walletAddress?: string | null;
};

export const buildRedeemLink = ({ aa, isTokenless, tokenType, tokenAsset, tokenDecimals = 0, amount, walletAddress }: RedeemLinkParams): string => {
  const from_address = walletAddress || undefined;

  if (isTokenless) {
    // The position lives inside the AA: the trigger carries a negative amount of the outcome in its data.
    const tokenAmountInSmallestUnits = Math.round(Number(amount) * 10 ** tokenDecimals);

    return generateLink({ aa, amount: TRIGGER_ONLY_AMOUNT, data: { [`${tokenType}_amount`]: -tokenAmountInSmallestUnits }, is_single: true, from_address });
  }

  return generateLink({ aa, asset: tokenAsset, is_single: true, amount: Math.ceil(Number(amount) * 10 ** tokenDecimals), from_address });
};
