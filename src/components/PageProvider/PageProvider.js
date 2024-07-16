import { useLocation, useNavigate } from "react-router-dom"
import { Fragment, memo, useEffect } from "react";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { kebabCase } from "lodash";

import { changeLanguage, selectLanguage } from "store/slices/settingsSlice";

import { botCheck, generateTextEvent } from "utils";

import { langs } from "components/SelectLanguage/SelectLanguage";

import i18 from '../../locale/index';

const DEFAULT_LANGUAGE_KEY = 'en';

export const PageProvider = memo(() => {
    const lang = useSelector(selectLanguage);
    const dispatch = useDispatch()
    const navigate = useNavigate();
    const location = useLocation();

    const { address: activeMarketAddress, params = {}, teams = {} } = useSelector((state) => state.active || {});

    useEffect(() => {
        const pathname = location.pathname;
        const langList = langs.map((lang) => lang.name);
        const languageInUrl = langList.includes(pathname.split("/")[1]) ? pathname.split("/")[1] : null;
        const cleanedUrl = cleanUrl(location.pathname, languageInUrl);

        if (!lang) {
            const languageFromBrowserSettings = navigator.language.split("-")[0];

            const language = botCheck() ? languageInUrl : (languageInUrl || languageFromBrowserSettings);

            if (language && langList.find((lang) => lang === language)) { // if language is in the list
                dispatch(changeLanguage(language));
                moment.locale(getMomentLocaleByLanguageKey(language));

                if (language !== languageInUrl) {
                    navigate(`${language !== "en" ? '/' + language : ""}${cleanedUrl === "/" && language !== "en" ? "" : cleanedUrl}${location.search}`, { replace: true });
                }

            } else { // if language is not in the list we use default language
                i18.changeLanguage(DEFAULT_LANGUAGE_KEY);
                navigate(cleanedUrl + location.search, { replace: true });
                moment.locale(getMomentLocaleByLanguageKey(DEFAULT_LANGUAGE_KEY));
            }

        } else { // if language is already set
            i18.changeLanguage(lang);

            if (lang !== languageInUrl && lang !== "en") {
                navigate(`${lang !== "en" ? '/' + lang : ""}${cleanedUrl === "/" ? "" : cleanedUrl}${location.search}`, { replace: true });

            } else if (lang === "en" || languageInUrl === "en") {
                navigate((cleanedUrl || "/") + location.search, { replace: true });
            }

            moment.locale(getMomentLocaleByLanguageKey(lang));
        }

    }, [lang]);

    useEffect(() => {
        const pathname = window.location.pathname;
        const langList = langs.map((lang) => lang.name);
        const languageInUrl = langList.includes(pathname.split("/")[1]) ? pathname.split("/")[1] : null;
        const cleanedUrl = cleanUrl(pathname, languageInUrl);

        if (cleanedUrl.startsWith('/market/') && lang) {
            if (activeMarketAddress) {
                const addressInUrl = getWalletAddressFromUrl(cleanedUrl);
                
                if (addressInUrl && activeMarketAddress === addressInUrl) {
                    const eventUTC = generateTextEvent({ ...params, yes_team_name: teams?.yes?.name, no_team_name: teams?.no?.name, isUTC: true });
                    const seoText = kebabCase(eventUTC);
                    const seoTextWithAddressFromUrl = decodeURIComponent(cleanedUrl.replace('/market/', ""));
                    const newSeoTextWithAddress = `${seoText}-${activeMarketAddress}`;

                    if (seoTextWithAddressFromUrl !== newSeoTextWithAddress) {
                        navigate(`${lang !== "en" ? '/' + lang : ""}/market/${newSeoTextWithAddress}${location.search}`, { replace: true });
                    }
                }

            }
        }
    }, [activeMarketAddress, lang]);

    return Fragment;
})

const getMomentLocaleByLanguageKey = (languageKey) => {
    if (languageKey === 'zh') return 'zh-cn';
    if (languageKey === 'pt') return 'pt-br';

    return languageKey;
}

const cleanUrl = (url, languageInUrl) => {
    let cleanedUrl = url;

    if (languageInUrl) {
        cleanedUrl = cleanedUrl.replace('/' + languageInUrl, "");
    }

    return cleanedUrl;
}

const getWalletAddressFromUrl = (url = "") => {
    let address;

    const regex = /(\w{32})$/;
    const match = url.match(regex);

    if (match) {
        address = match[0];
    }

    return address;
}