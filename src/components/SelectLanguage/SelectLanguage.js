import React from "react";
import { Select } from "antd";
import { useDispatch, useSelector } from "react-redux";

import { changeLanguage } from "store/slices/settingsSlice";

import usa from "./flags/usa.svg"
import es from "./flags/es.svg";
import br from "./flags/br.svg";
import cn from "./flags/cn.svg";
import ru from "./flags/ru.svg";
import ua from "./flags/ua.svg";

export const langs = [
  {
    name: "en",
    flag: usa
  },
  {
    name: "zh",
    flag: cn
  },
  {
    name: "es",
    flag: es
  },
  {
    name: "pt",
    flag: br
  },
  {
    name: "ru",
    flag: ru
  },
  {
    name: "uk",
    flag: ua
  },
];

export const SelectLanguage = ({ action }) => {
  const { lang } = useSelector((state) => state.settings);
  const dispatch = useDispatch();

  return (
    <Select virtual style={{ width: "100%" }} dropdownStyle={{ margin: 20 }} bordered={false} value={lang || "en"} size="large" onChange={(value) => {
      if (action) action();

      dispatch(changeLanguage(value));
    }}>
      {langs.map((lang) => <Select.Option key={lang.name} style={{ paddingLeft: 20, paddingRight: 20 }} value={lang.name}><a href={`/${lang.name}`} style={{pointerEvents: "none"}}><img alt={lang.name} src={lang.flag} style={{ border: "1px solid #ddd" }} width="30" /></a></Select.Option>)}
    </Select>
  )
}