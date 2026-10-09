import i18n from "@/shared/i18n";
import { CURRENCY_ORACLE, PRECIOUS_METAL_ORACLE, SPORT_ORACLE } from "@/shared/config/env";

import { CATEGORIES, type OracleCategory } from "../config/categories";

/** Human name of a known oracle of the given category, undefined for an oracle the app does not know. */
export const getOracleName = (type: string, address: string): string | undefined => {
  const oracle = CATEGORIES[type as OracleCategory]?.oracles?.find((candidate) => candidate.address === address);

  if (!oracle) return undefined;

  if (oracle.address === CURRENCY_ORACLE) return i18n.t("oracles.cryptocurrency", "Cryptocurrency prices oracle");
  if (oracle.address === PRECIOUS_METAL_ORACLE) return i18n.t("oracles.metal", "Precious metal exchange rates oracle");
  if (oracle.address === SPORT_ORACLE) return i18n.t("oracles.sports", "Sports oracle");

  return undefined;
};
