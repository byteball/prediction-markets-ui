import { backendHttp, type PaginatedResponse } from "@/shared/api/backend-http";

import type { CalendarItem, Candle, MarketDates, MarketListItem, RecentEvent, Team } from "../model/types";

export type MarketsPage = PaginatedResponse<MarketListItem, "max_count">;
export type CalendarPage = PaginatedResponse<CalendarItem>;
export type RecentEventsPage = PaginatedResponse<RecentEvent>;

export type BookmakerOdds = { yes_odds: number; no_odds: number; draw_odds: number } & Record<string, unknown>;


export const getDailyCandles = async (address: string): Promise<Candle[]> => {
  const { data } = await backendHttp.get<Candle[]>(`/daily_candles/${address}`);
  return data;
};

export const getRecentEvents = async (address: string, page: number = 1): Promise<RecentEventsPage> => {
  const { data } = await backendHttp.get<RecentEventsPage>(`/recent_events/${address}/${page}`);
  return data;
};

export const getDates = async (address: string): Promise<MarketDates> => {
  const { data } = await backendHttp.get<MarketDates>(`/dates/${address}`);
  return data;
};

export const getFirstTradeTs = async (address: string): Promise<number | null | undefined> => {
  const { data } = await backendHttp.get<number | null | undefined>(`/first_trade_ts/${address}`);
  return data;
};

export const getTeam = async (sport: string, abbreviation: string): Promise<Team | undefined> => {
  const { data } = await backendHttp.get<Team | undefined>(`/team/${sport}/${abbreviation}`);
  return data;
};

export const getCrest = async (sport: string, competition: string, teamId: number | string): Promise<string | null> => {
  const { data } = await backendHttp.get<string | null>(`/crest/${sport}/${competition}/${teamId}`);
  return data;
};

export const getBookmakerOdds = async (sport: string, feedName: string): Promise<BookmakerOdds | null | undefined> => {
  const { data } = await backendHttp.get<BookmakerOdds | null | undefined>(`/bookmaker_odds/${sport}/${feedName}`);
  return data;
};
