import { characterById, type CharacterId } from './opening-characters';
import { readPreviewCharacterId } from './opening-assignment';
import { FACTIONS } from './atlas';
import type { FactionId } from './types';

export type RoleAttributes = {
  power: number;
  charisma: number;
  wisdom: number;
  conviction: number;
};

export type FactionAttributes = {
  economy: number;
  military: number;
  welfare: number;
  technology: number;
};

// 开局模板来自《剧情/人物八维.docx》，运行时数值不得回写这些模板。
export const INITIAL_ROLE_ATTRIBUTES: Readonly<Record<CharacterId, Readonly<RoleAttributes>>> = {
  'lan-wangji': { power: 15, charisma: 9, wisdom: 15, conviction: 17 },
  'wei-wuxian': { power: 10, charisma: 13, wisdom: 13, conviction: 9 },
  'wen-ruohan': { power: 11, charisma: 14, wisdom: 9, conviction: 5 },
  'jin-guangyao': { power: 11, charisma: 14, wisdom: 4, conviction: 8 },
  'gao-zhan': { power: 3, charisma: 16, wisdom: 14, conviction: 13 },
  'cao-wenhao': { power: 0, charisma: 12, wisdom: 19, conviction: 2 },
};

export const INITIAL_FACTION_ATTRIBUTES: Readonly<Record<FactionId, Readonly<FactionAttributes>>> = {
  S: { economy: 11, military: 13, welfare: 8, technology: 11 },
  D: { economy: 8, military: 10, welfare: 9, technology: 11 },
  J: { economy: 13, military: 14, welfare: 7, technology: 14 },
  B: { economy: 7, military: 4, welfare: 5, technology: 9 },
  Q: { economy: 6, military: 6, welfare: 15, technology: 7 },
  P: { economy: 6, military: 6, welfare: 10, technology: 8 },
};

export type PlayerAttributesSnapshot = {
  characterId: CharacterId;
  currentFactionId: FactionId | null;
  role: RoleAttributes;
  faction: FactionAttributes | null;
  version: number;
};

export interface PlayerAttributesGateway {
  load(): Promise<PlayerAttributesSnapshot | null>;
  subscribe?(onSnapshot: (snapshot: PlayerAttributesSnapshot) => void): () => void;
}

export const ROLE_AXES = [
  { key: 'power', label: '权力', angle: -157.5, group: 'role' },
  { key: 'charisma', label: '魅力', angle: -112.5, group: 'role' },
  { key: 'wisdom', label: '智慧', angle: -67.5, group: 'role' },
  { key: 'conviction', label: '信念', angle: -22.5, group: 'role' },
] as const;

export const FACTION_AXES = [
  { key: 'economy', label: '经济', angle: 157.5, group: 'faction' },
  { key: 'military', label: '军力', angle: 112.5, group: 'faction' },
  { key: 'welfare', label: '民生', angle: 67.5, group: 'faction' },
  { key: 'technology', label: '科技', angle: 22.5, group: 'faction' },
] as const;

// 多边形沿外圈连接；下方数字列表仍按从左至右排列。
export const RADAR_AXES = [...ROLE_AXES, ...[...FACTION_AXES].reverse()];

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('八维资料格式不正确，请重新加载。');
  }
  return value as Record<string, unknown>;
}

function readAttributes<K extends string>(value: unknown, keys: readonly K[]): Record<K, number> {
  const source = objectValue(value);
  const result = {} as Record<K, number>;
  for (const key of keys) {
    const score = source[key];
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 20) {
      throw new Error('八维数值必须是 0—20 的有效数字，请重新加载。');
    }
    result[key] = score;
  }
  return result;
}

// 在接口边界校验并复制快照，避免外部对象被修改后影响已显示的结果。
export function parsePlayerAttributesSnapshot(value: unknown): PlayerAttributesSnapshot | null {
  if (value === null) return null;
  const source = objectValue(value);
  const character = characterById(typeof source.characterId === 'string' ? source.characterId : null);
  if (!character) throw new Error('八维资料中的角色编号无效。');
  const factionId = source.currentFactionId;
  if (factionId !== null && !FACTIONS.some(faction => faction.id === factionId)) {
    throw new Error('八维资料中的阵营编号无效。');
  }
  if (!Number.isSafeInteger(source.version) || (source.version as number) < 0) {
    throw new Error('八维资料版本无效。');
  }
  if ((factionId === null) !== (source.faction === null)) {
    throw new Error('当前阵营与阵营四维资料不一致。');
  }
  return {
    characterId: character.id,
    currentFactionId: factionId as FactionId | null,
    role: readAttributes(source.role, ROLE_AXES.map(axis => axis.key)),
    faction: source.faction === null ? null : readAttributes(source.faction, FACTION_AXES.map(axis => axis.key)),
    version: source.version as number,
  };
}

export function initialAttributesFor(characterId: CharacterId): PlayerAttributesSnapshot {
  const character = characterById(characterId);
  if (!character) throw new Error('角色编号无效。');
  return {
    characterId,
    currentFactionId: character.initialFactionId,
    role: { ...INITIAL_ROLE_ATTRIBUTES[characterId] },
    faction: { ...INITIAL_FACTION_ATTRIBUTES[character.initialFactionId] },
    version: 0,
  };
}

// 正式房间只需替换此适配器；预览沿用同一份开局身份，不另存人物或八维。
export const previewAttributesGateway: PlayerAttributesGateway = {
  async load() {
    const characterId = readPreviewCharacterId();
    return characterId ? initialAttributesFor(characterId) : null;
  },
};
