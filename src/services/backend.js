import appConfig from "appConfig";
import axios from "axios";

class Backend {
  constructor() {
    this.axios = axios.create({
      baseURL: appConfig.BACKEND_URL
    });
  }

  getAllMarkets = async (page = 1) => {
    const markets = await this.axios.get(`/markets/${page}`);
    return markets?.data;
  }

  getChampionships = async () => {
    const championships = await this.axios.get('/championships');
    return championships?.data;
  }

  getCurrencyMarkets = async (page = 1) => {
    const markets = await this.axios.get(`/markets/${page}?&type=currency`);
    return markets?.data;
  }

  getMiscMarkets = async (page = 1) => {
    const markets = await this.axios.get(`/markets/${page}?&type=misc`);
    return markets?.data;
  }

  getMarketsByType = async ({ type, page = 1, championship }) => {
    let query = `/markets/${page}?type=${type}`;

    if (championship) query += `&championship=${championship}`;

    const markets = await this.axios.get(query);
    return markets?.data;
  }

  getTeam = async (sport, abbreviation) => {
    const team = await this.axios.get(`/team/${sport}/${abbreviation}`);
    return team?.data;
  }

  getCategories = async () => {
    const categories = await this.axios.get('/categories');
    return categories?.data;
  }

  getReserveAssets = async () => {
    const categories = await this.axios.get('/reserve_assets');
    return categories?.data;
  }

  getDailyCandles = async (address) => {
    const candles = await this.axios.get(`/daily_candles/${address}`);
    return candles?.data;
  }

  getSportsCalendar = async (sport, championship, page = 1) => {
    const calendar = await this.axios.get(`/calendar/${sport}/${championship}/${page}`);
    return calendar?.data;
  }
}

export default new Backend();