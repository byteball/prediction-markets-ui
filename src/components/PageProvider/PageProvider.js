import { useNavigate } from "react-router-dom"
import { Fragment, memo, useEffect } from "react";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";

import { changeLanguage, selectLanguage } from "store/slices/settingsSlice";

import { botCheck } from "utils";

import { langs } from "components/SelectLanguage/SelectLanguage";

import i18 from '../../locale/index';

const DEFAULT_LANGUAGE_KEY = 'en';

export const PageProvider = memo(() => {
    const lang = useSelector(selectLanguage);
    const dispatch = useDispatch()
    const navigate = useNavigate();

    useEffect(() => {
        const pathname = window.location.pathname;
        const langList = langs.map((lang) => lang.name);
        const languageInUrl = langList.includes(pathname.split("/")[1]) ? pathname.split("/")[1] : null;
        let cleanedUrl = pathname;

        if (languageInUrl) {
            cleanedUrl = pathname.replace('/' + languageInUrl, "");
        }

        if (!lang) {
            const languageFromBrowserSettings = navigator.language.split("-")[0];

            const language = botCheck() ? languageInUrl : (languageInUrl || languageFromBrowserSettings);

            if (language && langList.find((lang) => lang === language)) { // if language is in the list
                dispatch(changeLanguage(language));
                moment.locale(getMomentLocaleByLanguageKey(language));

                if (language !== languageInUrl) {
                    // historyInstance.replace(`${language !== "en" ? '/' + language : ""}${cleanedUrl === "/" && language !== "en" ? "" : cleanedUrl}`);
                    navigate(`${language !== "en" ? '/' + language : ""}${cleanedUrl === "/" && language !== "en" ? "" : cleanedUrl}`, { replace: true });
                }

            } else { // if language is not in the list we use default language
                i18.changeLanguage(DEFAULT_LANGUAGE_KEY);
                // historyInstance.replace(cleanedUrl);
                navigate(cleanedUrl, { replace: true });
                moment.locale(getMomentLocaleByLanguageKey(DEFAULT_LANGUAGE_KEY));
            }

        } else { // if language is already set
            i18.changeLanguage(lang);

            if (lang !== languageInUrl && lang !== "en") {
                navigate(`${lang !== "en" ? '/' + lang : ""}${cleanedUrl === "/" ? "" : cleanedUrl}`, { replace: true });

            } else if (lang === "en" || languageInUrl === "en") {
                navigate(cleanedUrl || "/", { replace: true });
            }

            moment.locale(getMomentLocaleByLanguageKey(lang));
        }

    }, [lang]);

    return Fragment;
})

const getMomentLocaleByLanguageKey = (languageKey) => {
    if (languageKey === 'zh') return 'zh-cn';
    if (languageKey === 'pt') return 'pt-br';

    return languageKey;
}
