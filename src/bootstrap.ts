import { store } from "store/store";
import { isEmpty } from "lodash-es";
import { toast } from "sonner";

import client from "services/obyte";

import { updateStateForActualMarket, updateSymbolForActualMarket } from "store/slices/activeSlice";
import { updateCreationOrder } from "store/slices/settingsSlice";
import { setActiveMarket } from "store/thunks/setActiveMarket";
import { checkCreationOrder } from "store/thunks/checkCreationOrder";
import { checkDataFeed } from "store/thunks/checkDataFeed";
import { loadEVMTokens } from "store/thunks/loadEVMTokens";
import { loadUserBalance } from "store/thunks/loadUserBalance";
import { addRecentEvent } from "store/thunks/addRecentEvent";
import type { AAResponseBody, FactoryPredictionVar, HubMessage, ObyteMessage, ObyteMessagePayload, OutcomeType, StateVarValue } from "store/types";
import { normalizeStateVars } from "utils/normalizeStateVars";

import i18n from "locale";
import config from "appConfig";

import { router } from "router";

type HubEvent = [string, HubMessage];

const getAAPayload = (messages: ObyteMessage[] = []): ObyteMessagePayload => messages.find(m => m.app === 'data')?.payload || {};

let inited = false;

export const bootstrap = async () => {
  console.log("connect");
  // load data from backend
  store.dispatch(checkCreationOrder());
  store.dispatch(loadEVMTokens());

  const state = store.getState();

  if (state.settings.walletAddress) {
    store.dispatch(loadUserBalance(state.settings.walletAddress));
    await client.justsaying("light/new_address_to_watch", state.settings.walletAddress);
  }

  if (state.active.address && inited) { // reload data for active market
    store.dispatch(setActiveMarket({ address: state.active.address }));
  }

  const heartbeat = setInterval(() => {
    client.api.heartbeat();
  }, 10 * 1000);

  const checkOracleData = setInterval(() => {
    store.dispatch(checkDataFeed());
  }, 10 * 60 * 1000)

  const tokenRegistry: string = client.api.getOfficialTokenRegistryAddress();

  await client.justsaying("light/new_aa_to_watch", {
    aa: config.FACTORY_AAS[config.FACTORY_AAS.length - 1]
  });

  await client.justsaying("light/new_aa_to_watch", {
    aa: tokenRegistry
  });

  inited = true;

  client.subscribe((err: unknown, result: unknown) => {
    if (err) return null;

    const event = result as HubEvent;
    const { body, subject } = event[1];
    const state = store.getState();
    if (subject === "joint" && state.settings.walletAddress) {
      store.dispatch(loadUserBalance(state.settings.walletAddress));
    } else if (body) {
      if (body.aa_address === config.FACTORY_AAS[config.FACTORY_AAS.length - 1]) {
        handleEventPredictionFactory(event);
      } else if (body.aa_address === tokenRegistry) {
        handleTokenRegistry(event);
      } else if (state.active.address && body.aa_address === state.active.address) {
        handleActivePredictionMarket(event);
      }
    }
  });

  const handleTokenRegistry = (result: HubEvent) => {
    const state = store.getState();
    const { subject, body } = result[1];
    const order = state.settings.creationOrder;
    const orderData = order?.data;
    if (!orderData) return null;

    if (subject === "light/aa_request") {
      const { messages } = body!.unit!;
      const payload = getAAPayload(messages);

      if (payload.symbol && payload.asset && order.status === 'created') {
        const asset = payload.asset;
        if (asset === order.yes_asset || asset === order.no_asset || asset === order.draw_asset) {
          const type: OutcomeType = asset === order.yes_asset ? 'yes' : (asset === order.no_asset ? 'no' : 'draw');

          store.dispatch(updateCreationOrder({
            [`${type}_symbol`]: payload.symbol as string
          }))
        }

      }
    } else if (subject === "light/aa_response") {
      const responseVars = body!.response?.responseVars as Record<string, string> | undefined;

      if (responseVars) {
        const has = (asset?: string): asset is string => !!asset && asset in responseVars;

        if (has(order.yes_asset) || has(order.no_asset) || has(order.draw_asset)) {
          const type: OutcomeType = has(order.yes_asset) ? 'yes' : (has(order.no_asset) ? 'no' : 'draw');
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

          if (has(yes_asset)) {
            store.dispatch(updateSymbolForActualMarket({ type: 'yes', symbol: responseVars[yes_asset] }));
          } else if (has(no_asset)) {
            store.dispatch(updateSymbolForActualMarket({ type: 'no', symbol: responseVars[no_asset] }))
          } else if (has(draw_asset)) {
            store.dispatch(updateSymbolForActualMarket({ type: 'draw', symbol: responseVars[draw_asset] }))
          }
        }
      }
    }
  }

  const handleEventPredictionFactory = (result: HubEvent) => {
    const state = store.getState();
    const { subject, body } = result[1];
    const order = state.settings.creationOrder;
    const orderData = order?.data;
    if (!orderData) return null;

    if (subject === "light/aa_request") {
      const { messages, unit } = body!.unit!;
      const payload = getAAPayload(messages);

      if (order.status === 'order' && (String(orderData.event_date) === String(payload.event_date)) && orderData.oracle === payload.oracle && orderData.feed_name === payload.feed_name) {
        // actual order
        store.dispatch(updateCreationOrder({
          status: 'pending',
          creation_unit_id: unit
        }));

        const lang = state.settings.lang;
        const langPath = (!lang || lang === 'en') ? '' : `/${lang}`;

        router.navigate(`${langPath}/create`);
      }

    } else if (subject === "light/aa_response") {
      const { updatedStateVars, trigger_initial_unit } = body!;

      if (!orderData || !updatedStateVars || (updatedStateVars && !(config.FACTORY_AAS[config.FACTORY_AAS.length - 1] in updatedStateVars)) || order.status !== 'pending') return null;

      if (trigger_initial_unit === order.creation_unit_id) {
        const newFactoryStateVars = updatedStateVars[config.FACTORY_AAS[config.FACTORY_AAS.length - 1]];
        const varName = Object.keys(newFactoryStateVars)?.[0];

        if (varName && varName.includes('prediction_')) {
          const prediction_address = varName.split("_")[1];

          if (prediction_address) {
            const data = newFactoryStateVars[varName]?.value as FactoryPredictionVar | undefined;

            if (data && (orderData.is_tokenless ? data.is_tokenless : ('yes_asset' in data) && ('no_asset' in data))) {
              store.dispatch(updateCreationOrder({
                status: 'created',
                yes_asset: data.yes_asset,
                no_asset: data.no_asset,
                draw_asset: data.draw_asset,
                prediction_address
              }))
            }
          }
        }
      }
    }
  }

  const handleActivePredictionMarket = (result: HubEvent) => {
    const state = store.getState();
    const { subject, body } = result[1];
    const { aa_address, updatedStateVars, unit } = body!;

    const author = unit?.authors?.[0]?.address;

    if (subject === "light/aa_response") {
      const updatedVars: Record<string, StateVarValue> = {};
      if (updatedStateVars) {
        for (const var_name in updatedStateVars[aa_address]) {
          updatedVars[var_name] = updatedStateVars[aa_address][var_name].value;
        }
      }

      const diff = normalizeStateVars(updatedVars);

      if (!isEmpty(diff)) {
        store.dispatch(updateStateForActualMarket({ diff, address: aa_address }));
      }

      store.dispatch(addRecentEvent(body as AAResponseBody));

    } else if (subject === "light/aa_request" && state.settings.walletAddress && author === state.settings.walletAddress) {
      toast.info(i18n.t("common.received_request", "Received your request. The interface will update after the transaction stabilizes."), { position: 'top-center' });
    }
  }

  client.client.ws.addEventListener("close", () => {
    clearInterval(heartbeat);
    clearInterval(checkOracleData);
  });
}
