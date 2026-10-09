import { useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Trans } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";

import { MarketList } from "@/widgets/market-list";
import { SwitchActions } from "@/shared/ui/switch-actions/switch-actions";

import { selectLanguage } from "@/shared/i18n/model";
import { useAppSelector } from "@/shared/lib/redux";

import { useWindowSize } from "@/shared/lib/hooks/use-window-size";
import { getLangPath } from "@/shared/lib/lang-path";
import { useChampionships } from "@/entities/championship";

import styles from "./main-page.module.css";

import i18n from "@/shared/i18n";

export const MainPage = () => {
	const { category = "all", particle = "all" } = useParams();

	const lang = useAppSelector(selectLanguage);
	const navigate = useNavigate();
	const { championships, categories, isLoading } = useChampionships(lang);
	const [width] = useWindowSize();
	const location = useLocation();

	const handleMarketCategory = useCallback(
		(newCategory: string) => {
			if (category !== newCategory) {
				const langPath = getLangPath(lang);

				if (newCategory === "all" || !newCategory) {
					navigate(`${langPath}/`);
				} else if (["all", "misc", "currency"].includes(newCategory)) {
					navigate(`${langPath}/${newCategory}${location.search}`);
				} else {
					navigate(`${langPath}/${newCategory}/all`);
				}
			}
		},
		[lang, category, navigate]
	);

	let actualChampionshipName: string | undefined;

	if (category === "soccer" && particle !== "all" && championships) {
		actualChampionshipName = championships?.soccer?.find(({ code }: { code: string }) => code === particle)?.name;
	}

	return (
		<div>
			<Helmet title={`Prophet prediction markets — ${actualChampionshipName || (category === "misc" ? "miscellaneous" : category)} markets`} />

			<div className={styles.headerWrap}>
				<div>
					<h1 className={styles.mainHeader} style={{ fontSize: ["en", "zh"].includes(i18n.language) || width >= 600 ? (width >= 600 ? 42 : 36) : width >= 400 ? 28 : 22 }}>
						<Trans i18nKey="pages.main.title">
							Decentralized <span className={styles.select}>prediction markets</span>
						</Trans>
					</h1>
					<h2 className={styles.description}>
						<Trans i18nKey="pages.main.subtitle">
							<p>Sports betting, binary options, and other bets on future events</p>
						</Trans>
					</h2>
				</div>
			</div>

			<div className={styles.listWrap}>
				<SwitchActions linked isLoading={isLoading} value={category} data={categories} onChange={handleMarketCategory} />
				{!isLoading ? (
					<MarketList />
				) : (
					<div className={styles.spinWrap}>
						<Loader2 className="size-8 animate-spin text-primary" aria-label="loading" />
					</div>
				)}
			</div>
		</div>
	);
};
