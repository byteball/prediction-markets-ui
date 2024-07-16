import useSWRInfinite from 'swr/infinite';
import useSWR from "swr";
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSearchParams, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { uniq } from 'lodash';

import { useChampionships } from './useChampionships';
import { selectLanguage } from 'store/slices/settingsSlice';

import appConfig from 'appConfig';

const INIT_CALENDAR_CURRENCY = "GBYTE";
export const QUERY_CURRENCY_KEY = 'calendarCurrency';

export const useCalendar = () => {
    const lang = useSelector(selectLanguage);
    const { category = 'all', particle = 'all' } = useParams();
    const { championships } = useChampionships(lang);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const calendarCurrency = searchParams.get(QUERY_CURRENCY_KEY);

    const { data = [], size, setSize, isLoading } = useSWRInfinite(index => category && championships && (category === "currency" ? !!calendarCurrency : true) ? getCalendarKey(category, particle, index + 1, calendarCurrency, championships) : null, { initialSize: 1, persistSize: true, refreshInterval: 60 * 1000 * 30 });

    const { data: currencyPairsByOracle = {}, pairsLoading } = useSWR(category === "currency" ? `${appConfig.BACKEND_URL}popular_oracle_pairs` : null, { refreshInterval: 60 * 1000 * 60 * 24 });

    const currencyPairs = [];
    Object.keys(currencyPairsByOracle).forEach((oracle) => {
        currencyPairsByOracle[oracle].forEach((feed_name) => {
            currencyPairs.push(feed_name);
        })
    })

    const popularCurrencies = useMemo(() => uniq(currencyPairs.map((feed_name) => feed_name.split("_")?.[0])).map((currency) => ({ text: currency, value: currency })), [currencyPairsByOracle]);

    const maxCount = data.length ? data[data.length - 1].count : 0;

    useEffect(() => {
        const calendarCurrency = searchParams.get(QUERY_CURRENCY_KEY);

        if (category === "currency" && !calendarCurrency) {
            navigate({ search: createSearchParams({ calendarCurrency: INIT_CALENDAR_CURRENCY }).toString() }, { preventScrollReset: true, replace: true });
        } else if (category !== "currency" && calendarCurrency) {
            navigate({ search: createSearchParams({}).toString() }, { replace: true, preventScrollReset: true });
        }
    }, [category]);

    const calendar = [];
    data.forEach(({ data }) => { calendar.push(...data) });

    return ({
        calendar,
        page: size,
        loadMore: () => setSize(size + 1),
        isLoadingMore: isLoading || (size > 0 && data && typeof data[size - 1] === "undefined"),
        isLoading: isLoading || pairsLoading,
        maxCount,
        popularCurrencies,
        isLoadMore: maxCount > data.length
    });
}

const getCalendarKey = (category, particle, page, calendarCurrency, championships = {}) => {
    if (category === "currency" && calendarCurrency) {
        return `${appConfig.BACKEND_URL}calendar/${category}/${calendarCurrency}/${page}`;
    } else if (category in championships) {
        return `${appConfig.BACKEND_URL}calendar/${category}/${particle}/${page}`;
    } else {
        return null;
    }
}
