import { useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { useSelector } from "react-redux";
import obyte from "obyte";
import { Helmet } from "react-helmet-async";
import ReactGA from "react-ga4";
import { Trans, useTranslation } from "react-i18next";

import { selectWalletAddress } from "store/slices/settingsSlice";
import { changeWalletAddress } from "store/thunks/changeWalletAddress";
import { useAppDispatch } from "store/hooks";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormItem } from "@/components/ui/form-item";
import { Input } from "@/components/ui/input";

type WalletModalProps = {
  children?: ReactNode;
  type?: "default" | "link";
  styles?: CSSProperties;
};

export const WalletModal = ({ children = "WALLET", type = "default", styles = {} }: WalletModalProps) => {
  const [visible, setVisible] = useState(false);
  const [walletAddress, setWalletAddress] = useState({ value: "", valid: false });

  const currentWalletAddress: string | null = useSelector(selectWalletAddress);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const changeVisible = () => {
    if (!visible) {
      ReactGA.event({
        category: "user-engagement",
        action: "click-wallet",
      });

      if (currentWalletAddress) {
        setWalletAddress({ value: currentWalletAddress, valid: true });
      }
    }

    setVisible((v) => !v);
  };

  const handleWalletAddress = (ev: ChangeEvent<HTMLInputElement>) => {
    if (obyte.utils.isValidAddress(ev.target.value)) {
      ReactGA.event({
        category: "user-engagement",
        action: "save-wallet",
      });
    }

    setWalletAddress({
      valid: obyte.utils.isValidAddress(ev.target.value),
      value: ev.target.value,
    });
  };

  const handleEnter = (ev: KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === "Enter" && buttonRef.current) {
      buttonRef.current.click();
    }
  };

  const saveWallet = () => {
    if (walletAddress.value && walletAddress.valid) {
      dispatch(changeWalletAddress(walletAddress.value));
      changeVisible();
    }
  };

  const btnStyles = type === "link" ? { padding: 0, ...styles } : { ...styles };
  const status = walletAddress.value === "" ? "" : walletAddress.valid ? "success" : "error";

  return (
    <>
      {visible && <Helmet title={`Prophet prediction markets — ${t("modals.wallet.title", "Wallet")}`} />}
      <Button onClick={changeVisible} size="lg" variant={type === "link" ? "link" : "outline"} style={btnStyles}>
        {currentWalletAddress ? `${currentWalletAddress.slice(0, 7)}...` : children === "WALLET" ? t("modals.wallet.title", "Wallet") : children}
      </Button>

      <Dialog open={visible} onOpenChange={(open) => (open ? setVisible(true) : changeVisible())}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{t("modals.wallet.title", "Wallet")}</DialogTitle>
            <DialogDescription className="sr-only">{t("modals.wallet.title", "Wallet")}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveWallet();
            }}
          >
            <FormItem
              status={status}
              extra={
                <small style={{ fontSize: 12 }}>
                  <Trans i18nKey="modals.wallet.install_obyte">
                    <a href="https://obyte.org/#download" target="_blank" rel="noopener">
                      Install Obyte wallet
                    </a>{" "}
                    if you don't have one yet, and copy/paste your address here.
                  </Trans>
                </small>
              }
            >
              {(control) => (
                <Input
                  {...control}
                  autoFocus={true}
                 
                  value={walletAddress.value}
                  placeholder={t("modals.wallet.placeholder", "Wallet address (Example: WMFLGI2GLAB2...)")}
                  onChange={handleWalletAddress}
                  onKeyDown={handleEnter}
                  ref={inputRef}
                />
              )}
            </FormItem>
            <Button type="button" ref={buttonRef} onClick={saveWallet} disabled={!walletAddress.valid || (currentWalletAddress ? currentWalletAddress === walletAddress.value : false)}>
              {t("modals.wallet.save", "Save")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
