export const get_reserve = (state, yes_amount, no_amount, draw_amount) => {
  const { coef = 1 } = state;

  return Math.ceil(coef * Math.sqrt(yes_amount ** 2 + no_amount ** 2 + draw_amount ** 2));
};

export const getExchangeResult = (state, params, yes_amount = 0, no_amount = 0, draw_amount = 0) => {
  const { supply_yes = 0, reserve = 0, supply_no = 0, supply_draw = 0, coef = 1 } = state;
  const { issue_fee, redeem_fee, arb_profit_tax, allow_draw = false, reserve_asset = 'base' } = params;

  if (yes_amount === 0 && no_amount === 0 && draw_amount === 0) return null;
  
  const new_supply_yes = supply_yes + (yes_amount ? yes_amount : 0);
  const new_supply_no = supply_no + (no_amount ? no_amount : 0);
  const new_supply_draw = supply_draw + (draw_amount ? draw_amount : 0);

  const new_reserve = get_reserve(state, new_supply_yes, new_supply_no, new_supply_draw);

  const reserve_delta = new_reserve - reserve;

  const reserve_needed = reserve_delta > 0 ? reserve_delta : 0;
  const payout = reserve_delta < 0 ? Math.abs(reserve_delta) : 0;

  let yes_arb_profit_tax = 0;
  let no_arb_profit_tax = 0;
  let draw_arb_profit_tax = 0;

  let old_yes_price = 0;
  let old_no_price = 0;
  let old_draw_price = 0;

  let new_yes_price = 0;
  let new_no_price = 0;
  let new_draw_price = 0;

  if ((supply_yes + supply_no + supply_draw) !== 0) {
    const old_den = Math.sqrt(supply_yes ** 2 + supply_no ** 2 + supply_draw ** 2);

    old_yes_price = coef * (supply_yes / old_den);
    old_no_price = coef * (supply_no / old_den);
    old_draw_price = coef * (supply_draw / old_den);

    const new_den = Math.sqrt(new_supply_yes ** 2 + new_supply_no ** 2 + new_supply_draw ** 2);

    new_yes_price = coef * (new_supply_yes / new_den);
    new_no_price = coef * (new_supply_no / new_den);
    new_draw_price = coef * (new_supply_draw / new_den);

    yes_arb_profit_tax = (Math.abs((old_yes_price - new_yes_price) * yes_amount) / 2) * arb_profit_tax;
    no_arb_profit_tax = (Math.abs((old_no_price - new_no_price) * no_amount) / 2) * arb_profit_tax;
    draw_arb_profit_tax = allow_draw ? (Math.abs((old_draw_price - new_draw_price) * draw_amount) / 2) * arb_profit_tax : 0;
  }

  const total_arb_profit_tax = yes_arb_profit_tax + no_arb_profit_tax + draw_arb_profit_tax;

  const network_fee = (reserve_asset === 'base' ? 10000 : 0);
  const fee = Math.ceil(reserve_needed * issue_fee + payout * redeem_fee + total_arb_profit_tax);

  const next_coef = coef * ((new_reserve + fee) / new_reserve);

  return {
    reserve_needed: reserve_needed,
    new_reserve: new_reserve + fee,
    payout: payout,
    fee: fee,
    arb_profit_tax: total_arb_profit_tax,
    next_coef: next_coef,
    network_fee: network_fee,
    issue_fee: reserve_needed * issue_fee,
    redeem_fee: payout * redeem_fee,
    new_yes_price,
    new_no_price,
    new_draw_price,
    old_yes_price,
    old_no_price,
    old_draw_price
  }
}

export const get_token_amount = (state, params, type, reserve_amount) => {
  const { supply_yes = 0, reserve = 0, supply_no = 0, supply_draw = 0, coef = 1 } = state;
  const { issue_fee, arb_profit_tax, reserve_asset } = params;

  const network_fee = (reserve_asset === 'base' ? 10000 : 0);

  const fee = Math.ceil(reserve_amount - network_fee - ((reserve_amount - network_fee) / (1 + issue_fee)));

  const new_reserve = reserve + reserve_amount - fee - network_fee;

  const ratio = new_reserve ** 2 / coef ** 2;

  const supply_yes_squared = supply_yes ** 2;
  const supply_no_squared = supply_no ** 2;
  const supply_draw_squared = supply_draw ** 2;

  let prepare_calc;

  if (type === 'yes') {
    prepare_calc = ratio - supply_no_squared - supply_draw_squared;
  } else if (type === 'no') {
    prepare_calc = ratio - supply_yes_squared - supply_draw_squared;
  } else {
    prepare_calc = ratio - supply_yes_squared - supply_no_squared;
  }

  const supply = type === 'yes' ? supply_yes : type === 'no' ? supply_no : supply_draw;
  const amount = Math.floor(Math.sqrt(prepare_calc) - supply);

  if ((supply_yes + supply_no + supply_draw) !== 0) {
    const old_den = Math.sqrt(supply_yes_squared + supply_no_squared + supply_draw_squared);
    const old_price = coef * (supply / old_den);
    const new_supply = supply + amount;
    const new_supply_squared = new_supply ** 2;

    const new_den = Math.sqrt((type === 'yes' ? new_supply_squared : supply_yes_squared) + (type === 'no' ? new_supply_squared : supply_no_squared) + (type === 'draw' ? new_supply_squared : supply_draw_squared));
    const new_price = coef * (new_supply / new_den);
    const arb_profit_tax_amount = ((Math.abs(old_price - new_price) * amount) / 2) * arb_profit_tax;

    const fee_with_arb_profit_tax = Math.ceil(reserve_amount - network_fee - ((reserve_amount - network_fee) / (1 + issue_fee))) + arb_profit_tax_amount;

    const reserve_without_tax_and_fee = reserve + reserve_amount - fee_with_arb_profit_tax - network_fee;
    const new_ratio = reserve_without_tax_and_fee ** 2 / coef ** 2;

    let prepare_calc_2;

    if (type === 'yes') {
      prepare_calc_2 = new_ratio - supply_no_squared - supply_draw_squared;
    } else if (type === 'no') {
      prepare_calc_2 = new_ratio - supply_yes_squared - supply_draw_squared;
    } else {
      prepare_calc_2 = new_ratio - supply_yes_squared - supply_no_squared;
    }

    return Math.floor(Math.sqrt(prepare_calc_2) - supply);

  } else {
    return amount;
  }

};