export type MarketPriceStateVars = {
  coef?: number;
  supply_yes?: number;
  supply_no?: number;
  supply_draw?: number;
};

export type TokenType = 'yes' | 'no' | 'draw';

export const getMarketPriceByType = ({ coef = 1, supply_yes = 0, supply_no = 0, supply_draw = 0 }: MarketPriceStateVars, type: TokenType | string): number => {
  if ((supply_yes + supply_no + supply_draw) === 0) return 0;
  
  const token_amount_by_type = type === 'yes' ? supply_yes : type === 'no' ? supply_no : supply_draw;
  return coef * (token_amount_by_type / Math.sqrt(supply_yes ** 2 + supply_no ** 2 + supply_draw ** 2));
}
