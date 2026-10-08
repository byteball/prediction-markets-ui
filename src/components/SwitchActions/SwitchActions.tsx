import { memo, type MouseEvent } from "react";
import { Link } from "react-router-dom";

import styles from "./SwitchActions.module.css";

export type SwitchAction = {
  text: string;
  value: string;
  iconLink?: string;
  url?: string;
};

type SwitchActionsProps = {
  data?: SwitchAction[];
  value?: string | null;
  onChange?: (value: string) => void;
  small?: boolean;
  linked?: boolean;
  isLoading?: boolean;
};

export const SwitchActions = memo(({ data = [], value, onChange, small = false, linked = false, isLoading = false }: SwitchActionsProps) => {
  if (isLoading || data.length === 0) {
    return (
      <div className={`${styles.switch} ${isLoading ? styles.suspense : ""} ${small ? styles.switchSmall : ""}`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, index) => (
          <div key={index} className={styles.switchItem} />
        ))}
      </div>
    );
  }

  const handleSwitch = (e: MouseEvent, v: string) => {
    if (onChange) {
      onChange(v);
    }

    if (linked) {
      e.preventDefault();
    }
  };

  return (
    <div className={`${styles.switch} ${small ? styles.switchSmall : ""}`}>
      {data.map(({ text, value: v, iconLink, url }) => {
        const className = `${styles.switchItem} ${v === value ? styles.switchActive : ""}`;
        const content = (
          <>
            {iconLink && <img src={iconLink} style={{ background: "#fff", height: "1em" }} alt={text} />}
            {text}
          </>
        );
        const key = `${v}${url}${text}`;

        return linked ? (
          <Link to={url ?? ""} key={key} onClick={(e) => handleSwitch(e, v)} className={className}>
            {content}
          </Link>
        ) : (
          <button type="button" key={key} aria-pressed={v === value} onClick={(e) => handleSwitch(e, v)} className={className}>
            {content}
          </button>
        );
      })}
    </div>
  );
});

SwitchActions.displayName = "SwitchActions";
