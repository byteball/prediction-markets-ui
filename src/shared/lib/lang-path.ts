import { DEFAULT_LANGUAGE, isLanguageCode, type LanguageCode } from "@/shared/config/langs";

/** URL prefix of an interface language: "" for the default language, "/ru" otherwise. */
export const getLangPath = (lang?: string | null): string => (!lang || lang === DEFAULT_LANGUAGE ? "" : `/${lang}`);

/** The language segment of a pathname ("/ru/market/..." -> "ru"), or null when there is none. */
export const getLanguageInPath = (pathname: string): LanguageCode | null => {
  const segment = pathname.split("/")[1];

  return isLanguageCode(segment) ? segment : null;
};

/** The pathname without its language prefix ("/ru/market/x" -> "/market/x"). */
export const stripLangPath = (pathname: string): string => {
  const language = getLanguageInPath(pathname);

  return language ? pathname.slice(language.length + 1) : pathname;
};
