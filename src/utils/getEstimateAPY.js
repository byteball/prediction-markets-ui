import moment from "moment";

import appConfig from "appConfig";

export const getEstimateAPY = ({ params, coef }) => { // params + coef
    const elapsed_seconds = (params.committed_at || moment.utc().unix()) - params.created_at;

    if (appConfig.BASE_AAS.findIndex((address) => address === params.base_aa) === 0) { // needsIssueFeeForLiquidity
        return coef !== 1 ? +Number(((coef * (1 - params.issue_fee)) ** (31536000 / elapsed_seconds) - 1) * 100).toFixed(2) : 0;
    } else {
        return coef !== 1 ? +Number((coef ** (31536000 / elapsed_seconds) - 1) * 100).toFixed(2) : 0;
    }
}