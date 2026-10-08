import { useTranslation } from "react-i18next";
import useSWR from "swr";

import type { SwitchAction } from "components/SwitchActions/SwitchActions";

import appConfig from "appConfig";
import { getTabNameByType } from "utils/getTabNameByType";

export interface Championship {
    name: string;
    code: string;
    emblem?: string;
}

export type Championships = Record<string, Championship[]>;

export const useChampionships = (lang?: string | null) => {
    const { data = {}, error, isLoading, isValidating } = useSWR<Championships>(lang ? `${appConfig.BACKEND_URL}championships` : null, {refreshInterval: 60 * 1000 * 60 * 24 });
    const { t } = useTranslation();

    const langPath = (!lang || lang === 'en') ? '' : `/${lang}`;
    const sportTypes = Object.keys(data);
    const switchActionsData: SwitchAction[] = [{ value: 'all', text: t('common.all', "All"), url: langPath ? langPath : '/' }];
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
