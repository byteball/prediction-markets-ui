import { useTranslation } from "react-i18next";
import useSWR from "swr";

import appConfig from "appConfig";
import { getTabNameByType } from "utils/getTabNameByType";

export const useChampionships = (lang) => {
    const { data = {}, error, isLoading, isValidating } = useSWR(lang ? `${appConfig.BACKEND_URL}championships` : null, {refreshInterval: 60 * 1000 * 60 * 24 });
    const { t } = useTranslation();

    const langPath = (!lang || lang === 'en') ? '' : `/${lang}`;
    const sportTypes = Object.keys(data);
    const switchActionsData = [{ value: 'all', text: t('common.all', "All"), url: langPath ? langPath : '/' }];
    sportTypes.forEach((type) => switchActionsData.push(({ value: type, text: getTabNameByType(type), url: `${langPath}/${type}/all` })));
    switchActionsData.push({ value: 'currency', text: `📈 ${t('common.currency', "Currency")}`, url: `${langPath}/currency` }, { value: 'misc', text: t('common.misc', "Misc"), url: `${langPath}/misc` })

    return {
        championships: data,
        categories: switchActionsData,
        error,
        isLoading,
        isValidating
    }
}
