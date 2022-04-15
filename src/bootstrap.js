import config from "appConfig";
import { store } from "index";
import client from "services/obyte";
import { updateCreationOrder } from "store/slices/settingsSlice";

const getAAPayload = (messages = []) => messages.find(m => m.app === 'data')?.payload || {};

export const bootstrap = async () => {
  console.log("connect");


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
    }
  });

  const handleTokenRegistry = (result) => {
    const state = store.getState();
    const { subject, body } = result[1];
    const order = state.settings.creationOrder;
    const orderData = order?.data;
    if (!orderData) return null;

    if (subject === "light/aa_request") {
      const { messages, unit } = body.unit;
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
        if (order.yes_asset in responseVars || order.no_asset in responseVars || order.draw_asset && (order.draw_asset in responseVars)) {
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
      }
    }
  }

  const handleEventPredictionFactory = (result) => {
    const state = store.getState();
    const { subject, body } = result[1];
    const order = state.settings.creationOrder;
    const orderData = order?.data;
    console.log('pay1', orderData);
    if (!orderData) return null;

    if (subject === "light/aa_request") {
      const { messages, unit } = body.unit;
      const payload = getAAPayload(messages);
      console.log('pay2', payload, orderData, payload.event && orderData.event === payload.event, (String(orderData.end_of_trading_period) === String(payload.end_of_trading_period)), orderData.oracle === payload.oracle);

      if (order.status === 'order' && payload.event && orderData.event === payload.event && (String(orderData.end_of_trading_period) === String(payload.end_of_trading_period)) && orderData.oracle === payload.oracle) {
        console.log('req', result, payload);
        // actual order
        store.dispatch(updateCreationOrder({
          status: 'pending',
          creation_unit: unit
        }))
      }

    } else if (subject === "light/aa_response") {
      const { updatedStateVars, trigger_initial_unit } = body;
      console.log('res', !orderData, !updatedStateVars, order.status !== 'pending')
      if (!orderData || !updatedStateVars || updatedStateVars && !(config.FACTORY_AA in updatedStateVars) || order.status !== 'pending') return null;

      if (trigger_initial_unit === order.creation_unit) {
        const newFactoryStateVars = updatedStateVars[config.FACTORY_AA];
        const varName = Object.keys(newFactoryStateVars)?.[0];
        console.log('varName', varName)
        if (varName && varName.includes('prediction_')) {
          const prediction_address = varName.split("_")[1];

          if (prediction_address) {
            const data = newFactoryStateVars[varName]?.value;
            console.log('data', data)
            if (data && ('yes_asset' in data) && ('no_asset' in data)) {
              store.dispatch(updateCreationOrder({
                status: 'created',
                yes_asset: data.yes_asset,
                no_asset: data.no_asset,
                draw_asset: data.draw_asset,
                prediction_address
              }))
            }

            //TODO: Добавить в список prediction

          }

        }
        console.log('res', result)
      }
    }
  }

  client.client.ws.addEventListener("close", () => {
    clearInterval(heartbeat);
  });
}