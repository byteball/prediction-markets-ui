import appConfig from "appConfig";

const EXPLORER_URL = `https://${appConfig.ENVIRONMENT === "testnet" ? "testnet" : ""}explorer.obyte.org`;

export const getExplorerUrl = (type: "address" | "unit", id: string) => (type === "address" ? `${EXPLORER_URL}/address/${id}` : `${EXPLORER_URL}/${id}`);
