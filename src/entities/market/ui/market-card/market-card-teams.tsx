import moment from "moment";
import { Img } from "react-image";
import { useTranslation } from "react-i18next";
import { cn } from "cn";

import i18n from "@/shared/i18n";
import { DRAW_COLOR, NO_COLOR, YES_COLOR } from "@/shared/config/colors";

import type { MarketListItem, OutcomeType } from "../../model/types";
import type { OutcomeView } from "../../lib/get-market-card-view";
import styles from "./market-card.module.css";

const WinnerIcon = () => <img src="/winner-icon-stroke.svg" style={{ width: 32 }} alt="" />;

const Crest = ({ src, alt, winner }: { src: string | null; alt?: string; winner: boolean }) => (
  <Img
    src={src ?? ""}
    className={styles.crests}
    unloader={<img className={styles.crests} alt={alt} src="/plug.svg" />}
    container={(children) => (
      <div className="relative flex items-center justify-center">
        {children}
        {winner && (
          <div className="absolute" style={{ right: "calc(50% - 40px)", bottom: -10 }}>
            <WinnerIcon />
          </div>
        )}
      </div>
    )}
  />
);

type TeamColumnProps = { crest: string | null; team?: string; color: string; result?: OutcomeType | null; outcome: OutcomeType; value: string | null; showValue: boolean };

const TeamColumn = ({ crest, team, color, result, outcome, value, showValue }: TeamColumnProps) => (
  <div className="text-center">
    <Crest src={crest} alt={team} winner={result === outcome} />
    <div className={styles.teamWrap}>
      <span style={{ color }} className={cn(styles.team, "block truncate")}>
        <small>{team}</small>
      </span>
    </div>
    {showValue ? (
      <div style={{ color }}>
        <span className={styles.price}>{value}</span>
      </div>
    ) : null}
  </div>
);

type MarketCardTeamsProps = Pick<MarketListItem, "yes_team" | "no_team" | "yes_crest_url" | "no_crest_url" | "result" | "event_date"> & {
  yes: OutcomeView;
  no: OutcomeView;
  draw: OutcomeView;
  exists: boolean;
  drawRowVisible: boolean;
  lang: string | null;
};

/** The two teams of a sport market with their crests, odds and the kick-off time. */
export const MarketCardTeams = ({ yes_team, no_team, yes_crest_url = null, no_crest_url = null, result, event_date, yes, no, draw, exists, drawRowVisible, lang }: MarketCardTeamsProps) => {
  const { t } = useTranslation();
  const showValues = exists && !!yes.value && !!no.value;

  return (
    <div style={{ marginTop: 5 }}>
      <div className={cn("grid grid-cols-3 gap-x-2", drawRowVisible ? "items-end" : "items-center")}>
        <TeamColumn crest={yes_crest_url} team={yes_team} color={YES_COLOR} result={result} outcome="yes" value={yes.value} showValue={showValues} />

        <div className={cn("text-center", styles.draw)}>
          <b style={{ fontSize: lang === "ru" || lang === "uk" ? 14 : 24 }}>{t("common.vs", "VS")}</b>
          <div className={styles.time}>
            <small>{moment.unix(event_date).format(i18n.language === "en" ? "MMM DD, LT" : i18n.language === "zh" ? "MMM Do LT" : "D MMM LT")}</small>
          </div>
          {drawRowVisible ? (
            <div style={{ color: DRAW_COLOR }}>
              <div className={styles.team}>
                <small>{t("common.draw", "draw")}</small>
              </div>
              <div style={{ color: DRAW_COLOR }}>
                <span className={styles.price}>{draw.value}</span>
              </div>
            </div>
          ) : null}
        </div>

        <TeamColumn crest={no_crest_url} team={no_team} color={NO_COLOR} result={result} outcome="no" value={no.value} showValue={showValues} />
      </div>
    </div>
  );
};
