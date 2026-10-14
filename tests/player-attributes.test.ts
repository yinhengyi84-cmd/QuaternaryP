import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../src/opening-characters';
import { FACTION_AXES, INITIAL_FACTION_ATTRIBUTES, INITIAL_ROLE_ATTRIBUTES, ROLE_AXES, initialAttributesFor, parsePlayerAttributesSnapshot } from '../src/player-attributes';
import { RADAR_CENTER, radarPoint, radarVertices } from '../src/attributes-radar';

describe('八维初值与接口校验', () => {
  it('全部初值与 Word 中两张表的独立摘录一致', () => {
    const roleRows = [
      [15, 9, 15, 17], [10, 13, 13, 9], [11, 14, 9, 5],
      [11, 14, 4, 8], [3, 16, 14, 13], [0, 12, 19, 2],
    ];
    expect(CHARACTERS.map(character => ROLE_AXES.map(axis => INITIAL_ROLE_ATTRIBUTES[character.id][axis.key]))).toEqual(roleRows);
    expect((['S', 'D', 'J', 'B', 'Q', 'P'] as const).map(id => FACTION_AXES.map(axis => INITIAL_FACTION_ATTRIBUTES[id][axis.key]))).toEqual([
      [11, 13, 8, 11], [8, 10, 9, 11], [13, 14, 7, 14],
      [7, 4, 5, 9], [6, 6, 15, 7], [6, 6, 10, 8],
    ]);
  });

  it('每个角色获取开局阵营，快照修改不回写模板或其他同阵营角色', () => {
    for (const character of CHARACTERS) {
      expect(initialAttributesFor(character.id).currentFactionId).toBe(character.initialFactionId);
    }
    const snapshot = initialAttributesFor('jin-guangyao');
    snapshot.role.power = 20;
    if (snapshot.faction) snapshot.faction.economy = 20;
    expect(initialAttributesFor('jin-guangyao').role.power).toBe(11);
    expect(initialAttributesFor('gao-zhan').faction?.economy).toBe(7);
  });

  it('零、二十与无阵营合法，接收的数值复制成独立快照', () => {
    const snapshot = initialAttributesFor('cao-wenhao');
    snapshot.role.wisdom = 20;
    const parsed = parsePlayerAttributesSnapshot(snapshot);
    expect(parsed?.role.power).toBe(0);
    expect(parsed?.role.wisdom).toBe(20);
    snapshot.role.wisdom = 1;
    expect(parsed?.role.wisdom).toBe(20);
    expect(parsePlayerAttributesSnapshot({ ...snapshot, currentFactionId: null, faction: null })?.faction).toBeNull();
    expect(parsePlayerAttributesSnapshot(null)).toBeNull();
  });

  it.each([-1, 21, NaN, Infinity, '15', undefined])('拒绝非法值 %s，不夹取或变成零', value => {
    const snapshot = initialAttributesFor('lan-wangji');
    expect(() => parsePlayerAttributesSnapshot({ ...snapshot, role: { ...snapshot.role, power: value } })).toThrow();
  });

  it('拒绝无效身份、版本以及不完整的阵营状态', () => {
    const snapshot = initialAttributesFor('lan-wangji');
    for (const override of [
      { characterId: 'unknown' }, { currentFactionId: 'unknown' }, { version: -1 },
      { version: 1.5 }, { faction: null }, { currentFactionId: null }, { role: {} },
    ]) expect(() => parsePlayerAttributesSnapshot({ ...snapshot, ...override })).toThrow();
  });
});

describe('八边形几何', () => {
  it('上下各四轴严格从左到右，外圈连线连续转过八个 45 度', () => {
    const upper = ROLE_AXES.map(axis => radarPoint(20, axis.angle));
    const lower = FACTION_AXES.map(axis => radarPoint(20, axis.angle));
    expect(upper.every(point => point.y < RADAR_CENTER.y)).toBe(true);
    expect(lower.every(point => point.y > RADAR_CENTER.y)).toBe(true);
    for (const points of [upper, lower]) {
      expect(points.slice(1).every((point, index) => point.x > points[index].x)).toBe(true);
    }
    const vertices = radarVertices(initialAttributesFor('lan-wangji'));
    for (let index = 0; index < vertices.length; index++) {
      const difference = (vertices[(index + 1) % 8].angle - vertices[index].angle + 360) % 360;
      expect(difference).toBe(45);
    }
  });

  it('权力零分位于圆心，无阵营保留空值而非伪造零分', () => {
    const snapshot = initialAttributesFor('cao-wenhao');
    expect(radarVertices(snapshot).find(point => point.key === 'power')).toMatchObject({ ...RADAR_CENTER, value: 0 });
    const lower = radarVertices({ ...snapshot, currentFactionId: null, faction: null }).filter(point => point.group === 'faction');
    expect(lower.every(point => point.value === null && point.x === RADAR_CENTER.x && point.y === RADAR_CENTER.y)).toBe(true);
  });
});
