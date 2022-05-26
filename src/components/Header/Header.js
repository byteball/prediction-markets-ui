import { useState } from "react";
import { Row, Col, Button, Drawer, Typography } from "antd";
import { Link } from "react-router-dom";

import { MainMenu } from "components/MainMenu/MainMenu";
import { SocialLinks } from "components/SocialLinks/SocialLinks";
import { useWindowSize } from "hooks/useWindowSize";
import { WalletModal } from "modals";

export const Header = () => {
  const [width] = useWindowSize();
  const [showMenu, setShowMenu] = useState(false);

  const changeVisible = () => setShowMenu((v) => !v);

  return <div style={{ padding: "20px", fontSize: 16 }}>
    <div>
      <Row align="middle" justify="space-between">
        <Col>
          <Link to="/" style={{ color: "#fff" }}>
            site name
          </Link>
        </Col>
        {width >= 780 ? <>
          <Col>
            <div style={{ verticalAlign: "middle" }}>
              <MainMenu />
            </div>
          </Col>
          <Col>
            <WalletModal />
          </Col>
        </> : <>
          <Button onClick={changeVisible} size="large">Menu</Button>
          <Drawer width={width >= 320 ? 320 : width} visible={showMenu} onClose={changeVisible}>
            <Typography.Title>Menu</Typography.Title>
            <div>
              <MainMenu direction="vertical" />
            </div>
            <div style={{ marginTop: 20 }}>
              <WalletModal />
            </div>
            <div style={{ marginTop: 15 }}>
              <SocialLinks size="small" />
            </div>
          </Drawer>
        </>}
      </Row>
    </div>
  </div>
}