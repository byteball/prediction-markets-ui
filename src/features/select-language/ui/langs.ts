import { LANGUAGE_CODES, type LanguageCode } from "@/shared/config/langs";

import usa from "./flags/usa.svg";
import es from "./flags/es.svg";
import br from "./flags/br.svg";
import cn from "./flags/cn.svg";
import ru from "./flags/ru.svg";
import ua from "./flags/ua.svg";

const flags: Record<LanguageCode, string> = { en: usa, zh: cn, es, pt: br, ru, uk: ua };

export const langs = LANGUAGE_CODES.map((name) => ({ name, flag: flags[name] }));
