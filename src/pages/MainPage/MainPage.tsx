import { useCallback } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Trans } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";

import { PredictionList } from "components/PredictionList/PredictionList";
import { SwitchActions } from "components/SwitchActions/SwitchActions";
import { PageProvider } from "components/PageProvider/PageProvider";

import { selectLanguage } from "store/slices/settingsSlice";

import { useWindowSize, useChampionships } from "hooks";

import styles from "./MainPage.module.css";

import i18n from "locale";

export const MainPage = () => {
	const { category = "all", particle = "all" } = useParams();

	const lang = useSelector(selectLanguage);
	const navigate = useNavigate();
	const { championships, categories, isLoading } = useChampionships(lang);
	const [width] = useWindowSize();
	const location = useLocation();

	const handleMarketCategory = useCallback(
		(newCategory: string) => {
			if (category !== newCategory) {
				const langPath = !lang || lang === "en" ? "" : `/${lang}`;

				if (newCategory === "all" || !newCategory) {
					navigate(`${langPath}/`);
				} else if (["all", "misc", "currency"].includes(newCategory)) {
					navigate(`${langPath}/${newCategory}${location.search}`);
				} else {
					navigate(`${langPath}/${newCategory}/all`);
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[lang, category, navigate]
	);

	let actualChampionshipName: string | undefined;

	if (category === "soccer" && particle !== "all" && championships) {
		actualChampionshipName = championships?.soccer?.find(({ code }: { code: string }) => code === particle)?.name;
	}

	return (
		<div>
			<PageProvider />
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
					<PredictionList />
				) : (
					<div className={styles.spinWrap}>
						<Loader2 className="size-8 animate-spin text-primary" aria-label="loading" />
					</div>
				)}
			</div>
		</div>
	);
};
