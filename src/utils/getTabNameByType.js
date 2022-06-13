export const getTabNameByType = type => {
  const name = type.charAt(0).toUpperCase() + type.slice(1);
  let emoji = getEmojiByType(type);

  return `${emoji} ${name}`
}
export const getEmojiByType = type => {
  if (type === 'soccer') return '⚽';
  
  return '';
}