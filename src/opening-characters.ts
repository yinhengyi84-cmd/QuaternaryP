export const CHARACTERS = [
  {
    id: 'lan-wangji', name: '蓝忘机', roman: 'IV', tarot: '皇帝', tarotEnglish: 'THE EMPEROR', orientation: '逆位',
    description: '苏维埃最高极权统帅。依靠致幻剂篡改记忆的伪神，陷入病态的独裁之中。',
    accent: '#9bb7c7', symbol: 'crown',
  },
  {
    id: 'wei-wuxian', name: '魏无羡', roman: '0', tarot: '愚者', tarotEnglish: 'THE FOOL', orientation: '正位',
    description: '德意志二号人物。无法被预知的量子态自由幽灵，悬崖边起舞的帝国复兴者。',
    accent: '#d7b589', symbol: 'wanderer',
  },
  {
    id: 'wen-ruohan', name: '温若寒', roman: 'XV', tarot: '恶魔', tarotEnglish: 'THE DEVIL', orientation: '正位',
    description: '日本天皇。占据青岛港，轻浮狂妄却掌握着足以掀翻牌桌的海上力量。',
    accent: '#c88b8c', symbol: 'horns',
  },
  {
    id: 'jin-guangyao', name: '金光瑶', roman: 'XII', tarot: '倒吊人', tarotEnglish: 'THE HANGED MAN', orientation: '正位',
    description: '被生擒的拜占庭苏丹。看透权力的虚无，甘为高尚理想受难的殉道者。',
    accent: '#cdb888', symbol: 'suspended',
  },
  {
    id: 'gao-zhan', name: '高战', roman: 'VII', tarot: '战车', tarotEnglish: 'THE CHARIOT', orientation: '逆位',
    description: '拜占庭前战神。因处决圣女而从神坛跌落，但残存的军中旧部仍是一股暗流。',
    accent: '#8eaea2', symbol: 'chariot',
  },
  {
    id: 'cao-wenhao', name: '曹文浩', roman: 'XVI', tarot: '高塔', tarotEnglish: 'THE TOWER', orientation: '正位',
    description: '被软禁的拜占庭伞兵将军。遭遇政治骤变，随时处于精神崩溃的边缘。',
    accent: '#b4a3bf', symbol: 'tower',
  },
] as const;

export type CharacterId = typeof CHARACTERS[number]['id'];
export type CharacterProfile = typeof CHARACTERS[number];

export function characterById(id: string | null): CharacterProfile | null {
  return CHARACTERS.find(character => character.id === id) ?? null;
}
