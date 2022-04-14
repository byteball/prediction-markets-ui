import config from "appConfig";
import { store } from "index";
import client from "services/obyte";
import { updateCreationOrder } from "store/slices/settingsSlice";

const getAAPayload = (messages = []) => messages.find(m => m.app === 'data')?.payload || {};

export const bootstrap = async () => {
  console.log("connect");
  const state = store.getState();

  const heartbeat = setInterval(function () {
    client.api.heartbeat();
  }, 10 * 1000);

  await client.justsaying("light/new_aa_to_watch", {
    aa: config.FACTORY_AA
  });

  client.subscribe((err, result) => {
    if (err) return null;

    const { body } = result[1];

    if (body.aa_address === config.FACTORY_AA) {
      handleEventPredictionFactory(result);
    }
  });

  const handleEventPredictionFactory = (result) => {
    const { subject, body } = result[1];
    const order = state.settings.creationOrder;
    const orderData = order?.data;

    if (!orderData) return null;

    if (subject === "light/aa_request") {
      const { messages, unit } = body.unit;
      const payload = getAAPayload(messages);
      console.log('pay', payload);

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

      if (!orderData || !updatedStateVars || !(config.FACTORY_AA in updatedStateVars) || order.status !== 'pending') return null;

      if (trigger_initial_unit === order.creation_unit) {
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