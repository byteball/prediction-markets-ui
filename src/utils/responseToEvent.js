export const responseToEvent = (responseObj, params, state) => {
  const responseVars = responseObj?.response?.responseVars || {};
  const { reserve_symbol, yes_symbol, no_symbol, draw_symbol, yes_decimals = 0, no_decimals = 0, draw_decimals = 0, reserve_decimals } = params;
  const author = responseObj.trigger_address.slice(0, 16);
  const trigger_unit = responseObj.trigger_unit;
  const timestamp = responseObj.timestamp;

  const yes_amount = responseVars.yes_amount / 10 ** yes_decimals || 0;
  const no_amount = responseVars.no_amount / 10 ** no_decimals || 0;
  const draw_amount = responseVars.draw_amount / 10 ** draw_decimals || 0;

  let event = "Undefined";
  
  if ("yes_asset" in responseVars || "no_asset" in responseVars || "draw_asset" in responseVars) {
    event = 'Configuration';
  } else if ('yes_amount' in responseVars && 'no_amount' in responseVars && 'draw_amount' in responseVars) {
    const action = yes_amount >= 0 && no_amount >= 0 && draw_amount >= 0 ? 'buy' : 'redeem';
    event = `${author}... ${action}${yes_amount !== 0 ? ` ${Math.abs(yes_amount)} ${yes_symbol}` : ''}${no_amount !== 0 ? ` ${Math.abs(no_amount)} ${no_symbol}` : ''}${draw_amount !== 0 ? ` ${Math.abs(draw_amount)} ${draw_symbol}` : ''}`;
  } else if ('result' in responseVars) {
    event = `Result has been set: ${responseVars.result}`;
  } else if (state.result && 'profit' in responseVars){
    event = `${author}... profited ${responseVars['profit'] / 10 ** reserve_decimals} ${reserve_symbol}`;
  }  

  return {
    event,
    timestamp,
    trigger_unit
  } 
}