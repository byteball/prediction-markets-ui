export const getMarketPriceByType = ({ coef = 1, supply_yes = 0, supply_no = 0, supply_draw = 0 }, type) => { // allStateVars in props
  if ((supply_yes + supply_no + supply_draw) === 0) return 0;
  
  const token_amount_by_type = type === 'yes' ? supply_yes : type === 'no' ? supply_no : supply_draw;
  return coef * (token_amount_by_type / Math.sqrt(supply_yes ** 2 + supply_no ** 2 + supply_draw ** 2));
}