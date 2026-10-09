// Values read from the environment (.env.testnet / .env.livenet, REACT_APP_ prefix kept from CRA).
// Domain configuration derived from them (oracle categories, factory versions) lives in the entities.

export type Environment = ImportMetaEnv["REACT_APP_ENVIRONMENT"];

export const ENVIRONMENT: Environment = import.meta.env.REACT_APP_ENVIRONMENT;
export const IS_TESTNET = ENVIRONMENT === "testnet";

export const FACTORY_AAS: string[] = import.meta.env.REACT_APP_FACTORY_AAS?.split(",") || [];
/** The factory that deploys new markets: the latest one. */
export const CURRENT_FACTORY_AA: string = FACTORY_AAS[FACTORY_AAS.length - 1];
export const BASE_AAS: string[] | undefined = import.meta.env.REACT_APP_BASE_AAS?.split(",");

export const BACKEND_URL: string | undefined = import.meta.env.REACT_APP_BACKEND_URL;
export const GA_ID: string | undefined = import.meta.env.REACT_APP_GA_ID;

export const CURRENCY_ORACLE: string | undefined = import.meta.env.REACT_APP_CURRENCY_ORACLE;
export const SPORT_ORACLE: string | undefined = import.meta.env.REACT_APP_SPORT_ORACLE;
export const PRECIOUS_METAL_ORACLE: string | undefined = import.meta.env.REACT_APP_PRECIOUS_METAL_ORACLE;

export const OBYTE_HUB_WS_URL = `wss://obyte.org/bb${IS_TESTNET ? "-test" : ""}`;
export const OBYTE_HUB_API_URL = `https://${IS_TESTNET ? "testnet." : ""}obyte.org/api`;
export const EXPLORER_URL = `https://${IS_TESTNET ? "testnet" : ""}explorer.obyte.org`;
