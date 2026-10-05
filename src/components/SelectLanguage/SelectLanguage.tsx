import { useDispatch, useSelector } from "react-redux";

import { changeLanguage, selectLanguage } from "store/slices/settingsSlice";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { langs } from "./langs";

const Flag = ({ name, flag }: { name: string; flag: string }) => <img alt={name} src={flag} style={{ border: "1px solid #ddd" }} width="30" height="20" className="block" />;

type SelectLanguageProps = {
  action?: () => void;
};

export const SelectLanguage = ({ action }: SelectLanguageProps) => {
  const lang: string | undefined | null = useSelector(selectLanguage);
  const dispatch = useDispatch();
  const current = langs.find((l) => l.name === (lang || "en")) ?? langs[0];

  return (
    <Select
      value={lang || "en"}
      onValueChange={(value) => {
        if (action) action();

        dispatch(changeLanguage(value));
      }}
    >
      <SelectTrigger aria-label="Language" className="h-10 w-auto gap-2 border-0 bg-transparent px-2 shadow-none dark:bg-transparent">
        <SelectValue>
          <Flag name={current.name} flag={current.flag} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {langs.map((item) => (
          <SelectItem key={item.name} value={item.name} className="px-5">
            {/* The href keeps crawlable links to every language, as the antd version did (pointer events are off). */}
            <a href={`/${item.name}`} style={{ pointerEvents: "none" }} tabIndex={-1}>
              <Flag name={item.name} flag={item.flag} />
            </a>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
