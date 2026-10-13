import { describe, expect, it } from 'vitest';
import { CHARACTERS, characterById } from '../src/opening-characters';
import source from './fixtures/old-html-six-roles.json';

describe('六人开局资料', () => {
  it('稳定编号与初始阵营正确', () => {
    expect(CHARACTERS.map(({ id, initialFactionId }) => [id, initialFactionId])).toEqual([
      ['lan-wangji', 'S'], ['wei-wuxian', 'D'], ['wen-ruohan', 'J'],
      ['jin-guangyao', 'B'], ['gao-zhan', 'B'], ['cao-wenhao', 'B'],
    ]);
    expect(new Set(CHARACTERS.map(({ id }) => id)).size).toBe(6);
  });

  it('六人简述、塔罗及正逆位与已核对的旧 HTML 摘录一致', () => {
    expect(CHARACTERS).toHaveLength(source.characters.length);
    for (const original of source.characters) {
      const character = characterById(original.id);
      expect(character, `${original.originalName} 条目`).not.toBeNull();
      expect(character?.name).toBe(original.originalName === '曹文豪' ? '曹文浩' : original.originalName);
      expect(character?.tarot).toBe(original.tarot);
      expect(character?.tarotEnglish).toBe(original.tarotEnglish);
      expect(character?.orientation).toBe(original.orientation);
      expect(character?.description).toBe(original.description);
    }
  });
});
