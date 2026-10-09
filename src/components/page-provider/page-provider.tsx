import { useLocation, useNavigate } from "react-router-dom";
import { Fragment, memo, useEffect } from "react";
import moment from "moment";
import { kebabCase } from "lodash-es";

import { changeLanguage, selectLanguage } from "store/slices/settings-slice";
import { useAppDispatch, useAppSelector } from "store/hooks";

import { botCheck, generateTextEvent } from "utils";

import { langs } from "components/select-language/langs";

import i18 from "../../locale/index";

const DEFAULT_LANGUAGE_KEY = "en";

type TextEventParams = Parameters<typeof generateTextEvent>[0];

export const PageProvider = memo(() => {
  const lang = useAppSelector(selectLanguage);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { address: activeMarketAddress, params, teams } = useAppSelector((state) => state.active);

  useEffect(() => {
    const pathname = location.pathname;
    const langList = langs.map((lang) => lang.name);
    const languageInUrl = langList.includes(pathname.split("/")[1]) ? pathname.split("/")[1] : null;
    const cleanedUrl = cleanUrl(location.pathname, languageInUrl);

    if (!lang) {
      const languageFromBrowserSettings = navigator.language.split("-")[0];

      const language = botCheck() ? languageInUrl : languageInUrl || languageFromBrowserSettings;

      if (language && langList.find((lang) => lang === language)) {
        dispatch(changeLanguage(language));
        moment.locale(getMomentLocaleByLanguageKey(language));

        if (language !== languageInUrl) {
          navigate(`${language !== "en" ? "/" + language : ""}${cleanedUrl === "/" && language !== "en" ? "" : cleanedUrl}${location.search}`, { replace: true });
        }
      } else {
        i18.changeLanguage(DEFAULT_LANGUAGE_KEY);
        navigate(cleanedUrl + location.search, { replace: true });
        moment.locale(getMomentLocaleByLanguageKey(DEFAULT_LANGUAGE_KEY));
      }
    } else {
      i18.changeLanguage(lang);

      if (lang !== languageInUrl && lang !== "en") {
        navigate(`${lang !== "en" ? "/" + lang : ""}${cleanedUrl === "/" ? "" : cleanedUrl}${location.search}`, { replace: true });
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

    if (cleanedUrl.startsWith("/market/") && lang) {
      if (activeMarketAddress) {
        const addressInUrl = getWalletAddressFromUrl(cleanedUrl);

        if (addressInUrl && activeMarketAddress === addressInUrl) {
          const eventUTC = generateTextEvent({ ...params, yes_team_name: teams?.yes?.name, no_team_name: teams?.no?.name, isUTC: true } as TextEventParams);
          const seoText = kebabCase(eventUTC);
          const seoTextWithAddressFromUrl = decodeURIComponent(cleanedUrl.replace("/market/", ""));
          const newSeoTextWithAddress = `${seoText}-${activeMarketAddress}`;

          if (seoTextWithAddressFromUrl !== newSeoTextWithAddress) {
            navigate(`${lang !== "en" ? "/" + lang : ""}/market/${newSeoTextWithAddress}${location.search}`, { replace: true });
          }
        }
      }
    }
  }, [activeMarketAddress, lang]);

  return <Fragment />;
});

PageProvider.displayName = "PageProvider";

const getMomentLocaleByLanguageKey = (languageKey: string) => {
  if (languageKey === "zh") return "zh-cn";
  if (languageKey === "pt") return "pt-br";

  return languageKey;
};

const cleanUrl = (url: string, languageInUrl: string | null) => {
  let cleanedUrl = url;

  if (languageInUrl) {
    cleanedUrl = cleanedUrl.replace("/" + languageInUrl, "");
  }

  return cleanedUrl;
};

const getWalletAddressFromUrl = (url = "") => {
  let address: string | undefined;

  const regex = /(\w{32})$/;
  const match = url.match(regex);

  if (match) {
    address = match[0];
  }

  return address;
};
