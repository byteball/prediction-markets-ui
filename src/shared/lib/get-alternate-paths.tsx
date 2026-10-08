import { langs } from "@/components/select-language/langs";

export type AlternatePath = { lang: string; href: string };

export const getAlternatePaths = (pathname: string): AlternatePath[] => {
    const origin = window.location.origin; // get current origin
    const langList = langs.map(({ name }) => name);
    
    const cleanUrlPath = pathname.split('/').filter((path) => !langList.includes(path)).join('/');

    // generate alternate paths for all languages
    const paths: AlternatePath[] = langList.map((lang) => ({ lang, href: lang === 'en' ? `${origin}${cleanUrlPath}` : `${origin}/${lang}${cleanUrlPath}` }));

    // generate alternate path for default language
    paths.push({ lang: 'x-default', href: `${origin}${cleanUrlPath}` });

    return paths;
}

export const getAlternateMetaList = (pathname: string) => {
    const alternatePaths = getAlternatePaths(pathname);

	return alternatePaths.map(({ lang, href }) => <link rel="alternate" key={lang} hrefLang={lang} href={href} data-rh="true" />);
}
