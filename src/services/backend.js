import appConfig from "appConfig";
import axios from "axios";

class Backend {
  constructor() {
    this.axios = axios.create({
      baseURL: appConfig.BACKEND_URL
    });
  }

  getMarkets = async () => {
    const markets = await this.axios.get('/markets');
    return markets?.data;
  }

  getCategories = async () => {
    const categories = await this.axios.get('/categories');
    return categories?.data;
  }

  getReserveAssets = async() => {
    const categories = await this.axios.get('/reserve_assets');
    return categories?.data;
  }

  getCategory = async (address) => {
    const category = await this.axios.get(`/category/${address}`);
    return category?.data;
  }

  getDailyCandles = async (address) => {
    const candles = await this.axios.get(`/daily_candles/${address}`);
    return candles?.data;
  }

  getSportsCalendar = async () => {
    const categories = await this.axios.get('/calendar');
    return categories?.data;
  }
}

export default new Backend();