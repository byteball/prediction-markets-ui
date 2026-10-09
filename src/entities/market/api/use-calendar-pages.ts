import useSWR from "swr";
import useSWRInfinite from "swr/infinite";

import { BACKEND_URL } from "@/shared/config/env";
import type { PopularOraclePairs } from "@/entities/oracle/@x/market";

import type { CalendarItem } from "../model/types";
import type { CalendarPage } from "./market-api";

const REFRESH_INTERVAL_MS = 60 * 1000 * 30;
const ONE_DAY_MS = 60 * 1000 * 60 * 24;

export type CalendarQuery = {
  /** "currency" or a sport type present in `sportTypes`; anything else yields no calendar. */
  category: string;
  /** Championship code for a sport category. */
  particle: string;
  /** Currency the calendar is for when the category is "currency"; null means not chosen yet. */
  currency: string | null;
  /** Sport types the backend has championships for. */
  sportTypes: string[];
};

const getCalendarKey = ({ category, particle, currency, sportTypes }: CalendarQuery, page: number): string | null => {
  if (category === "currency" && currency) return `${BACKEND_URL}calendar/${category}/${currency}/${page}`;
  if (sportTypes.includes(category)) return `${BACKEND_URL}calendar/${category}/${particle}/${page}`;

  return null;
};

/** Paginated calendar of upcoming events for a category. Route handling and defaults belong to the caller. */
export const useCalendarPages = (query: CalendarQuery, enabled = true) => {
  const { data = [], size, setSize, isLoading } = useSWRInfinite<CalendarPage>((index) => (enabled ? getCalendarKey(query, index + 1) : null), {
    initialSize: 1,
    persistSize: true,
    refreshInterval: REFRESH_INTERVAL_MS,
  });

  const maxCount = data.length ? data[data.length - 1].count : 0;
  const calendar: CalendarItem[] = data.flatMap((page) => page.data);

  return {
    calendar,
    page: size,
    loadMore: () => setSize(size + 1),
    isLoadingMore: isLoading || (size > 0 && data && typeof data[size - 1] === "undefined"),
    isLoading,
    maxCount,
    isLoadMore: maxCount > data.length,
  };
};

/** Feed names most used in currency markets, by oracle; refreshed daily. */
export const usePopularOraclePairs = (enabled: boolean) => {
  const { data = {}, isLoading } = useSWR<PopularOraclePairs>(enabled ? `${BACKEND_URL}popular_oracle_pairs` : null, { refreshInterval: ONE_DAY_MS });

  return { pairsByOracle: data, isLoading };
};
