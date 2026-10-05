import { useState } from "react";
import { Row, Col, Button, Drawer, Space } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { MainMenu } from "components/MainMenu/MainMenu";
import { SocialLinks } from "components/SocialLinks/SocialLinks";
import { ViewPriceSwitcher } from "components/ViewPriceSwitcher/ViewPriceSwitcher";
import { SelectLanguage } from "components/SelectLanguage/SelectLanguage";

import { useWindowSize } from "hooks";
import { WalletModal } from "modals";

import styles from "./Header.module.css";

export const Header = () => {
	const [width] = useWindowSize();
	const [showMenu, setShowMenu] = useState(false);

	const changeVisible = () => setShowMenu((v) => !v);
	const { t } = useTranslation();

	return <div className={styles.header}>
		<div>
			<Row align="middle" justify="space-between">
				<Col>
					<Link to="/" className={styles.logoWrap}>
						<img className={styles.logo} src="/logo.svg" alt="Prophet" />
						<div>
							<div className={styles.name}>Prophet</div>
							<small className={styles.desc}>{t("header.description", "Prediction markets")}</small>
						</div>
					</Link>
				</Col>
				{width >= 990 ? <>
					<Col>
						<Space size="large" align="baseline">
							<MainMenu />
							<WalletModal />

							<div className={styles.priceSwitcherWrap}>
								<ViewPriceSwitcher />
							</div>
							<SelectLanguage />
						</Space>
					</Col>
				</> : <>
					<Button onClick={changeVisible} size="large">{t("header.menu", "Menu")}</Button>
					<Drawer width={width >= 320 ? 320 : width} visible={showMenu} onClose={changeVisible} bodyStyle={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 50px)' }}>
						<div className={styles.mainMenuWrap}>
							<MainMenu direction="vertical" onClose={changeVisible} />
						</div>
						<div className={styles.walletWrap}>
							<WalletModal />
						</div>
						<div className={styles.switcherWrap}>
							<ViewPriceSwitcher />
						</div>

						<div className={styles.languageWrap}>
							<SelectLanguage action={() => setShowMenu(false)} />
						</div>

						<div className={styles.socialLinksWrap}>
							<SocialLinks size="small" />
						</div>
					</Drawer>
				</>}
			</Row>
		</div>
	</div>
}