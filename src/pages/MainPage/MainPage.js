import { useEffect, useState } from "react";
import { Col, Empty, Row, Spin } from "antd";
import { useSelector } from "react-redux";

import { Layout } from "components/Layout/Layout";
import { PredictionList } from "components/PredictionList/PredictionList";
import { SwitchActions } from "components/SwitchActions/SwitchActions";

import { selectAllMarkets, selectAllMarketsStatus, selectChampionships } from "store/slices/marketsSlice";

import { getTabNameByType } from "utils/getTabNameByType";

import styles from "./MainPage.module.css";
import { useNavigate, useParams } from "react-router-dom";

export const MainPage = () => {
	const markets = useSelector(selectAllMarkets);
	const allMarketsStatus = useSelector(selectAllMarketsStatus);
	const championships = useSelector(selectChampionships);
	const { category } = useParams();

	const navigate = useNavigate();
	const [marketType, setMarketType] = useState('all');
	const [inited, setInited] = useState(false);

	const sportTypes = Object.keys(championships);

	const switchActionsData = [{ value: 'all', text: 'All' }, { value: 'currency', text: '📈 Currency' }];

	sportTypes.forEach((type) => switchActionsData.push(({ value: type, text: getTabNameByType(type) })))

	switchActionsData.push({ value: 'misc', text: 'Misc' })

	useEffect(() => {
		if (!markets || allMarketsStatus !== 'loaded') {
			if (category) {
				setMarketType(category);
			} else {
				navigate('/all');
			}
		}
	}, [markets, allMarketsStatus])


	if (!markets || allMarketsStatus !== 'loaded') return (
		<div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
			<Spin size="large" />
		</div>
	)

	const handleAction = (action) => {
		setMarketType(action);
		
		if (inited) {
			navigate(`/${action}`);
		} else {
			setInited(true);
		}
	}

	return <div>
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

			{markets.length > 0 ? <div style={{ margin: "0 auto", marginTop: 40, maxWidth: 780, userSelect: 'none' }}>
				<SwitchActions value={marketType} data={switchActionsData} onChange={handleAction} />

				<div style={{ marginTop: 10 }}>
					<PredictionList type={marketType} />
				</div>
			</div> : <div>
				<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="There are no markets" />
			</div>}
		</Layout>
	</div>
}