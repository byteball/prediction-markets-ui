import i18n from "locale";
import { capitalizeFirstLetter } from "./capitalizeFirstLetter";

export const getTabNameByType = type => {
  let emoji = getEmojiByType(type);
  let nameView = getSportNameByType(type);

  nameView = capitalizeFirstLetter(nameView);

  return `${emoji} ${nameView}`;
}

export const getEmojiByType = type => {
  if (type === 'soccer') return '⚽';

  return '';
}

export const getSportNameByType = type => {
  let name = type;

  if (type === 'soccer') {
    name = i18n.t('common.soccer', 'soccer');
  }

  return name;
}