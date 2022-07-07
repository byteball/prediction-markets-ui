import moment from "moment";

import appConfig from "appConfig";

export const generateTextEvent = ({ oracle, end_of_trading_period, feed_name, datafeed_value, comparison }) => { // params
    const expiry_date = moment.unix(end_of_trading_period).format("LLL");
    const comparisonText = getComparisonText(comparison);

    if (appConfig.CATEGORIES.currency.oracles.find(({ address }) => address === oracle)) {
        const [from, to] = feed_name.split("_");

        return `Will ${from} be ${comparisonText} ${datafeed_value} ${to} on ${expiry_date}?`;
    } else if (appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === oracle)) {
        // eslint-disable-next-line no-unused-vars
        const [_, yes_team, no_team] = feed_name.split("_");

        return `${yes_team} vs ${no_team} for ${expiry_date}`;
    } else {
        return `Will ${feed_name} be ${comparisonText} ${datafeed_value} on ${expiry_date}?`;
    }
}

const getComparisonText = (comparison) => {
    if (comparison === '>') return 'above';
    if (comparison === '<') return 'below';
    if (comparison === '>=') return 'above or equal';
    if (comparison === '<=') return 'below or equal';
    if (comparison === '==') return 'equal';
    if (comparison === '!=') return 'not equal';
}