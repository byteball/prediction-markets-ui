import { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';

import styles from "./SwitchActions.module.css";

export const SwitchActions = memo(({ data = [], value, onChange, small = false, linked = false }) => {
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
  
  const handleSwitch = (e, value) => {
    e.preventDefault();

    setCurrentValue(value);
  }

  const Wrapper = linked ? Link : 'span';

  return <div className={`${styles.switch} ${small ? styles.switchSmall : ''}`}>
    {data.map(({ text, value, iconLink, url }) => <Wrapper to={linked ? url : undefined} key={value} onClick={(e) => handleSwitch(e, value)} className={`${styles.switchItem} ${currentValue === value ? styles.switchActive : ""}`}>{iconLink && <img src={iconLink} style={{ background: "#fff", height: '1em' }} alt={text} />}{text}</Wrapper>)}
  </div>
});
