import { memo, useCallback, useMemo, type ReactNode } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { t } from "i18next";
import { Loader2 } from "lucide-react";

import { PredictionItem, type PredictionItemProps } from "./PredictionItem";
import { SwitchActions } from "components/SwitchActions/SwitchActions";
import { selectLanguage } from "store/slices/settingsSlice";
import { useAppSelector } from "store/hooks";
import { getEmojiByType, transformChampionshipName, getSportNameByType, getCategoryName } from "utils";

import { useMarket, useChampionships, useCalendar } from "hooks";
import { QUERY_CURRENCY_KEY } from "hooks/useCalendar";

import { Button } from "components/ui/button";

import styles from "./PredictionList.module.css";

const Spinner = () => (
  <div className="mt-10 flex justify-center">
    <Loader2 className="size-8 animate-spin text-primary" aria-label="loading" />
  </div>
);

const DashedDivider = ({ children }: { children: ReactNode }) => (
  <div className={`${styles.calendarHeader} my-6 flex items-center gap-4 text-center font-medium`}>
    <span className="h-0 flex-1 border-t border-dashed border-border" aria-hidden="true" />
    <span>{children}</span>
    <span className="h-0 flex-1 border-t border-dashed border-border" aria-hidden="true" />
  </div>
);

const LoadMore = ({ loading, onClick }: { loading: boolean; onClick: () => void }) => (
  <div className={styles.loadMoreWrap}>
    <Button variant="outline" disabled={loading} onClick={onClick}>
      {loading && <Loader2 className="animate-spin" data-icon="inline-start" />}
      {t("common.load_more", "Load more")}
    </Button>
  </div>
);

export const PredictionList = memo(() => {
  const { category = "all", particle = "all" } = useParams();
  const { markets = [], loadMore, isLoading, isLoadMore, isLoadingMore } = useMarket(category, particle);
  const [searchParams, setSearchParams] = useSearchParams();

  const lang = useAppSelector(selectLanguage);
  const location = useLocation();

  const navigate = useNavigate();
  const { championships, isLoading: championshipsAreLoading } = useChampionships(lang);
  const { calendar, popularCurrencies, isLoading: calendarIsLoading, isLoadMore: isLoadMoreCalendar, loadMore: loadCalendarMore, isLoadingMore: isLoadingCalendarMore } = useCalendar();

  const actualCurrency = searchParams.get(QUERY_CURRENCY_KEY);
  const langPath = !lang || lang === "en" ? "" : `/${lang}`;
  const particleList = useMemo(() => championships?.[category] || [], [championships, category]);

  const actionList = useMemo(
    () => [
      { value: "all", text: `${getEmojiByType(category)} ${t("common.all_sport", "All {{sport}}", { sport: getSportNameByType(category) })}`, url: `${langPath}/${category}/all` },
      ...(championships?.[category] || []).map(({ name, code, emblem }: { name: string; code: string; emblem?: string }) => ({
        value: code,
        text: transformChampionshipName(name, code),
        iconLink: code === "CSL" ? "/csl.png" : emblem,
        url: `${langPath}/${category}/${code}`,
      })),
    ],
    [category, lang]
  );

  const handleChangeChampionship = useCallback(
    (currentParticle = "all") => {
      if (currentParticle !== particle) {
        navigate(`${!lang || lang === "en" ? "" : `/${lang}`}/${category}/${currentParticle}${category === "currency" ? location.search : ""}`, { preventScrollReset: true });
      }
    },
    [particle, lang, category, navigate, location.search]
  );

  const emptyMarkets = category === "all" ? t("common.no_markets", "no markets") : t("common.no_markets_type", "no {{type}} markets", { type: getCategoryName(category).toLowerCase() });
  const emptyCalendar = category === "all" ? t("common.no_markets", "no markets") : t("common.no_markets_type", "no {{type}} markets", { type: category });

  return (
    <>
      {particleList.length > 0 ? <SwitchActions isLoading={championshipsAreLoading} linked small={true} value={particle} data={actionList} onChange={handleChangeChampionship} /> : null}

      {!isLoading ? (
        <div style={{ marginBottom: 50, marginTop: 20 }}>
          {markets.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">{emptyMarkets}</div>
          ) : (
            markets.map((data: PredictionItemProps & { aa_address: string }) => <PredictionItem key={`${category}-${data.aa_address}`} {...data} />)
          )}
          {isLoadMore ? <LoadMore loading={isLoadingMore} onClick={loadMore} /> : null}
        </div>
      ) : (
        <Spinner />
      )}

      {category === "currency" || category in championships ? (
        <>
          <DashedDivider>{category === "currency" ? t("prediction_list.title_create", "create new markets") : t("prediction_list.title_calendar", "calendar of upcoming matches")}</DashedDivider>

          {category === "currency" ? (
            <SwitchActions
              small={true}
              isLoading={popularCurrencies.length <= 0}
              value={actualCurrency}
              data={popularCurrencies}
              onChange={(calendarCurrency: string) => calendarCurrency !== actualCurrency && calendarCurrency && setSearchParams({ calendarCurrency })}
            />
          ) : null}

          {!calendarIsLoading ? (
            <div style={{ marginTop: 10 }}>
              {calendar.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">{emptyCalendar}</div>
              ) : (
                calendar.map((data: PredictionItemProps) => (
                  <PredictionItem key={`${category}-${data.event_date}-${data.feed_name}-${data.expect_datafeed_value}`} {...data} particle={particle} type={category} />
                ))
              )}
              {isLoadMoreCalendar ? <LoadMore loading={isLoadingCalendarMore} onClick={loadCalendarMore} /> : null}
            </div>
          ) : (
            <Spinner />
          )}
        </>
      ) : null}
    </>
  );
});

PredictionList.displayName = "PredictionList";
