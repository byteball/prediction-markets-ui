import appConfig, { type OracleConfig } from "@/app-config"
import i18n from "@/locale";

type CategoryLookup = Record<string, { oracles?: OracleConfig[] } | undefined>;

export const getOracleName = (type: string, address: string): string | undefined => {
  const oracleObj = (appConfig.CATEGORIES as CategoryLookup)[type]?.oracles?.find(({ address: oracleAddress }) => oracleAddress === address);
  if (oracleObj) {
    if (oracleObj.address === import.meta.env.REACT_APP_CURRENCY_ORACLE) {
      return i18n.t("oracles.cryptocurrency", "Cryptocurrency prices oracle");
    } else if (oracleObj.address === import.meta.env.REACT_APP_PRECIOUS_METAL_ORACLE){
      return i18n.t("oracles.metal", "Precious metal exchange rates oracle");
    } else if (oracleObj.address === import.meta.env.REACT_APP_SPORT_ORACLE){
      return i18n.t("oracles.sports", "Sports oracle");
    }
  } else {
    return undefined;
  }
}
