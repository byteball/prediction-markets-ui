import { useLocation } from "react-router-dom";

import { getMarketAddressFromPath } from "@/entities/market";

/** Market AA address from the current "/market/<slug>-<ADDRESS>" URL. */
export const useMarketAddress = (): string | undefined => {
  const location = useLocation();

  return getMarketAddressFromPath(location.pathname);
};
