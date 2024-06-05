import { useEffect, useState } from "react";
import { Col, Empty, Row, Spin } from "antd";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";

import { PredictionList } from "components/PredictionList/PredictionList";
import { SwitchActions } from "components/SwitchActions/SwitchActions";

import { selectAllMarkets, selectAllMarketsStatus, selectChampionships } from "store/slices/marketsSlice";
import { selectLanguage } from "store/slices/settingsSlice";

import { getTabNameByType } from "utils/getTabNameByType";

import styles from "./MainPage.module.css";
import { capitalizeFirstLetter } from "utils";
import i18n from "locale";
import { useWindowSize } from "hooks";
import { PageProvider } from "components/PageProvider/PageProvider";

export const MainPage = () => {
	const markets = useSelector(selectAllMarkets);
	const allMarketsStatus = useSelector(selectAllMarketsStatus);
	const championships = useSelector(selectChampionships);
	const lang = useSelector(selectLanguage);
	const { category, particle: particleFromUrl } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation();
	const [width] = useWindowSize();

	const [marketType, setMarketType] = useState('all');
	const [particle, setParticle] = useState('all');
	const [inited, setInited] = useState(false);

	const sportTypes = Object.keys(championships);
	const langPath = (!lang || lang === 'en') ? '' : `/${lang}`;

	const switchActionsData = [{ value: 'all', text: t('common.all', "All") }];

	sportTypes.forEach((type) => switchActionsData.push(({ value: type, text: getTabNameByType(type) })))
	switchActionsData.push({ value: 'currency', text: `📈 ${t('common.currency', "Currency")}` }, { value: 'misc', text: t('common.misc', "Misc") })

	useEffect(() => {
		// init params from url
		if (!inited) {
			if (category) {
				setMarketType(category);
			} else {
				setMarketType('all');
			}

			if (particleFromUrl) {
				setParticle(particleFromUrl);
			} else if (category === 'currency') {
				setParticle('GBYTE')
			}

			setInited(true);
		}

	}, [inited, particleFromUrl, category]);


	useEffect(() => {
		// update when changing url
		if (inited) {
			if (category !== marketType) {
				setMarketType(category);
			}

			if (particle !== particleFromUrl) {
				setParticle(particleFromUrl || 'all')
			}
		}

	}, [location.pathname]);

	if (!markets || allMarketsStatus !== 'loaded' || !inited) return (
		<div className={styles.spinWrap}>
			<Spin size="large" />
		</div>
	)

	const handleMarketType = (type) => {
		if (inited && marketType !== type) {
			setMarketType(type);
			if (type === 'currency') {
				setParticle('GBYTE');
			} else {
				setParticle('all');
			}

			if (type === 'all' || !type) {
				navigate(`${langPath}/`);

			} else if (['all', 'misc', 'currency'].includes(type)) {
				navigate(`${langPath}/${type}`);

			} else {
				navigate(`${langPath}/${type}/all`)
			}
		}

	}

	const handleParticle = (particle) => {
		if (inited) {
			setParticle(particle);
			navigate(`${langPath}/${marketType}/${particle}`)
		}
	}

	let actualChampionshipName;

	if (marketType === 'soccer' && particle !== 'all' && championships) {
		actualChampionshipName = championships[marketType].find(({ code }) => code === particle)?.name;
	}

	return <div>
		<PageProvider />
		<Helmet title={`Prophet prediction markets — ${actualChampionshipName || (marketType === 'misc' ? 'miscellaneous' : marketType)} markets`} />

		<Row className={styles.headerWrap}>
			<Col xs={{ span: 24 }} md={{ span: 24 }}>
				<h1 className={styles.mainHeader} style={{ fontSize: (["en", "zh"].includes(i18n.language) || width >= 600) ? (width >= 600 ? 42 : 36) : (width >= 400 ? 28 : 22) }}>
					<Trans i18nKey="pages.main.title">
						Decentralized <span className={styles.select}>prediction markets</span>
					</Trans>
				</h1>
				<h2 className={styles.description}>
					<Trans i18nKey="pages.main.subtitle">
						<p>Sports betting, binary options, and other bets on future events</p>
					</Trans>
				</h2>
			</Col>
		</Row>

		{(markets.length > 0) ? <div className={styles.listWrap}>
			<SwitchActions value={marketType} data={switchActionsData} onChange={handleMarketType} />

			<div style={{ marginTop: 10 }}>
				<PredictionList type={marketType} particle={particle} setParticle={handleParticle} />
			</div>
		</div> : <div>
			<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={capitalizeFirstLetter(t('common.no_markets', "no markets"))} />
		</div>}
	</div>
}