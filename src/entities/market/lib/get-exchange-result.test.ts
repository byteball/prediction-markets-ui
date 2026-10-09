import { get_reserve, get_result_for_buying_by_type, getExchangeResult, type ExchangeParams, type ExchangeStateVars } from "./get-exchange-result";

// Characterization tests: they pin the current AMM math (reserve = coef * sqrt(yes² + no² + draw²),
// fees and arb profit tax) before the code moves into entities/market/lib. The exact numbers are
// the output of the implementation at the time of writing; changing them means changing behavior.

const params: ExchangeParams = { issue_fee: 0.01, redeem_fee: 0.02, arb_profit_tax: 0.9, allow_draw: false, reserve_asset: "base" };
const paramsWithDraw: ExchangeParams = { ...params, allow_draw: true };

const emptyMarket: ExchangeStateVars = { coef: 1, reserve: 0, supply_yes: 0, supply_no: 0, supply_draw: 0 };
// A market after a 1 GB first issue split 60/40 (amounts in bytes).
const liveMarket: ExchangeStateVars = { coef: 1.0101, reserve: 1_000_000_000, supply_yes: 774_596_669, supply_no: 632_455_532, supply_draw: 0 };
const liveMarketWithDraw: ExchangeStateVars = { coef: 1.02, reserve: 1_500_000_000, supply_yes: 900_000_000, supply_no: 800_000_000, supply_draw: 700_000_000 };

describe("get_reserve", () => {
  it("is coef * sqrt(yes² + no² + draw²), rounded up", () => {
    expect(get_reserve({ coef: 1 }, 3, 4, 0)).toBe(5);
    expect(get_reserve({ coef: 1.5 }, 3, 4, 0)).toBe(8); // 7.5 -> 8
    expect(get_reserve({}, 1, 1, 1)).toBe(2); // coef defaults to 1, sqrt(3) -> 2
  });
});

describe("getExchangeResult", () => {
  it("returns null when no token amount is given", () => {
    expect(getExchangeResult(liveMarket, params)).toBeNull();
    expect(getExchangeResult(liveMarket, params, 0, 0, 0)).toBeNull();
  });

  describe("first issue on an empty market", () => {
    const result = getExchangeResult(emptyMarket, params, 600_000_000, 400_000_000)!;

    it("has no arb profit tax and no old prices", () => {
      expect(result.arb_profit_tax).toBe(0);
      expect(result.percentage_arb_profit_tax).toBe(0);
      expect(result.old_yes_price).toBe(0);
      expect(result.old_no_price).toBe(0);
      expect(result.new_yes_price).toBe(0);
    });

    it("charges the issue fee on the reserve needed and the base network fee", () => {
      expect(result.reserve_needed).toBe(721_110_256);
      expect(result.fee).toBe(7_211_103); // ceil(721110256 * 0.01)
      expect(result.network_fee).toBe(10_000);
      expect(result.new_reserve).toBe(728_321_359); // reserve + fee
      expect(result.issue_fee).toBeCloseTo(7_283_213.59, 2); // (reserve_needed + fee) * issue_fee
      expect(result.redeem_fee).toBe(0);
      expect(result.payout).toBe(0);
    });

    it("reports the fee percentage relative to reserve + fee + network fee", () => {
      expect(result.percentage_total_fee).toBe(0.99);
      expect(result.percentage_redeem_fee).toBeNaN(); // 0 / 0 — the UI never shows it for an issue
      expect(result.next_coef).toBeCloseTo(1.01, 6);
      expect(result.new_supply_yes).toBe(600_000_000);
      expect(result.new_supply_no).toBe(400_000_000);
      expect(result.new_supply_draw).toBe(0);
    });
  });

  describe("issuing YES on a live market", () => {
    const result = getExchangeResult(liveMarket, params, 100_000_000)!;

    it("matches the pinned numbers", () => {
      expect(result).toMatchObject({
        reserve_needed: 90_215_363,
        new_reserve: 1_092_741_586,
        payout: 0,
        fee: 2_526_223,
        total_fee: 2_526_223,
        network_fee: 10_000,
        issue_fee: 927_415.86,
        redeem_fee: 0,
        percentage_arb_profit_tax: 0.15,
        percentage_total_fee: 0.23,
        old_reserve: 1_000_000_000,
        old_coef: 1.0101,
        old_supply_yes: 774_596_669,
        new_supply_yes: 874_596_669,
        new_supply_no: 632_455_532,
        new_supply_draw: 0,
      });
      expect(result.arb_profit_tax).toBeCloseTo(1_624_068.93, 2);
      expect(result.next_coef).toBeCloseTo(1.0124406, 7);
      expect(result.old_yes_price).toBeCloseTo(0.78242, 5);
      expect(result.old_no_price).toBeCloseTo(0.63884, 5);
      expect(result.new_yes_price).toBeCloseTo(0.81851, 5);
      expect(result.new_no_price).toBeCloseTo(0.5919, 4);
    });
  });

  describe("redeeming NO on a live market", () => {
    const result = getExchangeResult(liveMarket, params, 0, -100_000_000)!;

    it("pays out the reserve delta minus redeem fee and arb tax, with no network fee", () => {
      expect(result).toMatchObject({
        reserve_needed: 0,
        payout: 50_554_951,
        new_reserve: 953_455_431,
        fee: 4_010_382,
        total_fee: 4_010_382,
        network_fee: 0,
        issue_fee: 0,
        redeem_fee: 1_011_099.02,
        percentage_redeem_fee: 2,
        percentage_arb_profit_tax: 5.93,
        percentage_total_fee: 7.93,
        new_supply_yes: 774_596_669,
        new_supply_no: 532_455_532,
      });
      expect(result.arb_profit_tax).toBeCloseTo(2_999_282.09, 2);
      expect(result.next_coef).toBeCloseTo(1.0143666, 7);
      expect(result.new_yes_price).toBeCloseTo(0.8324, 4);
      expect(result.new_no_price).toBeCloseTo(0.57219, 5);
    });
  });

  it("charges no network fee when the reserve asset is not bytes, everything else being equal", () => {
    const base = getExchangeResult(liveMarket, params, 100_000_000)!;
    const custom = getExchangeResult(liveMarket, { ...params, reserve_asset: "SOME_ASSET" }, 100_000_000)!;

    expect(custom.network_fee).toBe(0);
    expect({ ...custom, network_fee: base.network_fee }).toEqual(base);
  });

  it("taxes the draw leg only when draws are allowed", () => {
    const withDraw = getExchangeResult(liveMarketWithDraw, paramsWithDraw, 0, 0, 50_000_000)!;
    const withoutDraw = getExchangeResult(liveMarketWithDraw, { ...paramsWithDraw, allow_draw: false }, 0, 0, 50_000_000)!;

    expect(withDraw.arb_profit_tax).toBeGreaterThan(0);
    expect(withoutDraw.arb_profit_tax).toBe(0);
    expect(withDraw.reserve_needed).toBe(withoutDraw.reserve_needed);
    expect(withDraw.new_supply_draw).toBe(750_000_000);
  });
});

describe("get_result_for_buying_by_type", () => {
  it("on an empty market converts the whole net stake into tokens of the chosen type", () => {
    const result = get_result_for_buying_by_type(emptyMarket, { issue_fee: 0.01, reserve_asset: "base", arb_profit_tax: 0.9 }, "yes", 100_010_000);

    expect(result.network_fee).toBe(10_000);
    expect(result.issue_fee).toBe(1_000_000); // ceil(100_000_000 * 0.01)
    expect(result.arb_profit_tax).toBe(0);
    expect(result.fee).toBe(1_000_000);
    expect(result.amount).toBe(99_000_000); // reserve without fee, coef 1
    expect(result.reserve_needed).toBe(99_000_000);
    expect(result.new_reserve).toBe(100_000_000);
    expect(result.total_fee).toBe(1_010_000);
    expect(result.percentage_total_fee).toBe(1.01);
    expect(result.new_supply_yes).toBe(99_000_000);
    expect(result.new_supply_no).toBe(0);
    expect(result.new_yes_price).toBeCloseTo(1.0101, 4);
  });

  it("uses the default fees when params omit them", () => {
    const withDefaults = get_result_for_buying_by_type(emptyMarket, {}, "no", 100_010_000);
    const explicit = get_result_for_buying_by_type(emptyMarket, { issue_fee: 0.01, reserve_asset: "base", arb_profit_tax: 0.9 }, "no", 100_010_000);

    expect(withDefaults).toEqual(explicit);
  });

  describe("buying YES on a live market", () => {
    const result = get_result_for_buying_by_type(liveMarket, { issue_fee: 0.01, reserve_asset: "base", arb_profit_tax: 0.9 }, "yes", 100_010_000);

    it("matches the pinned numbers", () => {
      expect(result.amount).toBe(108_315_313);
      expect(result.issue_fee).toBe(1_000_000);
      expect(result.arb_profit_tax).toBeCloseTo(1_967_424.71, 2);
      expect(result.fee).toBeCloseTo(2_967_424.71, 2);
      expect(result.reserve_needed).toBeCloseTo(97_032_575.29, 2);
      expect(result.new_reserve).toBe(1_100_000_000);
      expect(result.total_fee).toBeCloseTo(2_977_424.71, 2);
      expect(result.percentage_total_fee).toBe(2.98);
      expect(result.percentage_arb_profit_tax).toBe(1.97);
      expect(result.new_supply_yes).toBe(882_911_982);
      expect(result.new_supply_yes).toBe(liveMarket.supply_yes! + result.amount);
      expect(result.new_supply_no).toBe(liveMarket.supply_no);
      expect(result.new_yes_price).toBeCloseTo(0.82338, 5);
      expect(result.new_no_price).toBeCloseTo(0.58981, 5);
      expect(result.new_draw_price).toBe(0); // draws not allowed
      expect(result.next_coef).toBeCloseTo(1.0128323, 7);
      expect(result.reserve_amount).toBe(100_010_000);
    });
  });

  it("prices the draw leg only when draws are allowed", () => {
    const allowed = get_result_for_buying_by_type(liveMarketWithDraw, { issue_fee: 0.01, allow_draw: true }, "draw", 50_010_000);
    const forbidden = get_result_for_buying_by_type(liveMarketWithDraw, { issue_fee: 0.01, allow_draw: false }, "draw", 50_010_000);

    expect(allowed.amount).toBe(forbidden.amount);
    expect(allowed.new_draw_price).toBeGreaterThan(0);
    expect(forbidden.new_draw_price).toBe(0);
    expect(allowed.new_supply_draw).toBe(liveMarketWithDraw.supply_draw! + allowed.amount);
  });

  it("charges no network fee for a non-byte reserve asset", () => {
    const result = get_result_for_buying_by_type(liveMarket, { issue_fee: 0.01, reserve_asset: "SOME_ASSET" }, "no", 100_000_000);

    expect(result.network_fee).toBe(0);
    expect(result.new_reserve).toBe(1_100_000_000);
  });
});
