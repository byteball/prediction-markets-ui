import { memo, useCallback, useMemo } from "react";
import { Button, Divider, List, Spin } from "antd";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { t } from "i18next";

import { PredictionItem } from "./PredictionItem";
import { SwitchActions } from "components/SwitchActions/SwitchActions";
import { selectLanguage } from "store/slices/settingsSlice";
import { getEmojiByType, transformChampionshipName, getSportNameByType, getCategoryName } from "utils";

import { useMarket, useChampionships, useCalendar } from "hooks";
import { QUERY_CURRENCY_KEY } from "hooks/useCalendar";

import styles from "./PredictionList.module.css";

export const PredictionList = memo(() => {
  const { category = 'all', particle = 'all' } = useParams();
  const { markets = [], loadMore, isLoading, isLoadMore, isLoadingMore } = useMarket(category, particle);
  const [searchParams, setSearchParams] = useSearchParams();

  const lang = useSelector(selectLanguage);
  const location = useLocation();

  const navigate = useNavigate();
  const { championships, isLoading: championshipsAreLoading } = useChampionships(lang);
  const { calendar, popularCurrencies, isLoading: calendarIsLoading, isLoadMore: isLoadMoreCalendar, loadMore: loadCalendarMore, isLoadingMore: isLoadingCalendarMore } = useCalendar();

  const actualCurrency = searchParams.get(QUERY_CURRENCY_KEY);
  const langPath = (!lang || lang === 'en') ? '' : `/${lang}`;
  const particleList = useMemo(() => (championships?.[category] || []), [championships, category]);

  const actionList = useMemo(() => ([
    { value: 'all', text: `${getEmojiByType(category)} ${t('common.all_sport', 'All {{sport}}', { sport: getSportNameByType(category) })}`, url: `${langPath}/${category}/all` },
    ...((championships?.[category] || []).map(({ name, code, emblem }) => ({ value: code, text: transformChampionshipName(name, code), iconLink: code === "CSL" ? "/csl.png" : emblem, url: `${langPath}/${category}/${code}` })))
  ]), [category, lang]);


  const handleChangeChampionship = useCallback((currentParticle = 'all') => {
    if (currentParticle !== particle) {
      navigate(`${(!lang || lang === 'en') ? '' : `/${lang}`}/${category}/${currentParticle}${category === "currency" ? location.search : ""}`, { preventScrollReset: true })
    }
  }, [particle, lang, category, navigate, location.search]);

  return <>
    {(particleList.length > 0) ? <SwitchActions
      isLoading={championshipsAreLoading}
      linked
      small={true}
      value={particle}
      data={actionList}
      onChange={handleChangeChampionship}
    /> : null}

    {!isLoading ? <List
      dataSource={markets}
      style={{ marginBottom: 50, marginTop: 20 }}
      rowKey={(item) => `${category}-${item.aa_address}`}
      locale={{ emptyText: category === 'all' ? t("common.no_markets", 'no markets') : t("common.no_markets_type", 'no {{type}} markets', { type: getCategoryName(category).toLowerCase() }) }}
      renderItem={(data) => <PredictionItem {...data} />}
      loadMore={isLoadMore ? <div className={styles.loadMoreWrap}>
        <Button loading={isLoadingMore} onClick={loadMore}>{t("common.load_more", 'Load more')}</Button>
      </div> : null}
    /> : <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
      <Spin size="large" />
    </div>}

    {category === "currency" || category in championships ? <>
      <Divider dashed className={styles.calendarHeader}>{category === 'currency' ? t("prediction_list.title_create", 'create new markets') : t("prediction_list.title_calendar", 'calendar of upcoming matches')}</Divider>

      {category === "currency" ? <SwitchActions
        small={true}
        isLoading={popularCurrencies.length <= 0}
        value={actualCurrency}
        data={popularCurrencies}
        onChange={(calendarCurrency) => calendarCurrency !== actualCurrency && calendarCurrency && setSearchParams({ calendarCurrency })}
      /> : null}

      {!calendarIsLoading ? <List
        dataSource={calendar}
        style={{ marginTop: 10 }}
        rowKey={(item) => `${category}-${item.event_date}-${item.feed_name}-${item.expect_datafeed_value}`}
        locale={{ emptyText: category === 'all' ? t("common.no_markets", 'no markets') : t("common.no_markets_type", 'no {{type}} markets', { type: category }) }}
        renderItem={(data) => <PredictionItem {...data} particle={particle} type={category} />}
        loadMore={isLoadMoreCalendar ? <div className={styles.loadMoreWrap}>
          <Button loading={isLoadingCalendarMore} onClick={loadCalendarMore}>{t("common.load_more", 'Load more')}</Button>
        </div> : null}
      /> : <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
        <Spin size="large" />
      </div>}
    </> : null}
  </>
})
