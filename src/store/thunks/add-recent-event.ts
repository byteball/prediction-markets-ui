import { createAsyncThunk } from "@reduxjs/toolkit";

import client from "services/obyte";
import type { AppThunkApiConfig } from "store/hooks";
import type { AAResponseBody, AAResponseVars, ObyteUnit, OutcomeAmounts, RecentEvent, RecentEventType } from "store/types";

export const addRecentEvent = createAsyncThunk<RecentEvent | undefined, AAResponseBody, AppThunkApiConfig>(
    'addRecentEvent',
    async ({ aa_address, bounced, response, timestamp, response_unit, trigger_address, trigger_unit, objResponseUnit }, { getState }) => {
        const state = getState();
        const responseVars: AAResponseVars = { ...response.responseVars };

        // v1 agents report everything in separate response vars, v2 agents describe the operation in the `event` response var (JSON); map it to the v1 keys.
        if (typeof responseVars.event === 'string') {
            try {
                const { supplies, amount, reserve } = JSON.parse(responseVars.event) as { supplies?: OutcomeAmounts; amount?: number; reserve?: number };

                if (supplies) Object.assign(responseVars, { supply_yes: supplies.yes, supply_no: supplies.no, supply_draw: supplies.draw });
                if (amount !== undefined) responseVars.claimed_amount = amount; // claim_profit only
                if (reserve !== undefined) responseVars.next_reserve = reserve;
            } catch { /* not JSON, keep the vars as they are */ }
        }

        const { joint } = await client.api.getJoint(trigger_unit) as { joint?: { unit?: ObyteUnit } };
        const msg = joint?.unit?.messages.find(m => m.app === 'data');
        const payload = msg ? msg.payload : {};
        const isAddLiquidity = !('arb_profit_tax' in responseVars);
        let type: RecentEventType | undefined;

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
            } as RecentEvent;

            let reserve_amount = 0;

            if (('next_coef' in responseVars) && ('arb_profit_tax' in responseVars || isAddLiquidity)) {
                const existsAmountInPayload = Number(payload.yes_amount) > 0 || Number(payload.no_amount) > 0 || Number(payload.draw_amount) > 0; // negative amounts = redeem in tokenless markets

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
                } else if (objResponseUnit) { // redeem, no response unit if nothing was paid
                    const messages = objResponseUnit.messages;

                    if (messages.length === 1) {
                        const output = messages[0].payload.outputs?.find(({ address }) => address !== aa_address);
                        if (output) reserve_amount = output.amount;
                    }
                }

                type = isAddLiquidity ? 'add_liquidity' : ('type' in payload) ? 'buy_by_type' : (existsAmountInPayload ? 'buy' : 'redeem');

                eventObject = {
                    ...eventObject,
                    coef: typeof responseVars.next_coef === 'number' ? responseVars.next_coef : eventObject.coef,
                    reserve: typeof responseVars.next_reserve === 'number' ? responseVars.next_reserve : eventObject.reserve,
                };
            } else if (responseVars.profit) {
                const stateVars = state.active?.stateVars || {};
                const { yes_asset, no_asset, draw_asset } = stateVars;
                const winner = stateVars.result;

                if (winner) {
                    const profit = responseVars.profit;
                    let amount: number | undefined;

                    if (typeof responseVars.claimed_amount === 'number') { // v2 reports the claimed amount, v1 receives it in the winning tokens
                        amount = responseVars.claimed_amount;
                    } else {
                        const winnerAsset = winner === 'yes' ? yes_asset : (winner === 'no' ? no_asset : draw_asset);
                        const payoutMsg = winnerAsset ? joint.unit?.messages.find(({ app, payload }) => app === 'payment' && payload.asset === winnerAsset) : undefined;
                        amount = payoutMsg?.payload.outputs?.find(({ address }) => address === aa_address)?.amount;
                    }

                    const winnerSupply = stateVars[`supply_${winner}`];

                    if (amount !== undefined && typeof winnerSupply === 'number' && typeof stateVars.reserve === 'number') {
                        const new_reserve = stateVars.reserve - profit;
                        const new_winner_supply = winnerSupply - amount;
                        const winnerPrice = new_winner_supply > 0 ? new_reserve / new_winner_supply : 0;

                        type = 'claim_profit';
                        reserve_amount = new_winner_supply > 0 ? Math.floor(amount / new_winner_supply * new_reserve) : profit;

                        eventObject = {
                            ...eventObject,
                            yes_amount: 0,
                            no_amount: 0,
                            draw_amount: 0,
                            ...{ [`${winner}_amount`]: amount },
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
            }

            eventObject.type = type as RecentEventType;
            eventObject.reserve_amount = reserve_amount;

            if (type) {
                return eventObject;
            }
        }

    }
)
