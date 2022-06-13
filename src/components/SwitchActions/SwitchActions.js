import { useState, useEffect } from 'react';

import styles from "./SwitchActions.module.css";

export const SwitchActions = ({ data = [], value, onChange, small = false }) => {
  const [currentValue, setCurrentValue] = useState(value || data[0]?.value);

  useEffect(() => {
    if (value !== currentValue) {
      setCurrentValue(value)
    }
  }, [value]);

  useEffect(() => {
    if (onChange) {
      onChange(currentValue);
    }
  }, [currentValue]);

  if (data.length === 0) return null;

  return <div className={`${styles.switch} ${small ? styles.switchSmall : ''}`}>
    {data.map(({ text, value, iconLink }) => <span key={value} onClick={() => setCurrentValue(value)} className={`${styles.switchItem} ${currentValue === value ? styles.switchActive : ""}`}>{iconLink && <img src={iconLink} style={{ background: "#fff", height: '1em' }} alt={text} />}{text}</span>)}
  </div>
}
