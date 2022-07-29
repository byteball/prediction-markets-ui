import { Button, Form, Input, Modal, Typography } from "antd";
import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux";
import obyte from "obyte";

import {
  changeWalletAddress,
  selectWalletAddress
} from "store/slices/settingsSlice";

export const WalletModal = ({ children = "WALLET", type = "default", styles = {} }) => {
  const [visible, setVisible] = useState(false);
  const [walletAddress, setWalletAddress] = useState({ value: "", valid: false });

  const currentWalletAddress = useSelector(selectWalletAddress);

  const buttonRef = useRef(null);
  const inputRef = useRef(null);

  const dispatch = useDispatch();

  useEffect(() => {
    if (currentWalletAddress) {
      setWalletAddress({
        value: currentWalletAddress,
        valid: true
      })
    }
  }, [currentWalletAddress, visible])

  const changeVisible = () => setVisible((v) => !v);

  const handleWalletAddress = (ev) => {
    setWalletAddress({
      valid: obyte.utils.isValidAddress(ev.target.value),
      value: ev.target.value
    })
  }

  const handleEnter = (ev) => {
    if (ev.key === "Enter" && buttonRef.current) {
      buttonRef.current.click();
    }
  }

  const saveWallet = () => {
    if (walletAddress.value && walletAddress.valid) {
      dispatch(changeWalletAddress(walletAddress.value));
      changeVisible();
    }
  }

  const btnStyles = type === "link" ? { padding: 0, ...styles } : { ...styles };

  return <>
    <Button onClick={changeVisible} size="large" type={type} style={btnStyles}>{currentWalletAddress ? `${currentWalletAddress.slice(0, 7)}...` : children}</Button>

    <Modal
      visible={visible}
      onCancel={changeVisible}
      footer={null}
    >
      <Typography.Title level={3}>Wallet</Typography.Title>
      <Form size="large">
        <Form.Item validateStatus={walletAddress.value === "" ? "" : (walletAddress.valid ? "success" : "error")} extra={<small style={{ fontSize: 12 }}>
          <a href="https://obyte.org/#download" target="_blank" rel="noopener">Install Obyte wallet</a> if you don't have one yet, and copy/paste your address here.
        </small>}>
          <Input autoFocus={true} value={walletAddress.value} placeholder="Wallet address (Example: WMFLGI2GLAB2...)" onChange={handleWalletAddress} onKeyDown={handleEnter} ref={inputRef} />
        </Form.Item>
        <Button type="primary" ref={buttonRef} onClick={saveWallet} disabled={!walletAddress.valid || (currentWalletAddress ? currentWalletAddress === walletAddress.value : false)}>Save</Button>
      </Form>
    </Modal>
  </>
}