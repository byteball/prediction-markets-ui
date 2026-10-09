import { useEffect, useState } from "react";

import { estimateCounterstakeOutput } from "../api/counterstake";
import type { FromToken } from "./use-bridge-tokens";

export type CounterstakeEstimate = {
  /** Reserve-asset amount the EVM stake would yield; 0 while unknown or for an Obyte stake. */
  estimate: number;
  error?: string;
  /** True when the stake comes from an EVM network and needs the bridge. */
  isBridged: boolean;
};

/** Re-estimates the Obyte-side output whenever an EVM stake or its amount changes. */
export const useCounterstakeEstimate = (fromToken: FromToken | undefined, amount: string | number | undefined, amountIsValid: boolean, dstAsset: string | undefined, walletAddress?: string | null): CounterstakeEstimate => {
  const [estimate, setEstimate] = useState(0);
  const [error, setError] = useState<string>();
  const isBridged = !!fromToken && fromToken.network !== "Obyte";

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (fromToken && fromToken.network !== "Obyte" && amount && amountIsValid && Number(amount) > 0 && dstAsset) {
        try {
          const result = await estimateCounterstakeOutput({ amount: Number(amount), srcNetwork: fromToken.network, srcAsset: fromToken.asset, dstAsset, walletAddress });

          if (!cancelled) {
            setEstimate(result);
            setError(undefined);
          }
        } catch (e) {
          if (!cancelled) {
            setEstimate(0);
            setError((e as Error).message);
            console.log("estimateOutput error");
          }
        }
      } else if (!cancelled) {
        setEstimate(0);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [fromToken, amount, amountIsValid, dstAsset, walletAddress]);

  return { estimate, error, isBridged };
};
