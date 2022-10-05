import i18n from "locale"

export const getCategoryName = (key) => {
  if (key === 'currency') {
    return i18n.t("common.currency", "Currency");
  } else if (key === 'sport') {
    return i18n.t("common.sport", "sport");
  } else if (key === 'misc') {
    return i18n.t("common.misc", "Misc");
  } else {
    return key;
  }
}