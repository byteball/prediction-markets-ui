import { store } from "index";
import { isEmpty } from "lodash";

import client from "services/obyte";

import { addRecentEvent, updateStateForActualMarket, updateSymbolForActualMarket } from "store/slices/activeSlice";
import { addMarketInList } from "store/slices/marketsSlice";
import { updateCreationOrder } from "store/slices/settingsSlice";
import { loadCategories } from "store/thunks/loadCategories";
import { loadMarkets } from "store/thunks/loadMarkets";
import { loadReserveAssets } from "store/thunks/loadReserveAssets";
import { setActiveMarket } from "store/thunks/setActiveMarket";
import { responseToEvent } from "utils/responseToEvent";

import config from "appConfig";
import { checkCreationOrder } from "store/thunks/checkCreationOrder";

const getAAPayload = (messages = []) => messages.find(m => m.app === 'data')?.payload || {};

export const bootstrap = async () => {
  console.log("connect");
  // load data from backend
  store.dispatch(loadMarkets());
  store.dispatch(loadCategories());
  store.dispatch(loadReserveAssets());
  store.dispatch(checkCreationOrder());

  const state = store.getState();

  if (state.active.address) { // reload data for active market
    store.dispatch(setActiveMarket(state.active.address));
  }

  const updateMarkets = setInterval(() => {
    store.dispatch(loadMarkets());
  }, 1800 * 1000);

  const heartbeat = setInterval(() => {
    client.api.heartbeat();
  }, 10 * 1000);

  const tokenRegistry = client.api.getOfficialTokenRegistryAddress();

  await client.justsaying("light/new_aa_to_watch", {
    aa: config.FACTORY_AA
  });

  await client.justsaying("light/new_aa_to_watch", {
    aa: tokenRegistry
  });


  client.subscribe((err, result) => {
    if (err) return null;

    const { body } = result[1];

    if (body.aa_address === config.FACTORY_AA) {
      handleEventPredictionFactory(result);
    } else if (body.aa_address === tokenRegistry) {
      handleTokenRegistry(result);
    } else if (state.active.address && body.aa_address === state.active.address) {
      handleActivePredictionMarket(result);
    }
  });

  const handleTokenRegistry = (result) => {
    const state = store.getState();
    const { subject, body } = result[1];
    const order = state.settings.creationOrder;
    const orderData = order?.data;
    if (!orderData) return null;

    if (subject === "light/aa_request") {
      const { messages } = body.unit;
      const payload = getAAPayload(messages);


      if (payload.symbol && payload.asset && order.status === 'created') {
        const asset = payload.asset;
        if (asset === order.yes_asset || asset === order.no_asset || asset === order.draw_asset) {
          const type = asset === order.yes_asset ? 'yes' : (asset === order.no_asset ? 'no' : 'draw');

          store.dispatch(updateCreationOrder({
            [`${type}_symbol`]: payload.symbol
          }))
        }

      }
    } else if (subject === "light/aa_response") {
      const responseVars = body.response?.responseVars;

      if (responseVars) {
        if ((order.yes_asset in responseVars) || (order.no_asset in responseVars) || (order.draw_asset && (order.draw_asset in responseVars))) {
          const type = order.yes_asset in responseVars ? 'yes' : (order.no_asset in responseVars ? 'no' : 'draw');
          const asset = order[`${type}_asset`];

          if (asset) {
            const symbol = responseVars[asset];

            if (symbol) {
              store.dispatch(updateCreationOrder({
                [`${type}_symbol`]: symbol
              }))
            }

          }
        }

        if (state.active.address) {
          const { yes_asset, no_asset, draw_asset } = state.active.stateVars;

          if (yes_asset && (yes_asset in responseVars)) {
            store.dispatch(updateSymbolForActualMarket({ type: 'yes', symbol: responseVars[yes_asset] }));
          } else if (no_asset && (no_asset in responseVars)) {
            store.dispatch(updateSymbolForActualMarket({ type: 'no', symbol: responseVars[no_asset] }))
          } else if (draw_asset && (draw_asset in responseVars)) {
            store.dispatch(updateSymbolForActualMarket({ type: 'draw', symbol: responseVars[draw_asset] }))
          }
        }
      }
    }
  }

  const handleEventPredictionFactory = (result) => {
    const state = store.getState();
    const { subject, body } = result[1];
    const order = state.settings.creationOrder;
    const orderData = order?.data;
    if (!orderData) return null;

    if (subject === "light/aa_request") {
      const { messages, unit } = body.unit;
      const payload = getAAPayload(messages);

      if (order.status === 'order' && payload.event && orderData.event === payload.event && (String(orderData.end_of_trading_period) === String(payload.end_of_trading_period)) && orderData.oracle === payload.oracle) {
        // actual order
        store.dispatch(updateCreationOrder({
          status: 'pending',
          creation_unit_id: unit
        }))
      }

    } else if (subject === "light/aa_response") {
      const { updatedStateVars, trigger_initial_unit } = body;

      if (!orderData || !updatedStateVars || (updatedStateVars && !(config.FACTORY_AA in updatedStateVars)) || order.status !== 'pending') return null;

      if (trigger_initial_unit === order.creation_unit_id) {
        const newFactoryStateVars = updatedStateVars[config.FACTORY_AA];
        const varName = Object.keys(newFactoryStateVars)?.[0];

        if (varName && varName.includes('prediction_')) {
          const prediction_address = varName.split("_")[1];

          if (prediction_address) {
            const data = newFactoryStateVars[varName]?.value;

            if (data && ('yes_asset' in data) && ('no_asset' in data)) {
              store.dispatch(updateCreationOrder({
                status: 'created',
                yes_asset: data.yes_asset,
                no_asset: data.no_asset,
                draw_asset: data.draw_asset,
                prediction_address
              }))

              const orderData = state.settings.creationOrder.data;
              const reserve_symbol = Object.entries(state.settings.reserveAssets).find(([_, asset]) => asset === (orderData.reserve_asset || 'base'))?.[0];

              store.dispatch(addMarketInList({
                ...orderData,
                aa_address: prediction_address,
                yes_asset: data.yes_asset,
                no_asset: data.no_asset,
                draw_asset: data.draw_asset,
                yes_price: 0,
                no_price: 0,
                draw_price: 0,
                yes_decimals: orderData.reserve_decimals,
                no_decimals: orderData.reserve_decimals,
                draw_decimals: orderData.reserve_decimals, // TODO: там нет reserve_decimals....
                yes_symbol: data.yes_asset.slice(0, 5),
                no_symbol: data.no_asset.slice(0, 5),
                draw_symbol: data.draw_asset ? data.draw_asset.slice(0, 5) : null,
                reserve_symbol
              }))
            }
          }
        }
      }
    }
  }

  const handleActivePredictionMarket = (result) => {
    const state = store.getState();
    const { subject, body } = result[1];
    const { aa_address, updatedStateVars } = body;

    if (subject === "light/aa_response" && aa_address === state.active.address) {
      let diff = {};
      if (updatedStateVars) {
        for (let var_name in updatedStateVars[aa_address]) {
          diff[var_name] = updatedStateVars[aa_address][var_name].value;
        }
      }

      if (!isEmpty(diff)) {
        store.dispatch(updateStateForActualMarket({ diff, address: aa_address }));
      }

      const recentEventObject = responseToEvent(body, state.active.params, state.active.stateVars);

      store.dispatch(addRecentEvent(recentEventObject));

    } else {
      console.log('handle req')
    }
  }

  client.client.ws.addEventListener("close", () => {
    clearInterval(updateMarkets);
    clearInterval(heartbeat);
  });
}