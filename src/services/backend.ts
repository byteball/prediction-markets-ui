import appConfig from "appConfig";
import axios, { type AxiosInstance } from "axios";

/** One row of a paginated backend listing (`/markets/:page`, `/calendar/...`). */
export type PaginatedResponse<T, CountKey extends string = "count"> = { data: T[] } & Record<CountKey, number>;

/** A market as listed by `/markets/:page`; the exact columns come from the backend's `markets` table. */
export type MarketListItem = Record<string, unknown>;
export type MarketsPage = PaginatedResponse<MarketListItem, "max_count">;

export type Championship = { code: string; name: string; emblem?: string } & Record<string, unknown>;
/** `{ [sport]: Championship[] }`, e.g. `{ soccer: [{ code: "PL", name: "Premier League" }] }`. */
export type Championships = Record<string, Championship[]>;

/** `{ [oracleAddress]: feed_name[] }`. */
export type PopularOraclePairs = Record<string, string[]>;

export type Team = { id: number | string; name: string } & Record<string, unknown>;

/** `{ [category]: { oracles: { address: string; feedNames?: string[] }[] } }` as the create form consumes it. */
export type Categories = Record<string, { oracles: { address: string; feedNames?: string[] }[] }>;

/** `{ [asset]: { symbol, decimals } }` (asset `base` is GBYTE). */
export type ReserveAssets = Record<string, { symbol: string; decimals: number }>;

export type Candle = Record<string, unknown>;

export type CalendarItem = Record<string, unknown>;
export type CalendarPage = PaginatedResponse<CalendarItem>;

export type MarketDates = { created_at: number; committed_at?: number } & Record<string, unknown>;

export type RecentEvent = { trigger_unit: string } & Record<string, unknown>;
export type RecentEventsPage = PaginatedResponse<RecentEvent>;

export type BookmakerOdds = { yes_odds: number; no_odds: number; draw_odds: number } & Record<string, unknown>;

class Backend {
  axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: appConfig.BACKEND_URL,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  getAllMarkets = async (page: number = 1): Promise<MarketsPage> => {
    const markets = await this.axios.get<MarketsPage>(`/markets/${page}`);
    return markets?.data;
  }

  getChampionships = async (): Promise<Championships> => {
    const championships = await this.axios.get<Championships>('/championships');
    return championships?.data;
  }

  getPopularCurrencyPairsByOracle = async (): Promise<PopularOraclePairs> => {
    const popularPairs = await this.axios.get<PopularOraclePairs>('/popular_oracle_pairs');
    return popularPairs?.data;
  }

  getCurrencyMarkets = async (page: number = 1): Promise<MarketsPage> => {
    const markets = await this.axios.get<MarketsPage>(`/markets/${page}?&type=currency`);
    return markets?.data;
  }

  getMiscMarkets = async (page: number = 1): Promise<MarketsPage> => {
    const markets = await this.axios.get<MarketsPage>(`/markets/${page}?&type=misc`);
    return markets?.data;
  }

  getMarketsByType = async ({ type, page = 1, championship }: { type: string; page?: number; championship?: string }): Promise<MarketsPage> => {
    let query = `/markets/${page}?type=${type}`;

    if (championship) query += `&championship=${championship}`;

    const markets = await this.axios.get<MarketsPage>(query);
    return markets?.data;
  }

  getTeam = async (sport: string, abbreviation: string): Promise<Team | undefined> => {
    const team = await this.axios.get<Team | undefined>(`/team/${sport}/${abbreviation}`);
    return team?.data;
  }

  getCategories = async (): Promise<Categories> => {
    const categories = await this.axios.get<Categories>('/categories');
    return categories?.data;
  }

  getReserveAssets = async (): Promise<ReserveAssets> => {
    const categories = await this.axios.get<ReserveAssets>('/reserve_assets');
    return categories?.data;
  }

  getDailyCandles = async (address: string): Promise<Candle[]> => {
    const candles = await this.axios.get<Candle[]>(`/daily_candles/${address}`);
    return candles?.data;
  }

  getSportsCalendar = async (sport: string, championship: string, page: number = 1): Promise<CalendarPage> => {
    const calendar = await this.axios.get<CalendarPage>(`/calendar/${sport}/${championship}/${page}`);
    return calendar?.data;
  }

  getCurrencyCalendar = async (currency: string = "GBYTE", page: number = 1): Promise<CalendarPage> => {
    const calendar = await this.axios.get<CalendarPage>(`/calendar/currency/${currency}/${page}`);
    return calendar?.data;
  }

  getDates = async (address: string): Promise<MarketDates> => {
    const dates = await this.axios.get<MarketDates>(`/dates/${address}`);
    return dates?.data;
  }

  getRecentEvents = async (address: string, page: number = 1): Promise<RecentEventsPage> => {
    const events = await this.axios.get<RecentEventsPage>(`/recent_events/${address}/${page}`);
    return events?.data;
  }

  getFirstTradeTs = async (address: string): Promise<number | undefined> => {
    const ts = await this.axios.get<number | undefined>(`/first_trade_ts/${address}`);
    return ts?.data;
  }

  getBookmakerOdds = async (sport: string, feed_name: string): Promise<BookmakerOdds | null | undefined> => {
    const odds = await this.axios.get<BookmakerOdds | null | undefined>(`/bookmaker_odds/${sport}/${feed_name}`);
    return odds?.data;
  }

  getCrest = async (sport: string, competition: string, team_id: number | string): Promise<string | null> => {
    const crest = await this.axios.get<string | null>(`/crest/${sport}/${competition}/${team_id}`);
    return crest?.data;
  }
}

export default new Backend();
