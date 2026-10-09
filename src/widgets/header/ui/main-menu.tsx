import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "cn";

import { selectLanguage } from "@/shared/i18n/model";
import { useAppSelector } from "@/shared/lib/redux";

import styles from "./main-menu.module.css";

type MainMenuProps = {
  direction?: "horizontal" | "vertical";
  onClose?: () => void;
};

export const MainMenu = ({ direction = "horizontal", onClose = () => {} }: MainMenuProps) => {
  const { t } = useTranslation();
  const lang = useAppSelector(selectLanguage);

  const basename = lang && lang !== "en" ? "/" + lang : "";

  return (
    <nav className={cn("flex items-center gap-6", direction === "vertical" && "flex-col")}>
      <Link className={styles.menu_item} onClick={onClose} to={`${basename}/create`}>
        {t("main_menu.create", "Create new market")}
      </Link>
      <Link className={styles.menu_item} onClick={onClose} to={`${basename}/faq`}>
        {t("main_menu.faq", "F.A.Q.")}
      </Link>
    </nav>
  );
};
