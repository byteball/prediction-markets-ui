/** Balances of one wallet by asset, as the hub reports them. */
export type WalletBalance = Record<string, { stable: number; pending: number; total?: number; is_private?: number } | undefined>;
