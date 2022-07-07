import { useState } from "react";
import { Row, Col, Button, Drawer, Space } from "antd";
import { Link } from "react-router-dom";

import { MainMenu } from "components/MainMenu/MainMenu";
import { SocialLinks } from "components/SocialLinks/SocialLinks";
import { useWindowSize } from "hooks/useWindowSize";
import { WalletModal } from "modals";
import { ViewPriceSwitcher } from "components/ViewPriceSwitcher/ViewPriceSwitcher";

export const Header = () => {
	const [width] = useWindowSize();
	const [showMenu, setShowMenu] = useState(false);

	const changeVisible = () => setShowMenu((v) => !v);

	return <div style={{ padding: "20px 0", fontSize: 16 }}>
		<div>
			<Row align="middle" justify="space-between">
				<Col>
					<Link to="/" style={{ color: "#fff", display: 'flex', alignItems: 'center' }}>
						<img style={{ width: 49, height: 49, marginRight: 10 }} src="/logo.svg" alt="Prophet" />
						<div>
							<div style={{ fontWeight: 500, fontSize: 18, lineHeight: '1em' }}>Prophet</div>
							<small style={{ lineHeight: '1em' }}>Prediction markets</small>
						</div>
					</Link>
				</Col>
				{width >= 780 ? <>
					<Col>
						<Space size="large">
							<MainMenu />
							<WalletModal />

							<div style={{ width: 80, display: 'flex', justifyContent: 'flex-end' }}>
								<ViewPriceSwitcher />
							</div>
						</Space>
					</Col>
				</> : <>
					<Button onClick={changeVisible} size="large">Menu</Button>
					<Drawer width={width >= 320 ? 320 : width} visible={showMenu} onClose={changeVisible} bodyStyle={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 50px)' }}>
						<div>
							<MainMenu direction="vertical" />
						</div>
						<div style={{ marginTop: 20 }}>
							<WalletModal />
						</div>
						<div style={{ marginTop: 20, flex: 1 }}>
							<ViewPriceSwitcher />
						</div>
						<div style={{ marginTop: 15, display: 'flex', justifyContent: 'center' }}>
							<SocialLinks size="small" />
						</div>
					</Drawer>
				</>}
			</Row>
		</div>
	</div>
}