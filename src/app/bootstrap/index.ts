import { toast } from "sonner";

import client from "@/shared/api/obyte-client";
import { CURRENT_FACTORY_AA } from "@/shared/config/env";
import { getLangPath } from "@/shared/lib/lang-path";
import i18n from "@/shared/i18n";
import type { HubEvent } from "@/shared/types/obyte";
import { checkDataFeed, handleMarketEvent, handleTokenRegistryForMarket, setActiveMarket } from "@/entities/market";
import { loadUserBalance } from "@/entities/wallet";
import { loadEVMTokens } from "@/entities/bridge";
import { checkCreationOrder, handleFactoryEvent, handleTokenRegistryForOrder } from "@/features/create-market";

import { persistor, store } from "../store";
import { router } from "../router/router";

const HEARTBEAT_MS = 10 * 1000;
const ORACLE_CHECK_MS = 10 * 60 * 1000;

const context = { dispatch: store.dispatch, getState: store.getState };

let started = false;
let connectedBefore = false;
let timers: ReturnType<typeof setInterval>[] = [];

const clearTimers = () => {
  timers.forEach(clearInterval);
  timers = [];
};

/** Resolves once redux-persist has restored the wallet address, language and creation order. */
const whenRehydrated = () =>
  new Promise<void>((resolve) => {
    if (persistor.getState().bootstrapped) return resolve();

    const unsubscribe = persistor.subscribe(() => {
      if (persistor.getState().bootstrapped) {
        unsubscribe();
        resolve();
      }
    });
  });

/**
 * Runs on every hub (re)connection: reloads what the session needs and renews the subscriptions.
 * obyte.js drops its notification subscribers on every `connect()`, so the hub subscription has to be
 * re-registered here, before anything is awaited, or events after a reconnect are lost.
 */
const handleConnect = async () => {
  client.subscribe(routeHubEvent);

  await whenRehydrated();

  store.dispatch(checkCreationOrder());
  store.dispatch(loadEVMTokens());

  const state = store.getState();

  if (state.wallet.address) {
    store.dispatch(loadUserBalance(state.wallet.address));
    await client.justsaying("light/new_address_to_watch", state.wallet.address);
  }

  if (state.market.address && connectedBefore) {
    // the hub forgets watched AAs on disconnect; reload the opened market and watch it again
    store.dispatch(setActiveMarket({ address: state.market.address }));
  }

  clearTimers();
  timers.push(
    setInterval(() => client.api.heartbeat(), HEARTBEAT_MS),
    setInterval(() => store.dispatch(checkDataFeed()), ORACLE_CHECK_MS)
  );

  await client.justsaying("light/new_aa_to_watch", { aa: CURRENT_FACTORY_AA });
  await client.justsaying("light/new_aa_to_watch", { aa: client.api.getOfficialTokenRegistryAddress() });

  connectedBefore = true;

  client.client.ws.addEventListener("close", clearTimers);
};

/** Routes a hub event to the slice that owns it. */
const routeHubEvent = (err: unknown, result: unknown) => {
  if (err) return;

  const message = (result as HubEvent)[1];
  const { body, subject } = message;
  const state = store.getState();

  if (subject === "joint" && state.wallet.address) {
    store.dispatch(loadUserBalance(state.wallet.address));
    return;
  }

  if (!body) return;

  if (body.aa_address === CURRENT_FACTORY_AA) {
    handleFactoryEvent(message, context, {
      onOrderPending: () => router.navigate(`${getLangPath(store.getState().locale.lang)}/create`),
    });
  } else if (body.aa_address === client.api.getOfficialTokenRegistryAddress()) {
    handleTokenRegistryForOrder(message, context);
    handleTokenRegistryForMarket(message, context);
  } else if (state.market.address && body.aa_address === state.market.address) {
    const isOwnRequest = handleMarketEvent(message, context, state.wallet.address);

    if (isOwnRequest) {
      toast.info(i18n.t("common.received_request", "Received your request. The interface will update after the transaction stabilizes."), { position: "top-center" });
    }
  }
};

/** Wires the Obyte hub connection to the store: registered once, before the socket opens. */
export const startBootstrap = () => {
  if (started) return;
  started = true;

  client.onConnect(handleConnect);
};
