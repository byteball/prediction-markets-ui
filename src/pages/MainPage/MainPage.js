import { useEffect, useState } from "react";
import { Col, Empty, Row, Spin } from "antd";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { Layout } from "components/Layout/Layout";
import { PredictionList } from "components/PredictionList/PredictionList";
import { SwitchActions } from "components/SwitchActions/SwitchActions";

import { selectAllMarkets, selectAllMarketsStatus, selectChampionships } from "store/slices/marketsSlice";

import { getTabNameByType } from "utils/getTabNameByType";

import styles from "./MainPage.module.css";
import { Helmet } from "react-helmet-async";

export const MainPage = () => {
	const markets = useSelector(selectAllMarkets);
	const allMarketsStatus = useSelector(selectAllMarketsStatus);
	const championships = useSelector(selectChampionships);
	const { category, particle: particleFromUrl } = useParams();
	const navigate = useNavigate();
	const location = useLocation();

	const [marketType, setMarketType] = useState('all');
	const [particle, setParticle] = useState('all');
	const [inited, setInited] = useState(false);

	const sportTypes = Object.keys(championships);

	const switchActionsData = [{ value: 'all', text: 'All' }];

	sportTypes.forEach((type) => switchActionsData.push(({ value: type, text: getTabNameByType(type) })))
	switchActionsData.push({ value: 'currency', text: '📈 Currency' }, { value: 'misc', text: 'Misc' })

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
				navigate('/');

			} else if (['all', 'misc', 'currency'].includes(type)) {
				navigate(`/${type}`);

			} else {
				navigate(`/${type}/all`)
			}
		}

	}

	const handleParticle = (particle) => {
		if (inited) {
			setParticle(particle);
			navigate(`/${marketType}/${particle}`)
		}
	}

	return <div>
		<Helmet title={`Prediction markets — ${marketType} markets`} />
		<Layout>
			<Row className={styles.headerWrap}>
				<Col xs={{ span: 24 }} md={{ span: 24 }}>
					<h1 className={styles.mainHeader}>
						Decentralized <span className={styles.select}>prediction markets</span>
					</h1>
					<div className={styles.description}>
						<p>Sports betting, binary options, and other bets on future events</p>
					</div>
				</Col>
			</Row>

			{(markets.length > 0) ? <div className={styles.listWrap}>
				<SwitchActions value={marketType} data={switchActionsData} onChange={handleMarketType} />

				<div style={{ marginTop: 10 }}>
					<PredictionList type={marketType} particle={particle} setParticle={handleParticle} />
				</div>
			</div> : <div>
				<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="There are no markets" />
			</div>}
		</Layout>
	</div>
}