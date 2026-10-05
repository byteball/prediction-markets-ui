import appConfig from "appConfig";
import axios, { type AxiosInstance } from "axios";

type HubResponse<T> = { data?: T };

/** Thin client for the Obyte hub HTTP API (data feeds, AA definitions and state vars, token registry lookups). */
class HttpHub {
  readonly hubUrl: string;
  private readonly client: AxiosInstance;

  constructor() {
    this.hubUrl = `https://${appConfig.ENVIRONMENT === "testnet" ? "testnet." : ""}obyte.org/api`;
    this.client = axios.create({
      method: "post",
      baseURL: this.hubUrl,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      },
    });
  }

  async getDataFeed(oracles: string[] = [], feed_name: string, ifnone: string = "none"): Promise<string> {
    return await this.client.post<HubResponse<string>>("/get_data_feed", { oracles, feed_name, ifnone }).then((res) => res?.data?.data || ifnone);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getDefinition(address: string): Promise<any> {
    return await this.client.post<HubResponse<unknown>>("/get_definition", { address }).then((res) => res?.data?.data || {});
  }

  async getStateVars(address: string, var_prefix?: string): Promise<Record<string, string | number | undefined>> {
    return await this.client.post<HubResponse<Record<string, string | number>>>("/get_aa_state_vars", { address, var_prefix }).then((res) => res?.data?.data || {});
  }

  async getAssetBySymbol(tokenRegistryAddress: string, symbol: unknown): Promise<string | null> {
    if (typeof symbol !== "string") {
      return null;
    }

    if (symbol === "GBYTE" || symbol === "MBYTE" || symbol === "KBYTE" || symbol === "BYTE") {
      return "base";
    }

    const aaStateVars = await this.getStateVars(tokenRegistryAddress, `s2a_${symbol}`);

    if (`s2a_${symbol}` in aaStateVars) {
      return aaStateVars[`s2a_${symbol}`] as string;
    }
    return null;
  }

  async getSymbolByAsset(tokenRegistryAddress: string, asset: unknown): Promise<string | null> {
    if (asset === null || asset === "base") {
      return "GBYTE";
    }
    if (typeof asset !== "string") {
      return null;
    }

    const aaStateVars = await this.getStateVars(tokenRegistryAddress, `a2s_${asset}`);

    if (`a2s_${asset}` in aaStateVars) {
      return aaStateVars[`a2s_${asset}`] as string;
    }
    return asset.replace(/[+=]/, "").substr(0, 6);
  }

  async getDecimalsBySymbolOrAsset(tokenRegistryAddress: string, symbolOrAsset: unknown): Promise<number> {
    if (!symbolOrAsset) throw Error("symbolOrAsset is undefined");

    if (typeof symbolOrAsset !== "string") throw Error("not valid symbolOrAsset");

    if (symbolOrAsset === "base" || symbolOrAsset === "GBYTE") {
      return 9;
    }

    let asset: string;

    if (symbolOrAsset.length === 44) {
      asset = symbolOrAsset;
    } else if (symbolOrAsset === symbolOrAsset.toUpperCase()) {
      const aaStateVarsWithPrefix = await this.getStateVars(tokenRegistryAddress, `s2a_${symbolOrAsset}`);

      if (!(`s2a_${symbolOrAsset}` in aaStateVarsWithPrefix)) {
        throw Error(`no such symbol ${symbolOrAsset}`);
      }

      asset = aaStateVarsWithPrefix[`s2a_${symbolOrAsset}`] as string;
    } else {
      throw Error("not valid symbolOrAsset");
    }

    const aaStateVarsWithPrefix = await this.getStateVars(tokenRegistryAddress, `current_desc_${asset}`);

    if (!(`current_desc_${asset}` in aaStateVarsWithPrefix)) {
      throw Error(`no decimals for ${symbolOrAsset}`);
    }

    const descHash = aaStateVarsWithPrefix[`current_desc_${asset}`];

    const decimalsStateVar = await this.getStateVars(tokenRegistryAddress, `decimals_${descHash}`);

    const decimals = decimalsStateVar[`decimals_${descHash}`];

    if (typeof decimals !== "number") {
      throw Error(`no decimals for ${symbolOrAsset}`);
    } else {
      return decimals;
    }
  }
}

export default new HttpHub();
