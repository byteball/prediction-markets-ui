import getStore from "store";

// The single app-wide store instance, created once. It lives here — not in the
// data-layer providers) can reach the store without pulling in the render bootstrap.
export const { store, persistor } = getStore();
