// Cross-import entry for entities/market (FSD `@x` notation): the market needs the connected wallet
// address to pick the user's outcome balances out of the AA state.
export { selectWalletAddress } from "../model/wallet-slice";
