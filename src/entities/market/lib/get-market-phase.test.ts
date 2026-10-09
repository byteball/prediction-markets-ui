import { getMarketPhase } from "./get-market-phase";

// Pins the status logic previously inlined in the market page.
const EVENT = 1_700_000_000;
const QUIET = 3600; // 1 hour
const WAITING = 86_400 * 7; // 7 days
const market = { event_date: EVENT, quiet_period: QUIET, waiting_period_length: WAITING, result: null };

describe("getMarketPhase", () => {
  it("is trading until the quiet period starts, counting down to the event", () => {
    expect(getMarketPhase(market, EVENT - QUIET - 1)).toEqual({ phase: "trading", isTradeActive: true, canCommitResult: false, canClaim: false, timerExpiry: EVENT });
  });

  it("enters the quiet period exactly when event_date - quiet_period is reached", () => {
    expect(getMarketPhase(market, EVENT - QUIET)).toEqual({ phase: "quiet_period", isTradeActive: false, canCommitResult: false, canClaim: false });
    expect(getMarketPhase(market, EVENT - 1).phase).toBe("quiet_period");
  });

  it("has no quiet period by default", () => {
    expect(getMarketPhase({ event_date: EVENT, waiting_period_length: WAITING }, EVENT - 1).phase).toBe("trading");
  });

  it("waits for the oracle after the event, counting down to the end of the waiting period", () => {
    expect(getMarketPhase(market, EVENT)).toEqual({ phase: "waiting", isTradeActive: false, canCommitResult: true, canClaim: false, timerExpiry: EVENT + WAITING });
    expect(getMarketPhase(market, EVENT + WAITING - 1).phase).toBe("waiting");
  });

  it("resumes trading when the waiting period passes without a result", () => {
    expect(getMarketPhase(market, EVENT + WAITING)).toEqual({ phase: "resumed", isTradeActive: true, canCommitResult: true, canClaim: false });
  });

  it("is claiming as soon as a result exists after the event, regardless of the waiting period", () => {
    const resolved = { ...market, result: "yes" };

    expect(getMarketPhase(resolved, EVENT)).toEqual({ phase: "claiming", isTradeActive: false, canCommitResult: false, canClaim: true });
    expect(getMarketPhase(resolved, EVENT + WAITING * 2).phase).toBe("claiming");
  });

  it("ignores a result before the event", () => {
    const resolved = { ...market, result: "yes" };

    expect(getMarketPhase(resolved, EVENT - QUIET - 1).phase).toBe("trading");
    expect(getMarketPhase(resolved, EVENT - 1).phase).toBe("quiet_period");
  });
});
