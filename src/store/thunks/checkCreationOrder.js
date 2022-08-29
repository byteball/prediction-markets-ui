import { createAsyncThunk } from "@reduxjs/toolkit";
import client from "services/obyte";
import { updateCreationOrder } from "store/slices/settingsSlice";

export const checkCreationOrder = createAsyncThunk(
  'checkCreationOrder',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const tokenRegistry = client.api.getOfficialTokenRegistryAddress();

    const order = state.settings?.creationOrder;

    if (order && order.creation_unit_id && (order.status !== 'created' || !((order.yes_symbol && order.no_symbol && (!order.data.allow_draw || order.draw_symbol)) || order.cancelRegSymbol))) {
      let yes_asset = order.yes_asset;
      let no_asset = order.no_asset;
      let draw_asset = order.draw_asset;
      let prediction_address = order.prediction_address;

      let newOrderData = {};

      if (order.status !== 'created' || !prediction_address) {

        const responses = await client.api.getAaResponseChain({
          trigger_unit: order.creation_unit_id
        });

        prediction_address = responses.find(({ response }) => response && response.responseVars && response.responseVars.prediction_address)?.response.responseVars.prediction_address;
        yes_asset = responses.find(({ response }) => response && response.responseVars && response.responseVars.yes_asset)?.response.responseVars.yes_asset;
        no_asset = responses.find(({ response }) => response && response.responseVars && response.responseVars.no_asset)?.response.responseVars.no_asset;
        draw_asset = order.data.allow_draw && responses.find(({ response }) => response && response.responseVars && response.responseVars.draw_asset)?.response.responseVars.draw_asset;

        newOrderData.prediction_address = prediction_address;
        newOrderData.status = "created";
        newOrderData.yes_asset = yes_asset;
        newOrderData.no_asset = no_asset;
        newOrderData.draw_asset = draw_asset;
      }

      if (!order.cancelRegSymbol) {
        if (!order.yes_symbol && yes_asset) {
          let yes_symbol = await client.api.getSymbolByAsset(tokenRegistry, yes_asset);

          if (yes_symbol !== yes_asset.replace(/[+=]/, '').substr(0, 6)) {
            newOrderData.yes_symbol = yes_symbol;
          }
        }

        if (!order.no_symbol && no_asset) {
          let no_symbol = await client.api.getSymbolByAsset(tokenRegistry, no_asset);

          if (no_symbol !== no_asset.replace(/[+=]/, '').substr(0, 6)) {
            newOrderData.no_symbol = no_symbol;
          }
        }

        if (!order.draw_symbol && draw_asset) {
          let draw_symbol = await client.api.getSymbolByAsset(tokenRegistry, draw_asset);

          if (draw_symbol !== draw_asset.replace(/[+=]/, '').substr(0, 6)) {
            newOrderData.draw_symbol = draw_symbol;
          }
        }
      }

      dispatch(updateCreationOrder(newOrderData));
    }
  });