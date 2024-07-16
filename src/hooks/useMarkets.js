import useSWRInfinite from 'swr/infinite';

import appConfig from 'appConfig';

export const useMarket = (category = 'all', particle = 'all') => {
    const championship = category === 'all' || category === 'currency' || category === 'misc' || particle === 'all' ? '' : `&championship=${particle}`;
    const { data = [], size, setSize, isLoading} = useSWRInfinite(index => category && particle ? `${appConfig.BACKEND_URL}markets/${index + 1}?type=${category}${championship}` : null, { initialSize: 1, persistSize: true, refreshInterval: 60 * 1000 * 30 });

    const maxCount = data.length ? data[data.length - 1].max_count : 0;

    const markets = [];
    data.forEach(({ data }) => { markets.push(...data) });

    return {
        markets,
        isLoading,
        isLoadingMore: isLoading || (size > 0 && data && typeof data[size - 1] === "undefined"),
        loadMore: () => setSize(size + 1),
        currentPage: size,
        maxCount,
        isLoadMore: maxCount > markets.length
    }
}
