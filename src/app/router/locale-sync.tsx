import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import moment from "moment";

import i18n from "@/shared/i18n";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { changeLanguage, selectLanguage } from "@/shared/i18n/model";
import { DEFAULT_LANGUAGE, isLanguageCode, type LanguageCode } from "@/shared/config/langs";
import { getLangPath, getLanguageInPath, stripLangPath } from "@/shared/lib/lang-path";
import { botCheck } from "@/shared/lib/bot-check";

const MOMENT_LOCALES: Partial<Record<LanguageCode, string>> = { zh: "zh-cn", pt: "pt-br" };

const getMomentLocale = (language: string) => MOMENT_LOCALES[language as LanguageCode] ?? language;


/**
 * Keeps the interface language, i18next and the URL prefix in sync. Picks the language from the
 * URL or the browser on first visit (bots get the URL only, so crawled pages are not redirected),
 * then redirects to the prefixed path whenever the two disagree. Mounted once around every route;
 * it re-checks on each navigation, as the per-page provider it replaces did on every mount.
 */
export const LocaleSync = () => {
  const lang = useAppSelector(selectLanguage);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const languageInUrl = getLanguageInPath(location.pathname);
    const cleanedUrl = stripLangPath(location.pathname);
    const current = location.pathname + location.search;
    // Replace the URL only when it actually changes; the effect re-runs on every navigation.
    const redirect = (to: string) => to !== current && navigate(to, { replace: true });

    if (!lang) {
      const languageFromBrowser = navigator.language.split("-")[0];
      const language = botCheck() ? languageInUrl : languageInUrl || languageFromBrowser;

      if (language && isLanguageCode(language)) {
        dispatch(changeLanguage(language));
        moment.locale(getMomentLocale(language));

        if (language !== languageInUrl) {
          redirect(`${getLangPath(language)}${cleanedUrl === "/" && language !== DEFAULT_LANGUAGE ? "" : cleanedUrl}${location.search}`);
        }
      } else {
        i18n.changeLanguage(DEFAULT_LANGUAGE);
        redirect(cleanedUrl + location.search);
        moment.locale(getMomentLocale(DEFAULT_LANGUAGE));
      }
    } else {
      i18n.changeLanguage(lang);

      if (lang !== languageInUrl && lang !== DEFAULT_LANGUAGE) {
        redirect(`${getLangPath(lang)}${cleanedUrl === "/" ? "" : cleanedUrl}${location.search}`);
      } else if (lang === DEFAULT_LANGUAGE || languageInUrl === DEFAULT_LANGUAGE) {
        redirect((cleanedUrl || "/") + location.search);
      }

      moment.locale(getMomentLocale(lang));
    }
  }, [lang, location.pathname]);

  return <Outlet />;
};
