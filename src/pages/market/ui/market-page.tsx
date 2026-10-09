import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { kebabCase } from "lodash-es";
import { useTranslation } from "react-i18next";

import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";
import { selectLanguage } from "@/shared/i18n/model";
import { useNow } from "@/shared/lib/hooks/use-now";
import { getLangPath } from "@/shared/lib/lang-path";
import { SpinnerBlock } from "@/shared/ui/spinner";
import {
  generateTextEvent,
  getEstimatedAPY,
  getMarketPhase,
  selectActiveAddress,
  selectActiveCurrencyCandles,
  selectActiveMarketParams,
  selectActiveMarketStateVars,
  selectActiveMarketStatus,
  selectActiveTeams,
  setActiveMarket,
} from "@/entities/market";
import { isCurrencyOracle } from "@/entities/oracle";
import { selectReserveAssets } from "@/entities/reserve-asset";
import { TradeDialogProvider } from "@/features/trade";
import { WalletModal } from "@/features/connect-wallet";
import { CurrencyChart, MarketChart } from "@/widgets/market-chart";
import { RecentEvents } from "@/widgets/recent-events";

import { useMarketAddress } from "../model/use-market-address";
import { useMarketSeoRedirect } from "../model/use-market-seo-redirect";
import { MarketHeader } from "./market-header";
import { MarketLiquidity } from "./market-liquidity";
import { MarketOutcomes } from "./market-outcomes";

const MarketPageContent = ({ address }: { address: string | undefined }) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const status = useAppSelector(selectActiveMarketStatus);
  const activeAddress = useAppSelector(selectActiveAddress);
  const params = useAppSelector(selectActiveMarketParams);
  const stateVars = useAppSelector(selectActiveMarketStateVars);
  const teams = useAppSelector(selectActiveTeams);
  const reserveAssets = useAppSelector(selectReserveAssets);
  const currencyCandles = useAppSelector(selectActiveCurrencyCandles);
  const currentLang = useAppSelector(selectLanguage);

  const now = useNow();

  useEffect(() => {
    if (address && activeAddress !== address) {
      dispatch(setActiveMarket({ address }));
    }
  }, [address]);

  useMarketSeoRedirect();

  const { reserve_asset = "base", quiet_period = 0 } = params;
  const { reserve = 0, result, coef = 1 } = stateVars;
  const actualReserveSymbol = reserveAssets[reserve_asset]?.symbol;

  if (status !== "loaded" || !address || !actualReserveSymbol) return <SpinnerBlock className="m-10 py-0" />;

  const phase = getMarketPhase({ event_date: params.event_date, quiet_period, waiting_period_length: params.waiting_period_length, result }, now);
  const isCurrencyMarket = isCurrencyOracle(params.oracle);

  const teamNames = { yes_team_name: teams?.yes?.name, no_team_name: teams?.no?.name };
  const event = generateTextEvent({ ...params, ...teamNames });
  const eventUTC = generateTextEvent({ ...params, ...teamNames, isUTC: true });
  const teamsKnown = !(teams.yes === null || teams.no === null);

  const apy = getEstimatedAPY({ coef, params });
  const apyView = apy < 1e15 ? (+Number(apy).toPrecision(9)).toLocaleString("en-US") : apy;

  const walletSlot = <WalletModal type="link" styles={{ fontSize: 16 }} />;

  return (
    <>
      <Helmet>
        <title>Prophet prediction markets — {(!teamsKnown ? event : `${teams.yes!.name} vs ${teams.no!.name}`) + `, liquidity provider APY ${apy}%`}</title>
        <link rel="canonical" href={`${window.location.protocol + "//" + window.location.host}${getLangPath(currentLang)}/market/${kebabCase(eventUTC)}-${address}`} />
      </Helmet>
      <div style={{ marginTop: 50 }}>
        <MarketHeader address={address} event={event} teams={teams} phase={phase} reserve={reserve} walletSlot={walletSlot} />

        {isCurrencyMarket && currencyCandles.length > 0 && <CurrencyChart data={currencyCandles} params={params} />}

        <MarketOutcomes phase={phase} isCurrencyMarket={isCurrencyMarket} />

        <MarketChart now={now} />

        <MarketLiquidity apyView={apyView} isTradeActive={phase.isTradeActive} walletSlot={walletSlot} />

        <div>
          <h2 style={{ marginBottom: 15, marginTop: 50, fontSize: 28 }}>{t("pages.market.recent_events", "Recent events")}</h2>
          <RecentEvents />
        </div>
      </div>
    </>
  );
};

/** A single market: header with actions, outcome cards, history chart, liquidity block, recent events. */
export const MarketPage = () => {
  const address = useMarketAddress();

  return (
    <TradeDialogProvider marketAddress={address}>
      <MarketPageContent address={address} />
    </TradeDialogProvider>
  );
};
