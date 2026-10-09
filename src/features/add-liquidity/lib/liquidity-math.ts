// Pure math behind the "Add liquidity" form: how a reserve stake is split between the outcomes
// and which odds that implies. Kept free of React so it can be pinned by tests before the form
// is turned into hooks.

export type Probability = { value: string | number; valid: boolean };
export type Probabilities = { yes: Probability; no: Probability; draw: Probability };

export const emptyProbabilities: Probabilities = { yes: { value: "", valid: true }, no: { value: "", valid: true }, draw: { value: "", valid: true } };

export const floorDecimals = (number: number, decimals: number) => Math.floor(number * 10 ** decimals) / 10 ** decimals;

/** Probabilities implied by bookmaker odds, suggested only for the first issue of a market. */
export const getSuggestedProbabilities = (yes_odds: number | null, no_odds: number | null, draw_odds: number | null, isFirstIssue: boolean): Probabilities => {
  if (!(yes_odds && no_odds && draw_odds && isFirstIssue)) return emptyProbabilities;

  const sum = 1 / yes_odds + 1 / no_odds + 1 / draw_odds;

  return {
    yes: { value: floorDecimals((1 / yes_odds / sum) * 100, 2), valid: true },
    no: { value: floorDecimals((1 / no_odds / sum) * 100, 2), valid: true },
    draw: { value: "", valid: true },
  };
};

/** The DRAW share is whatever YES and NO leave of 100%, or 0 when they do not leave a valid remainder. */
export const getDrawPercent = (probabilities: Probabilities): number =>
  probabilities.yes.valid && probabilities.no.valid && Number(probabilities.no.value) + Number(probabilities.yes.value) < 100 ? 100 - Number(probabilities.no.value) - Number(probabilities.yes.value) : 0;

export const getPercentSum = (probabilities: Probabilities, allowDraw: boolean | number | undefined): number =>
  Number(probabilities.no.value || 0) + Number(probabilities.yes.value || 0) + (allowDraw ? getDrawPercent(probabilities) : 0);

export type LiquidityStakeParams = {
  /** User-entered stake, already converted into the reserve asset (estimate for EVM-sourced stakes). */
  amount: string | number | undefined;
  reserveDecimals: number;
  networkFee: number;
  issueFee: number;
  /** Only the first market version charges the issue fee on liquidity. */
  needsIssueFee: boolean;
};

export type LiquidityStake = { amountInPennies: number; amountInPenniesWithoutFee: number };

export const getLiquidityStake = ({ amount, reserveDecimals, networkFee, issueFee, needsIssueFee }: LiquidityStakeParams): LiquidityStake => {
  const amountInPennies = Math.ceil(Number(amount) * 10 ** reserveDecimals);
  const amountInPenniesWithoutFee = amountInPennies * (1 - (needsIssueFee ? issueFee : 0)) - networkFee;

  return { amountInPennies, amountInPenniesWithoutFee };
};

export type LiquidityAmountsParams = {
  amountInPenniesWithoutFee: number;
  isFirstIssue: boolean;
  allowDraw: boolean | number | undefined;
  probabilities: Probabilities;
  supply_yes: number;
  supply_no: number;
  supply_draw: number;
  reserve: number;
};

export type LiquidityAmounts = { yesAmount: number; noAmount: number; drawAmount: number };

/**
 * Outcome token amounts minted for a liquidity stake.
 * First issue: the stake is split by the chosen probabilities. Later: proportionally to the current supplies.
 */
export const getLiquidityAmounts = ({ amountInPenniesWithoutFee, isFirstIssue, allowDraw, probabilities, supply_yes, supply_no, supply_draw, reserve }: LiquidityAmountsParams): LiquidityAmounts => {
  if (isFirstIssue) {
    const drawPercent = getDrawPercent(probabilities);

    return {
      yesAmount: Math.floor(Math.sqrt(amountInPenniesWithoutFee ** 2 * (Number(probabilities.yes.value) / 100 || 0))),
      noAmount: Math.floor(Math.sqrt(amountInPenniesWithoutFee ** 2 * (Number(probabilities.no.value) / 100 || 0))),
      drawAmount: allowDraw ? Math.floor(Math.sqrt(amountInPenniesWithoutFee ** 2 * (drawPercent / 100 || 0))) : 0,
    };
  }

  const ratio = (amountInPenniesWithoutFee + reserve) / reserve;

  return {
    yesAmount: Math.ceil(ratio * supply_yes - supply_yes),
    noAmount: Math.ceil(ratio * supply_no - supply_no),
    drawAmount: Math.ceil(ratio * supply_draw - supply_draw),
  };
};

export type FirstIssueOdds = { yes: number | null; no: number | null; draw: number | null };

/** Odds multipliers implied by the first issue split; null for an outcome with no stake. */
export const getFirstIssueOdds = (amountInPenniesWithoutFee: number, { yesAmount, noAmount, drawAmount }: LiquidityAmounts, probabilities: Probabilities): FirstIssueOdds => {
  const new_den = Math.sqrt(yesAmount * yesAmount + noAmount * noAmount + drawAmount * drawAmount);
  const odds = (amount: number) => +(amountInPenniesWithoutFee / amount / (amount / new_den)).toFixed(4);

  return {
    yes: Number(probabilities.yes.value) !== 0 ? odds(yesAmount) : null,
    no: Number(probabilities.no.value) !== 0 ? odds(noAmount) : null,
    draw: getDrawPercent(probabilities) !== 0 ? odds(drawAmount) : null,
  };
};
