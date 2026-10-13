import { describe, expect, it } from 'vitest';
import source from '../../gemini-code-1782728297042.html?raw';
import { CHARACTERS } from '../src/opening-characters';

describe('六人开局资料', () => {
  it('稳定编号与初始阵营正确', () => {
    expect(CHARACTERS.map(({ id, initialFactionId }) => [id, initialFactionId])).toEqual([
      ['lan-wangji', 'S'], ['wei-wuxian', 'D'], ['wen-ruohan', 'J'],
      ['jin-guangyao', 'B'], ['gao-zhan', 'B'], ['cao-wenhao', 'B'],
    ]);
    expect(new Set(CHARACTERS.map(({ id }) => id)).size).toBe(6);
  });

  it('六人简述、塔罗及正逆位与旧 HTML 原文一致', () => {
    for (const character of CHARACTERS) {
      const oldName = character.name === '曹文浩' ? '曹文豪' : character.name;
      const row = source.split('\n').find(line => line.includes(`name: "${oldName}"`));
      expect(row, `${character.name} 原文条目`).toBeDefined();
      expect(row).toContain(`bio: "${character.description}"`);
      const tarotInSource = row?.match(/tarotName: "([^"]+)"/)?.[1];
      expect(tarotInSource?.toLocaleLowerCase()).toBe(`${character.tarot} (${character.tarotEnglish})`.toLocaleLowerCase());
      expect(row).toContain(`isReversed: ${character.orientation === '逆位'}`);
    }
  });
});
