import { isEmpty } from "lodash-es";

import type { AppDispatch, RootState } from "@/shared/lib/redux";
import type { AAResponseBody, HubMessage, StateVarValue } from "@/shared/types/obyte";

import { normalizeStateVars } from "../lib/normalize-state-vars";
import { addRecentEvent } from "./add-recent-event";
import { selectActiveAddress, selectActiveMarketStateVars, updateStateForActualMarket, updateSymbolForActualMarket } from "./market-slice";

type EventContext = { dispatch: AppDispatch; getState: () => RootState };

/**
 * Hub events of the market currently opened: an AA response updates the state vars and the recent
 * events feed. Returns true when the request came from `walletAddress` (the caller may notify the user).
 */
export const handleMarketEvent = ({ subject, body }: HubMessage, { dispatch, getState }: EventContext, walletAddress?: string | null): boolean => {
  if (!body) return false;

  const { aa_address, updatedStateVars, unit } = body;
  if (selectActiveAddress(getState()) !== aa_address) return false;

  if (subject === "light/aa_response") {
    const updatedVars: Record<string, StateVarValue> = {};

    if (updatedStateVars) {
      for (const varName in updatedStateVars[aa_address]) {
        updatedVars[varName] = updatedStateVars[aa_address][varName].value;
      }
    }

    const diff = normalizeStateVars(updatedVars);

    if (!isEmpty(diff)) {
      dispatch(updateStateForActualMarket({ diff, address: aa_address }));
    }

    dispatch(addRecentEvent(body as AAResponseBody));

    return false;
  }

  const author = unit?.authors?.[0]?.address;

  return subject === "light/aa_request" && !!walletAddress && author === walletAddress;
};

/** Token registry responses: picks up the symbols registered for the opened market's outcome assets. */
export const handleTokenRegistryForMarket = ({ subject, body }: HubMessage, { dispatch, getState }: EventContext): void => {
  if (subject !== "light/aa_response") return;

  const responseVars = body?.response?.responseVars as Record<string, string> | undefined;
  const state = getState();

  if (!responseVars || !selectActiveAddress(state)) return;

  const { yes_asset, no_asset, draw_asset } = selectActiveMarketStateVars(state);
  const has = (asset?: string): asset is string => !!asset && asset in responseVars;

  if (has(yes_asset)) {
    dispatch(updateSymbolForActualMarket({ type: "yes", symbol: responseVars[yes_asset] }));
  } else if (has(no_asset)) {
    dispatch(updateSymbolForActualMarket({ type: "no", symbol: responseVars[no_asset] }));
  } else if (has(draw_asset)) {
    dispatch(updateSymbolForActualMarket({ type: "draw", symbol: responseVars[draw_asset] }));
  }
};
