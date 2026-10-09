import { emptyProbabilities, floorDecimals, getDrawPercent, getFirstIssueOdds, getLiquidityAmounts, getLiquidityStake, getPercentSum, getSuggestedProbabilities, type Probabilities } from "./liquidity-math";

const probs = (yes: string | number, no: string | number, valid = true): Probabilities => ({ yes: { value: yes, valid }, no: { value: no, valid }, draw: { value: "", valid: true } });

describe("floorDecimals", () => {
  it("floors to the given number of decimals", () => {
    expect(floorDecimals(33.339, 2)).toBe(33.33);
    expect(floorDecimals(50, 2)).toBe(50);
  });
});

describe("getSuggestedProbabilities", () => {
  it("converts bookmaker odds into percentages (draw left empty) on the first issue", () => {
    expect(getSuggestedProbabilities(2, 3, 6, true)).toEqual({ yes: { value: 50, valid: true }, no: { value: 33.33, valid: true }, draw: { value: "", valid: true } });
  });

  it("suggests nothing when odds are missing or the market already has liquidity", () => {
    expect(getSuggestedProbabilities(2, 3, 6, false)).toBe(emptyProbabilities);
    expect(getSuggestedProbabilities(null, 3, 6, true)).toBe(emptyProbabilities);
    expect(getSuggestedProbabilities(2, 3, null, true)).toBe(emptyProbabilities);
  });
});

describe("getDrawPercent / getPercentSum", () => {
  it("gives the draw the remainder of 100% only when YES + NO leave one", () => {
    expect(getDrawPercent(probs(60, 25))).toBe(15);
    expect(getDrawPercent(probs(60, 40))).toBe(0);
    expect(getDrawPercent(probs(70, 40))).toBe(0);
    expect(getDrawPercent(probs(60, 25, false))).toBe(0);
  });

  it("sums the outcome shares, counting the draw only when allowed", () => {
    expect(getPercentSum(probs(60, 25), true)).toBe(100);
    expect(getPercentSum(probs(60, 25), false)).toBe(85);
    expect(getPercentSum(probs("", ""), true)).toBe(100); // 0 + 0 + draw 100
  });
});

describe("getLiquidityStake", () => {
  it("expresses the stake in the smallest unit and strips the network fee and (optionally) the issue fee", () => {
    expect(getLiquidityStake({ amount: "1", reserveDecimals: 9, networkFee: 1e4, issueFee: 0.01, needsIssueFee: true })).toEqual({ amountInPennies: 1_000_000_000, amountInPenniesWithoutFee: 989_990_000 });
    expect(getLiquidityStake({ amount: 1, reserveDecimals: 9, networkFee: 1e4, issueFee: 0.01, needsIssueFee: false })).toEqual({ amountInPennies: 1_000_000_000, amountInPenniesWithoutFee: 999_990_000 });
  });

  it("rounds the stake up", () => {
    expect(getLiquidityStake({ amount: "0.0000000001", reserveDecimals: 9, networkFee: 0, issueFee: 0, needsIssueFee: false }).amountInPennies).toBe(1);
  });
});

describe("getLiquidityAmounts", () => {
  const base = { supply_yes: 774_596_669, supply_no: 632_455_532, supply_draw: 0, reserve: 1_000_000_000 };

  it("on the first issue splits the stake by the square root of each probability", () => {
    expect(getLiquidityAmounts({ ...base, amountInPenniesWithoutFee: 1e9, isFirstIssue: true, allowDraw: false, probabilities: probs(60, 40) })).toEqual({ yesAmount: 774_596_669, noAmount: 632_455_532, drawAmount: 0 });
  });

  it("on the first issue gives the draw its remainder share only when allowed", () => {
    const withDraw = getLiquidityAmounts({ ...base, amountInPenniesWithoutFee: 1e9, isFirstIssue: true, allowDraw: true, probabilities: probs(50, 30) });
    const withoutDraw = getLiquidityAmounts({ ...base, amountInPenniesWithoutFee: 1e9, isFirstIssue: true, allowDraw: false, probabilities: probs(50, 30) });

    expect(withDraw).toEqual({ yesAmount: 707_106_781, noAmount: 547_722_557, drawAmount: 447_213_595 });
    expect(withoutDraw.drawAmount).toBe(0);
  });

  it("treats empty probabilities as zero", () => {
    expect(getLiquidityAmounts({ ...base, amountInPenniesWithoutFee: 1e9, isFirstIssue: true, allowDraw: false, probabilities: probs("", "") })).toEqual({ yesAmount: 0, noAmount: 0, drawAmount: 0 });
  });

  it("after the first issue mints proportionally to the current supplies, rounded up", () => {
    expect(getLiquidityAmounts({ ...base, amountInPenniesWithoutFee: 1e8, isFirstIssue: false, allowDraw: false, probabilities: emptyProbabilities })).toEqual({ yesAmount: 77_459_667, noAmount: 63_245_554, drawAmount: 0 });
  });
});

describe("getFirstIssueOdds", () => {
  it("derives the odds multiplier of each staked outcome and null for an unstaked one", () => {
    const amounts = { yesAmount: 774_596_669, noAmount: 632_455_532, drawAmount: 0 };
    const odds = getFirstIssueOdds(1e9, amounts, probs(60, 40));

    expect(odds.yes).toBeCloseTo(1.6667, 4);
    expect(odds.no).toBeCloseTo(2.5, 4);
    expect(odds.draw).toBeNull();
  });

  it("returns null for YES when its probability is zero", () => {
    const amounts = getLiquidityAmounts({ amountInPenniesWithoutFee: 1e9, isFirstIssue: true, allowDraw: true, probabilities: probs(0, 50), supply_yes: 0, supply_no: 0, supply_draw: 0, reserve: 0 });
    const odds = getFirstIssueOdds(1e9, amounts, probs(0, 50));

    expect(odds.yes).toBeNull();
    expect(odds.no).toBeCloseTo(2, 4);
    expect(odds.draw).toBeCloseTo(2, 4);
  });
});
