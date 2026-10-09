import ReactGA from "react-ga4";

/** Every analytics event the app sends, so a typo in a category or action is a compile error. */
export type AnalyticsEvent =
  | { category: "user-engagement"; action: "click-trade" | "click-buy" | "click-sell" | "click-add-liquidity" | "click-view-params" | "click-wallet" | "save-wallet"; label?: string }
  | { category: "Trade"; action: "Buy" | "Buy CS" | "Redeem" | "Add liquidity" | "Add liquidity CS"; label?: string }
  | { category: "Create"; action: `Create ${string} market`; label?: string }
  | { category: "outbound-click"; action: `click-social_${string}` };

export const track = (event: AnalyticsEvent): void => {
  ReactGA.event(event);
};
