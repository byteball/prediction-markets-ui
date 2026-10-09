import { memo, useCallback, useMemo, type ReactNode } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import { MarketCard, type MarketListItem, type CalendarItem } from "@/entities/market";
import { CreateNowModal } from "@/features/create-market";
import { SwitchActions } from "@/shared/ui/switch-actions/switch-actions";
import { selectLanguage } from "@/shared/i18n/model";
import { useAppSelector } from "@/shared/lib/redux";

import { useMarkets } from "@/entities/market";
import { useChampionships, getEmojiByType, transformChampionshipName, getSportNameByType, getCategoryName } from "@/entities/championship";
import { getLangPath } from "@/shared/lib/lang-path";
import { useCalendarRoute, QUERY_CURRENCY_KEY } from "../model/use-calendar-route";

import { Button } from "@/shared/ui/button";

import styles from "./market-list.module.css";

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

const LoadMore = ({ loading, onClick }: { loading: boolean; onClick: () => void }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.loadMoreWrap}>
      <Button variant="outline" disabled={loading} onClick={onClick}>
        {loading && <Loader2 className="animate-spin" data-icon="inline-start" />}
        {t("common.load_more", "Load more")}
      </Button>
    </div>
  );
};

export const MarketList = memo(() => {
  const { category = "all", particle = "all" } = useParams();
  const { markets = [], loadMore, isLoading, isLoadMore, isLoadingMore } = useMarkets(category, particle);
  const [searchParams, setSearchParams] = useSearchParams();
  // The hook (not the static `t`) re-renders the list when i18next switches language: the redux
  // `lang` changes first, and `LocaleSync` applies it to i18next only afterwards.
  const { t, i18n } = useTranslation();

  const lang = useAppSelector(selectLanguage);
  const location = useLocation();

  const navigate = useNavigate();
  const { championships, isLoading: championshipsAreLoading } = useChampionships(lang);
  const { calendar, popularCurrencies, isLoading: calendarIsLoading, isLoadMore: isLoadMoreCalendar, loadMore: loadCalendarMore, isLoadingMore: isLoadingCalendarMore } = useCalendarRoute();

  const actualCurrency = searchParams.get(QUERY_CURRENCY_KEY);
  const langPath = getLangPath(lang);
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
    [category, langPath, championships, i18n.language, t]
  );

  const handleChangeChampionship = useCallback(
    (currentParticle = "all") => {
      if (currentParticle !== particle) {
        navigate(`${langPath}/${category}/${currentParticle}${category === "currency" ? location.search : ""}`, { preventScrollReset: true });
      }
    },
    [particle, langPath, category, navigate, location.search]
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
            markets.map((market: MarketListItem) => <MarketCard key={`${category}-${market.aa_address}`} market={market} />)
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
                calendar.map((item: CalendarItem) => (
                  <MarketCard
                    key={`${category}-${item.event_date}-${item.feed_name}-${item.expect_datafeed_value}`}
                    market={item}
                    actionSlot={
                      <CreateNowModal
                        feed_name={item.feed_name}
                        oracle={item.oracle}
                        event_date={item.event_date}
                        expect_datafeed_value={item.expect_datafeed_value}
                        waiting_period_length={item.waiting_period_length}
                        no_team={item.no_team}
                        yes_team={item.yes_team}
                        quiet_period={item.quiet_period}
                        expect_comparison={item.comparison}
                        yes_crest_url={item.yes_crest_url}
                        no_crest_url={item.no_crest_url}
                        league={item.league}
                      />
                    }
                  />
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

MarketList.displayName = "MarketList";
