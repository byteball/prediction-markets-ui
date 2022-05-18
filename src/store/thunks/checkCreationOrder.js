import { createAsyncThunk } from "@reduxjs/toolkit";
import client from "services/obyte";

const tokenRegistry = client.api.getOfficialTokenRegistryAddress();

export const loadCategories = createAsyncThunk(
  'loadCategories',
  async (_, { getState }) => {
    const state = getState();

    const order = state.settings?.creationOrder;

    if (order && (order.status !== 'created' || !(creationOrder.yes_symbol && creationOrder.no_symbol && (!creationOrder.data.allow_draw || creationOrder.draw_symbol) || creationOrder.cancelRegSymbol))) {
      let yes_asset = order.yes_asset;
      let no_asset = order.no_asset;
      let draw_asset = order.draw_asset;
      let updateOrderData = {};

      if (order.status !== 'created' || order.prediction_address) {
        // TODO: Агент не существует Нужно при запросе сохранять trigger unit
      }

      if (!creationOrder.cancelRegSymbol) {
        if (creationOrder.yes_symbol && yes_asset) {
          let yes_symbol = await client.api.getSymbolByAsset(tokenRegistry, yes_asset);
          if (yes_symbol !== yes_asset){ // TODO: Fix it slice(0, x)...
            
          }
        }

        if (creationOrder.no_symbol && no_asset) {

        }

        if (creationOrder.draw_symbol && draw_asset) {

        }
      }
    }
  });