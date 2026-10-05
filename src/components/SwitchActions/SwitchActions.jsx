import { memo } from 'react';
import { Link } from 'react-router-dom';

import styles from "./SwitchActions.module.css";

export const SwitchActions = memo(({ data = [], value, onChange, small = false, linked = false, isLoading = false }) => {
  if (isLoading || data.length === 0) {
    return <div className={`${styles.switch} ${isLoading ? styles.suspense : ''} ${small ? styles.switchSmall : ''}`}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, index) => <div key={index} className={styles.switchItem} />)}
    </div>
  }

  const handleSwitch = (e, v) => {

    if (onChange) {
      onChange(v);
    }

    if (linked) {
      e.preventDefault();
    }
  }

  const Wrapper = linked ? Link : 'span';

  return <div className={`${styles.switch} ${small ? styles.switchSmall : ''}`}>
    {data.map(({ text, value: v, iconLink, url }) => <Wrapper to={linked ? url : undefined} key={value + url + text} onClick={(e) => handleSwitch(e, v)} className={`${styles.switchItem} ${v === value ? styles.switchActive : ""}`}>{iconLink && <img src={iconLink} style={{ background: "#fff", height: '1em' }} alt={text} />}{text}</Wrapper>)}
  </div>
});
