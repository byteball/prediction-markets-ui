import { createAsyncThunk } from "@reduxjs/toolkit";

import client from "services/obyte";

export const addRecentEvent = createAsyncThunk(
    'addRecentEvent',
    async ({ aa_address, bounced, response, timestamp, response_unit, trigger_address, trigger_unit, objResponseUnit }, { dispatch, getState }) => {
        const state = getState();
        const responseVars = response.responseVars || {};
        const { joint } = await client.api.getJoint(trigger_unit);
        const msg = joint?.unit?.messages.find(m => m.app === 'data');
        const payload = msg ? msg.payload : {};
        const isAddLiquidity = !('arb_profit_tax' in responseVars);
        let type;

        if (!bounced && state.active.address === aa_address && joint) {
            const params = state.active?.params || {};
            const { reserve_asset } = params;
            
            let eventObject = {
                aa_address,
                trigger_unit,
                ...responseVars,
                timestamp,
                response_unit,
                trigger_address
            }

            let reserve_amount = 0;

            if (responseVars && ('next_coef' in responseVars) && ('arb_profit_tax' in responseVars || isAddLiquidity)) {
                const existsAmountInPayload = 'yes_amount' in payload || 'no_amount' in payload || 'draw_amount' in payload;


                if (existsAmountInPayload || isAddLiquidity || ('type' in payload)) {
                    if (joint.unit && joint.unit.messages) {
                        const msg = joint?.unit?.messages?.find(({ app, payload }) => app === 'payment' && (reserve_asset === 'base' ? !('asset' in payload) : payload.asset === reserve_asset));

                        if (msg) {
                            const outputs = msg.payload.outputs;
                            if (outputs) {
                                const output = outputs.find(({ address }) => address === aa_address);
                                if (output && output.amount !== 1e4) {
                                    reserve_amount = output.amount;
                                }
                            }
                        }
                    }
                } else { // redeem
                    const messages = objResponseUnit.messages;

                    if (messages.length === 1) {
                        const outputs = messages[0].payload.outputs;
                        const output = outputs.find(({ address }) => address !== aa_address);
                        reserve_amount = output.amount;
                    }
                }

                type = isAddLiquidity ? 'add_liquidity' : ('type' in payload) ? 'buy_by_type' : (existsAmountInPayload ? 'buy' : 'redeem');
            } else if (responseVars.profit) {
                const stateVars = state.active?.stateVars || {};
                const { yes_asset, no_asset, draw_asset } = stateVars;

                if ('result' in stateVars) {
                    const winner = stateVars.result;
                    const winnerAsset = winner === 'yes' ? yes_asset : (winner === 'no' ? no_asset : draw_asset);
                    const profit = responseVars.profit;
                    const payoutMsg = joint.unit.messages.find(({ app, payload }) => app === 'payment' && payload.asset === winnerAsset);
                    const output = payoutMsg.payload.outputs.find(({ address }) => address === aa_address);
                    const new_reserve = stateVars.reserve - profit;
                    const new_winner_supply = stateVars[`supply_${winner}`] - output.amount;
                    const winnerPrice = new_reserve / new_winner_supply;

                    type = 'claim_profit';
                    reserve_amount = Math.floor(output.amount / new_winner_supply * new_reserve);

                    eventObject = {
                        ...eventObject,
                        yes_amount: 0,
                        no_amount: 0,
                        draw_amount: 0,
                        ...{ [`${winner}_amount`]: output.amount },
                        reserve: new_reserve,
                        coef: stateVars.coef || 1,
                        supply_yes: stateVars.supply_yes,
                        supply_no: stateVars.supply_no,
                        supply_draw: stateVars.supply_draw,
                        yes_price: 0,
                        no_price: 0,
                        draw_price: 0,
                        ...{
                            [`supply_${winner}`]: new_winner_supply, [`${winner}_price`]: winnerPrice
                        }
                    }

                }

            }

            eventObject.type = type;
            eventObject.reserve_amount = reserve_amount;

            if (type) {
                return eventObject;
            }
        }

    }
)