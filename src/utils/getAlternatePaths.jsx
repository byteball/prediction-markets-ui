import { langs } from "components/SelectLanguage/SelectLanguage";

export const getAlternatePaths = (pathname) => {
    const origin = window.location.origin; // get current origin
    const langList = langs.map(({ name }) => name);
    
    const cleanUrlPath = pathname.split('/').filter((path) => !langList.includes(path)).join('/');

    // generate alternate paths for all languages
    const paths = langList.map((lang) => ({ lang, href: lang === 'en' ? `${origin}${cleanUrlPath}` : `${origin}/${lang}${cleanUrlPath}` }));

    // generate alternate path for default language
    paths.push({ lang: 'x-default', href: `${origin}${cleanUrlPath}` });

    return paths;
}

export const getAlternateMetaList = (pathname) => {
    const alternatePaths = getAlternatePaths(pathname);

	return alternatePaths.map(({ lang, href }) => <link rel="alternate" key={lang} hreflang={lang} href={href} data-rh="true" />);
}
