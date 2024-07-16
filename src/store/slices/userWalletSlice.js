import { createSelector, createSlice } from '@reduxjs/toolkit';
import { loadUserBalance } from 'store/thunks/loadUserBalance';
import { selectWalletAddress } from './settingsSlice';

export const userWalletSlice = createSlice({
    name: 'userWallet',
    initialState: {},
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(loadUserBalance.fulfilled, (state, action) => {
            const { address, balance } = action.payload;

            state[address] = balance;
        });
    }
});

export default userWalletSlice.reducer;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.auth.value)`

const selectWalletsBalance = state => state.userWallet;


export const selectWalletBalance = createSelector(
    selectWalletAddress,
    selectWalletsBalance,
    (address, balances) => balances[address]);