import moment from "moment";

import appConfig from "appConfig";

const SECONDS_IN_YEAR = 60 * 60 * 24 * 365;

export const getEstimatedAPY = ({ params, coef }) => { // params + coef
    const elapsed_seconds = (params.committed_at || moment.utc().unix()) - (params.first_trade_ts || params.created_at);

    if (appConfig.BASE_AAS.findIndex((address) => address === params.base_aa) === 0) { // needsIssueFeeForLiquidity
        return coef !== 1 ? +Number(((coef * (1 - params.issue_fee)) ** (SECONDS_IN_YEAR / elapsed_seconds) - 1) * 100).toFixed(2) : 0;
    } else {
        return coef !== 1 ? +Number((coef ** (SECONDS_IN_YEAR / elapsed_seconds) - 1) * 100).toFixed(2) : 0;
    }
}