import { useEffect, useMemo } from "react";
import { createSearchParams, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { uniq } from "lodash-es";

import { useAppSelector } from "@/shared/lib/redux";
import { selectLanguage } from "@/shared/i18n/model";
import type { SwitchAction } from "@/shared/ui/switch-actions/switch-actions";
import { useCalendarPages, usePopularOraclePairs } from "@/entities/market";
import { useChampionships } from "@/entities/championship";

export type PopularCurrency = Pick<SwitchAction, "text" | "value">;

const INIT_CALENDAR_CURRENCY = "GBYTE";
export const QUERY_CURRENCY_KEY = "calendarCurrency";

// Route-bound calendar: reads the category / championship from the URL, keeps the currency in the
// query string and feeds the entity hooks.
export const useCalendarRoute = () => {
  const lang = useAppSelector(selectLanguage);
  const { category = "all", particle = "all" } = useParams();
  const { championships } = useChampionships(lang);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const calendarCurrency = searchParams.get(QUERY_CURRENCY_KEY);
  const sportTypes = useMemo(() => Object.keys(championships), [championships]);

  const pages = useCalendarPages({ category, particle, currency: calendarCurrency, sportTypes }, !!category && !!championships && (category === "currency" ? !!calendarCurrency : true));
  const { pairsByOracle, isLoading: pairsLoading } = usePopularOraclePairs(category === "currency");

  const popularCurrencies = useMemo<PopularCurrency[]>(
    () => uniq(Object.values(pairsByOracle).flat().map((feedName) => feedName.split("_")?.[0])).map((currency) => ({ text: currency, value: currency })),
    [pairsByOracle]
  );

  useEffect(() => {
    const calendarCurrency = searchParams.get(QUERY_CURRENCY_KEY);

    if (category === "currency" && !calendarCurrency) {
      navigate({ search: createSearchParams({ calendarCurrency: INIT_CALENDAR_CURRENCY }).toString() }, { preventScrollReset: true, replace: true });
    } else if (category !== "currency" && calendarCurrency) {
      navigate({ search: createSearchParams({}).toString() }, { replace: true, preventScrollReset: true });
    }
  }, [category]);

  return {
    ...pages,
    isLoading: pages.isLoading || pairsLoading,
    popularCurrencies,
  };
};
