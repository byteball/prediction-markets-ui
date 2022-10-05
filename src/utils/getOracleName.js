import appConfig from "appConfig"
import i18n from "locale";

export const getOracleName = (type, address) => {
  const oracleObj = appConfig.CATEGORIES[type]?.oracles?.find(({ address: oracleAddress }) => oracleAddress === address);
  if (oracleObj) {
    if (oracleObj.address === process.env.REACT_APP_CURRENCY_ORACLE) {
      return i18n.t("oracles.cryptocurrency", "Cryptocurrency prices oracle");
    } else if (oracleObj.address === process.env.REACT_APP_PRECIOUS_METAL_ORACLE){
      return i18n.t("oracles.metal", "Precious metal exchange rates oracle");
    } else if (oracleObj.address === process.env.REACT_APP_SPORT_ORACLE){
      return i18n.t("oracles.sports", "Sports oracle");
    }
  } else {
    return undefined;
  }
}