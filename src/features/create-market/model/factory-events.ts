import type { AppDispatch, RootState } from "@/shared/lib/redux";
import type { FactoryPredictionVar, HubMessage, ObyteMessage, ObyteMessagePayload } from "@/shared/types/obyte";
import { CURRENT_FACTORY_AA } from "@/shared/config/env";
import type { OutcomeType } from "@/entities/market";

import { selectCreationOrder, updateCreationOrder } from "./creation-order-slice";

type EventContext = { dispatch: AppDispatch; getState: () => RootState };

const getAAPayload = (messages: ObyteMessage[] = []): ObyteMessagePayload => messages.find((m) => m.app === "data")?.payload || {};

/**
 * Factory AA events for the creation order in progress:
 * - the user's request reaches the factory → the order becomes `pending` (the caller may navigate to the create page);
 * - the factory responds with the new market → the order becomes `created` with its assets.
 */
export const handleFactoryEvent = ({ subject, body }: HubMessage, { dispatch, getState }: EventContext, { onOrderPending }: { onOrderPending?: () => void } = {}): void => {
  const order = selectCreationOrder(getState());
  const orderData = order?.data;
  if (!orderData || !body) return;

  if (subject === "light/aa_request" && body.unit) {
    const { messages, unit } = body.unit;
    const payload = getAAPayload(messages);

    if (order.status === "order" && String(orderData.event_date) === String(payload.event_date) && orderData.oracle === payload.oracle && orderData.feed_name === payload.feed_name) {
      dispatch(updateCreationOrder({ status: "pending", creation_unit_id: unit }));
      onOrderPending?.();
    }
  } else if (subject === "light/aa_response") {
    const { updatedStateVars, trigger_initial_unit } = body;

    if (!updatedStateVars || !(CURRENT_FACTORY_AA in updatedStateVars) || order.status !== "pending") return;
    if (trigger_initial_unit !== order.creation_unit_id) return;

    const newFactoryStateVars = updatedStateVars[CURRENT_FACTORY_AA];
    const varName = Object.keys(newFactoryStateVars)?.[0];

    if (!varName || !varName.includes("prediction_")) return;

    const prediction_address = varName.split("_")[1];
    if (!prediction_address) return;

    const data = newFactoryStateVars[varName]?.value as FactoryPredictionVar | undefined;

    if (data && (orderData.is_tokenless ? data.is_tokenless : "yes_asset" in data && "no_asset" in data)) {
      dispatch(updateCreationOrder({ status: "created", yes_asset: data.yes_asset, no_asset: data.no_asset, draw_asset: data.draw_asset, prediction_address }));
    }
  }
};

/** Token registry events: picks up the symbols registered for the outcome assets of a created order. */
export const handleTokenRegistryForOrder = ({ subject, body }: HubMessage, { dispatch, getState }: EventContext): void => {
  const order = selectCreationOrder(getState());
  if (!order?.data || !body) return;

  const outcomeOf = (asset?: string): OutcomeType | undefined => (asset === order.yes_asset ? "yes" : asset === order.no_asset ? "no" : asset === order.draw_asset ? "draw" : undefined);

  if (subject === "light/aa_request" && body.unit) {
    const payload = getAAPayload(body.unit.messages);

    if (payload.symbol && payload.asset && order.status === "created") {
      const type = outcomeOf(payload.asset as string);

      if (type) dispatch(updateCreationOrder({ [`${type}_symbol`]: payload.symbol as string }));
    }
  } else if (subject === "light/aa_response") {
    const responseVars = body.response?.responseVars as Record<string, string> | undefined;
    if (!responseVars) return;

    const has = (asset?: string): asset is string => !!asset && asset in responseVars;
    const asset = [order.yes_asset, order.no_asset, order.draw_asset].find(has);
    const type = outcomeOf(asset);

    if (asset && type && responseVars[asset]) {
      dispatch(updateCreationOrder({ [`${type}_symbol`]: responseVars[asset] }));
    }
  }
};
