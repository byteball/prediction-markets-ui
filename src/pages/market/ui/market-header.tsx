import type { ReactElement } from "react";
import moment from "moment";
import { Img } from "react-image";
import { Trans, useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";

import i18n from "@/shared/i18n";
import { NO_COLOR, YES_COLOR } from "@/shared/config/colors";
import { getExplorerUrl } from "@/shared/lib/get-explorer-url";
import { useAppSelector } from "@/shared/lib/redux";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { selectActiveMarketParams, type MarketPhaseView, type Team } from "@/entities/market";
import { isKnownOracle } from "@/entities/oracle";
import { transformChampionshipName } from "@/entities/championship";
import { TradeModal } from "@/features/trade";
import { ClaimProfitModal } from "@/features/claim-profit";
import { CommitResultButton } from "@/features/commit-result";
import { ViewParamsModal } from "@/features/view-market-params";

import styles from "./market-page.module.css";

type MarketHeaderProps = {
  address: string;
  event: string;
  teams: { yes: Team | null; no: Team | null };
  phase: MarketPhaseView;
  reserve: number;
  walletSlot: ReactElement;
};

const TeamEmblem = ({ crest, team, color }: { crest: string | null; team: Team; color: string }) => (
  <div className="text-center">
    <div className={styles.emblemWrap}>
      <Img src={crest ?? ""} alt={team.name} className={styles.emblem} unloader={<img className={styles.emblem} alt={team.name} src="/plug.svg" />} />
    </div>
    <div style={{ paddingTop: 10, lineHeight: 1 }}>
      <span style={{ color }}>{team.name}</span>
    </div>
  </div>
);

/** Event title, the teams of a sport market, the market actions and the unknown-oracle warning. */
export const MarketHeader = ({ address, event, teams, phase, reserve, walletSlot }: MarketHeaderProps) => {
  const { t } = useTranslation();
  const params = useAppSelector(selectActiveMarketParams);
  const { event_date, league, league_emblem, oracle, yes_crest_url = null, no_crest_url = null } = params;

  const teamsKnown = !(teams.yes === null || teams.no === null);
  const leagueView = transformChampionshipName(league as string, params.feed_name.split("_")?.[0]);

  return (
    <>
      <h1 className={styles.event}>
        {event}
        {teams?.yes?.name ? " prediction" : null}
      </h1>

      {teamsKnown && (
        <div style={{ margin: "30px 0", width: "100%" }}>
          <div className="grid grid-cols-3">
            <TeamEmblem crest={yes_crest_url} team={teams.yes!} color={YES_COLOR} />

            <div className="self-center text-center">
              <b className={styles.vs}>{t("common.vs", "VS")}</b>
              <div>{moment.unix(event_date).format(i18n.language === "en" ? "MMM DD, LT" : i18n.language === "zh" ? "MMM Do LT" : "D MMM LT")}</div>
              {league && league_emblem && (
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <img className={styles.league} src={league_emblem} alt={leagueView} />
                    </TooltipTrigger>
                    <TooltipContent>{leagueView}</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            <TeamEmblem crest={no_crest_url} team={teams.no!} color={NO_COLOR} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-6" style={{ marginBottom: 20, marginTop: 10 }}>
        <TradeModal walletSlot={walletSlot} disabled={!phase.isTradeActive} reserve={reserve} yes_team={teams?.yes?.name} no_team={teams?.no?.name} />
        {phase.canCommitResult && <CommitResultButton />}
        {phase.canClaim && <ClaimProfitModal yes_team={teams?.yes?.name} no_team={teams?.no?.name} />}
        <ViewParamsModal {...params} aa_address={address} />
      </div>

      {!isKnownOracle(oracle) && (
        <Alert className="border-draw/40 bg-draw/10 text-foreground">
          <TriangleAlert className="text-draw" />
          <AlertDescription className="text-foreground">
            <Trans i18nKey="pages.market.unknown_oracle">
              This market uses an oracle{" "}
              <a style={{ color: "#fff" }} href={getExplorerUrl("address", oracle)} target="_blank" rel="noopener">
                {oracle}
              </a>{" "}
              that is unknown to this website, trade with care.
            </Trans>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
