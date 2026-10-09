import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { kebabCase } from "lodash-es";

import { useAppSelector } from "@/shared/lib/redux";
import { selectLanguage } from "@/shared/i18n/model";
import { getLangPath, stripLangPath } from "@/shared/lib/lang-path";
import { generateTextEvent, getMarketAddressFromPath, selectActiveAddress, selectActiveMarketParams, selectActiveMarketStatus, selectActiveTeams } from "@/entities/market";

/**
 * Once the market is loaded, rewrites "/market/<anything>-<ADDRESS>" to the canonical SEO slug
 * built from the event text, so shared and typed links all end up on the same URL.
 */
export const useMarketSeoRedirect = () => {
  const lang = useAppSelector(selectLanguage);
  const activeMarketAddress = useAppSelector(selectActiveAddress);
  const params = useAppSelector(selectActiveMarketParams);
  const teams = useAppSelector(selectActiveTeams);
  const status = useAppSelector(selectActiveMarketStatus);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // wait for the market to load: the slug is built from its params and teams
    if (!lang || !activeMarketAddress || status !== "loaded") return;

    const addressInUrl = getMarketAddressFromPath(location.pathname);
    if (!addressInUrl || activeMarketAddress !== addressInUrl) return;

    const eventUTC = generateTextEvent({ ...params, yes_team_name: teams?.yes?.name, no_team_name: teams?.no?.name, isUTC: true });
    const seoText = kebabCase(eventUTC);
    const slugInUrl = decodeURIComponent(stripLangPath(location.pathname).replace("/market/", ""));
    const canonicalSlug = `${seoText}-${activeMarketAddress}`;

    if (slugInUrl !== canonicalSlug) {
      navigate(`${getLangPath(lang)}/market/${canonicalSlug}${location.search}`, { replace: true });
    }
  }, [activeMarketAddress, lang, status]);
};
