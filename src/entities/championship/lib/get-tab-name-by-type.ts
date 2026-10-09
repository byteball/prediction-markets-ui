import i18n from "@/shared/i18n";
import { capitalizeFirstLetter } from "@/shared/lib/capitalize-first-letter";

export const getTabNameByType = (type: string): string => {
  const emoji = getEmojiByType(type);
  let nameView = getSportNameByType(type);

  nameView = capitalizeFirstLetter(nameView);

  return `${emoji} ${nameView}`;
}

export const getEmojiByType = (type: string): string => {
  if (type === 'soccer') return '⚽';

  return '';
}

export const getSportNameByType = (type: string): string => {
  let name = type;

  if (type === 'soccer') {
    name = i18n.t('common.soccer', 'soccer');
  }

  return name;
}
