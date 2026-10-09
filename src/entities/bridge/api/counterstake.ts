import client from "@/shared/api/obyte-client";
import { IS_TESTNET } from "@/shared/config/env";

const ASSISTANT_REWARD_PERCENT = 1;

export type CounterstakeTransferParams = {
  amount: number;
  srcNetwork: string;
  srcAsset: string;
  /** Obyte asset the transfer lands in (the market's reserve asset). */
  dstAsset: string;
  /** Obyte address that receives the transfer (the market AA). */
  recipientAddress: string;
  /** Payload forwarded to the AA; `to` is the user's wallet the AA pays out to. */
  data: Record<string, unknown>;
  /** User's Obyte wallet, also used for the Oswap change. */
  walletAddress: string;
};

// counterstake-sdk is loaded on demand: it is 1.4 MB and only EVM-sourced trades need it.
const sdk = () => import("counterstake-sdk");

/** How much of `dstAsset` an EVM stake would yield after the bridge and the Oswap swap. 0 when the estimate fails. */
export const estimateCounterstakeOutput = async ({ amount, srcNetwork, srcAsset, dstAsset, walletAddress }: { amount: number; srcNetwork: string; srcAsset: string; dstAsset: string; walletAddress?: string | null }): Promise<number> => {
  const { estimateOutput } = await sdk();
  const result = await estimateOutput({
    amount,
    src_network: srcNetwork,
    src_asset: srcAsset,
    dst_network: "Obyte",
    dst_asset: dstAsset,
    recipient_address: walletAddress,
    assistant_reward_percent: ASSISTANT_REWARD_PERCENT,
    testnet: IS_TESTNET,
    obyteClient: client,
  });

  return result && typeof result === "number" && result > 0 ? result : 0;
};

/** Sends an EVM stake to an Obyte AA through Counterstake (MetaMask prompts the user). */
export const transferCounterstake = async ({ amount, srcNetwork, srcAsset, dstAsset, recipientAddress, data, walletAddress }: CounterstakeTransferParams): Promise<void> => {
  const { transferEVM2Obyte } = await sdk();

  await transferEVM2Obyte({
    amount,
    src_network: srcNetwork,
    src_asset: srcAsset,
    dst_network: "Obyte",
    dst_asset: dstAsset,
    recipient_address: recipientAddress,
    data,
    assistant_reward_percent: ASSISTANT_REWARD_PERCENT,
    testnet: IS_TESTNET,
    obyteClient: client,
    oswap_change_address: walletAddress,
  });
};
