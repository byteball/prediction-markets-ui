import type { MarketStateVars, OutcomeAmounts, StateVarValue } from "@/store/types";

const isOutcomeAmounts = (value: unknown): value is OutcomeAmounts => !!value && typeof value === "object" && typeof (value as OutcomeAmounts).yes === "number" && typeof (value as OutcomeAmounts).no === "number";

// v1 AAs keep supply_yes/supply_no/supply_draw, v2 AAs keep them in `supplies`; every var is kept, supplies are mirrored into the v1 keys.
export const normalizeStateVars = (vars: Record<string, StateVarValue | undefined> = {}): MarketStateVars => {
  const result: Record<string, StateVarValue | undefined> = { ...vars };
  const supplies = result.supplies;

  if (isOutcomeAmounts(supplies)) {
    result.supply_yes = supplies.yes;
    result.supply_no = supplies.no;
    result.supply_draw = supplies.draw;
  }

  return result as MarketStateVars;
};
