import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { MainMenu } from "components/main-menu/main-menu";
import { SocialLinks } from "components/social-links/social-links";
import { ViewPriceSwitcher } from "components/view-price-switcher/view-price-switcher";
import { SelectLanguage } from "components/select-language/select-language";

import { useWindowSize } from "hooks";
import { WalletModal } from "modals";

import { Button } from "components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "components/ui/sheet";

import styles from "./header.module.css";

export const Header = () => {
	const [width] = useWindowSize();
	const [showMenu, setShowMenu] = useState(false);

	const changeVisible = () => setShowMenu((v) => !v);
	const { t } = useTranslation();

	return (
		<div className={styles.header}>
			<div>
				<div className="flex items-center justify-between">
					<div>
						<Link to="/" className={styles.logoWrap}>
							<img className={styles.logo} src="/logo.svg" alt="Prophet" />
							<div>
								<div className={styles.name}>Prophet</div>
								<small className={styles.desc}>{t("header.description", "Prediction markets")}</small>
							</div>
						</Link>
					</div>
					{width >= 990 ? (
						<div className="flex items-center gap-6">
							<MainMenu />
							<WalletModal />

							<div className={styles.priceSwitcherWrap}>
								<ViewPriceSwitcher />
							</div>
							<SelectLanguage />
						</div>
					) : (
						<>
							<Button variant="outline" size="lg" onClick={changeVisible}>
								{t("header.menu", "Menu")}
							</Button>
							<Sheet open={showMenu} onOpenChange={setShowMenu}>
								<SheetContent side="right" className="w-[320px] max-w-full overflow-y-auto p-6 text-center">
									<SheetHeader className="p-0">
										<SheetTitle className="sr-only">{t("header.menu", "Menu")}</SheetTitle>
										<SheetDescription className="sr-only">{t("header.menu", "Menu")}</SheetDescription>
									</SheetHeader>
									<div className="flex flex-col items-center" style={{ maxHeight: "calc(100vh - 50px)" }}>
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
									</div>
								</SheetContent>
							</Sheet>
						</>
					)}
				</div>
			</div>
		</div>
	);
};
