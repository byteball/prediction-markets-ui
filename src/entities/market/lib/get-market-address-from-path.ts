/** The market AA address at the end of a market URL ("/market/<seo-slug>-<ADDRESS>"), if any. */
export const getMarketAddressFromPath = (pathname: string = ""): string | undefined => pathname.match(/(\w{32})$/)?.[0];
