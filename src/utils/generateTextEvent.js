import moment from "moment";

import appConfig from "appConfig";
import i18n from "locale";

export const generateTextEvent = ({ oracle, event_date, feed_name, datafeed_value, comparison, isUTC = false, yes_team_name, no_team_name }) => { // params    
    const format = ["ru", "uk"].includes(i18n.language) ? "D MMMM gggg [в] LT" : "LLL";
    const expiry_date = isUTC ? moment.unix(event_date).utc().format(format) : moment.unix(event_date).format(format);
    const comparisonText = getComparisonText(comparison);

    if (appConfig.CATEGORIES.currency.oracles.find(({ address }) => address === oracle)) {
        const [from, to] = feed_name.split("_");

        return i18n.t('event.currency_text', "Will {{from_currency}} be {{comparisonText}} {{value}} {{to_currency}} on {{expiry_date}}{{UTC}}?", { from_currency: from, comparisonText, value: datafeed_value, to_currency: to, expiry_date, UTC: isUTC ? ' UTC' : '' });
    } else if (appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === oracle)) {
        // eslint-disable-next-line no-unused-vars
        const [_, yes_team, no_team] = feed_name.split("_");

        return i18n.t('event.sport_text', "{{yes_team}} vs {{no_team}} on {{expiry_date}}{{UTC}}", { yes_team: yes_team_name || yes_team, no_team: no_team_name || no_team, expiry_date, UTC: isUTC ? ' UTC' : '' });
    } else {
        return i18n.t('event.other_text', `Will {{feed_name}} be {{comparisonText}} {{value}} on {{expiry_date}}{{UTC}}?`, { feed_name, comparisonText, value: datafeed_value, expiry_date, UTC: isUTC ? ' UTC' : '' });
    }
}

const getComparisonText = (comparison) => {
    if (comparison === '>') return i18n.t('event.comparisons.above', 'above');
    if (comparison === '<') return i18n.t('event.comparisons.below', 'below');
    if (comparison === '>=') return i18n.t('event.comparisons.above_or_equal', 'above or equal');
    if (comparison === '<=') return i18n.t('event.comparisons.below_or_equal', 'below or equal');
    if (comparison === '==') return i18n.t('event.comparisons.equal', 'equal');
    if (comparison === '!=') return i18n.t('event.comparisons.not_equal', 'not equal');
}