import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the element named by `location.hash` once `ready` is true. The router's own hash
 * scrolling runs at navigation time, which is too early for anchors that render after data loads,
 * and its scroll restoration can undo an early scroll on the redirects that follow (language
 * prefix, default query). So this re-runs on every URL change, after the router's layout effects.
 * The jump is instant, as for a native anchor: a smooth scroll would stall in a background tab.
 */
export const useScrollToHash = (ready: boolean) => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (!ready || !hash) return;

    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: "start" });
  }, [ready, pathname, search, hash]);
};
