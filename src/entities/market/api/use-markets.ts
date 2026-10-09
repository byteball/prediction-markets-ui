import useSWRInfinite from "swr/infinite";

import { BACKEND_URL } from "@/shared/config/env";

import type { MarketListItem } from "../model/types";
import type { MarketsPage } from "./market-api";

const REFRESH_INTERVAL_MS = 60 * 1000 * 30;

/** Paginated market list for a category; `particle` is the championship code for a sport. */
export const useMarkets = (category = "all", particle = "all") => {
  const championship = category === "all" || category === "currency" || category === "misc" || particle === "all" ? "" : `&championship=${particle}`;
  const { data = [], size, setSize, isLoading } = useSWRInfinite<MarketsPage>((index) => (category && particle ? `${BACKEND_URL}markets/${index + 1}?type=${category}${championship}` : null), {
    initialSize: 1,
    persistSize: true,
    refreshInterval: REFRESH_INTERVAL_MS,
  });

  const maxCount = data.length ? data[data.length - 1].max_count : 0;
  const markets: MarketListItem[] = data.flatMap((page) => page.data);

  return {
    markets,
    isLoading,
    isLoadingMore: isLoading || (size > 0 && data && typeof data[size - 1] === "undefined"),
    loadMore: () => setSize(size + 1),
    currentPage: size,
    maxCount,
    isLoadMore: maxCount > markets.length,
  };
};
