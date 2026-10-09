import { useTranslation } from "react-i18next";
import useSWR from "swr";

import { BACKEND_URL } from "@/shared/config/env";
import { getLangPath } from "@/shared/lib/lang-path";
import type { SwitchAction } from "@/shared/ui/switch-actions/switch-actions";

import { getTabNameByType } from "../lib/get-tab-name-by-type";
import type { Championships } from "../model/types";

const ONE_DAY_MS = 60 * 1000 * 60 * 24;

/** Championships by sport plus the category tabs of the main page (all / sports / currency / misc). */
export const useChampionships = (lang?: string | null) => {
  const { data = {}, error, isLoading, isValidating } = useSWR<Championships>(lang ? `${BACKEND_URL}championships` : null, { refreshInterval: ONE_DAY_MS });
  const { t } = useTranslation();

  const langPath = getLangPath(lang);
  const sportTypes = Object.keys(data);
  const categories: SwitchAction[] = [{ value: "all", text: t("common.all", "All"), url: langPath ? langPath : "/" }];

  sportTypes.forEach((type) => categories.push({ value: type, text: getTabNameByType(type), url: `${langPath}/${type}/all` }));
  categories.push({ value: "currency", text: `📈 ${t("common.currency", "Currency")}`, url: `${langPath}/currency` }, { value: "misc", text: t("common.misc", "Misc"), url: `${langPath}/misc` });

  return {
    championships: data,
    categories,
    error,
    isLoading,
    isValidating,
  };
};
