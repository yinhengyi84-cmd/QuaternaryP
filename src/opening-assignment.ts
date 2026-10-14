import { CHARACTERS, characterById, type CharacterId } from './opening-characters';

export type OpeningMode = 'choose' | 'draw';
export type OpeningStage = 'waiting-turn' | 'choosing' | 'pending-dm' | 'assigned';

export type OpeningSnapshot = {
  source: 'preview' | 'room';
  mode: OpeningMode;
  stage: OpeningStage;
  roomId: string | null;
  seatNumber: number | null;
  isMyTurn: boolean;
  availableCharacterIds: readonly CharacterId[];
  assignedCharacterId: CharacterId | null;
  version: number;
};

export type ChoiceRequest = {
  characterId: CharacterId;
  expectedVersion: number;
  requestId: string;
};

export type DrawRequest = {
  expectedVersion: number;
  requestId: string;
};

export interface OpeningAssignmentGateway {
  load(): Promise<OpeningSnapshot>;
  requestChoice(request: ChoiceRequest): Promise<OpeningSnapshot>;
  requestDraw(request: DrawRequest): Promise<OpeningSnapshot>;
  subscribe?(onChange: (snapshot: OpeningSnapshot) => void): () => void;
}

export function createOpeningRequestId(): string {
  // 局域网 HTTP 页面也能使用 getRandomValues，不依赖安全上下文中的 randomUUID。
  const bytes = new Uint32Array(4);
  window.crypto.getRandomValues(bytes);
  return [...bytes].map(value => value.toString(16).padStart(8, '0')).join('');
}

type PreviewAssignment = { mode: OpeningMode; assignedCharacterId: CharacterId | null };
const PREVIEW_KEY = 'modaozushi.opening.preview.v2';
const PREVIEW_CHANGED = 'modaozushi:opening-changed';
let previewRevision = 0;

export const getPreviewAssignmentRevision = () => previewRevision;

export function subscribePreviewAssignment(onChange: () => void): () => void {
  window.addEventListener(PREVIEW_CHANGED, onChange);
  return () => window.removeEventListener(PREVIEW_CHANGED, onChange);
}

export function readPreviewAssignment(): PreviewAssignment | null {
  try {
    const saved = window.sessionStorage.getItem(PREVIEW_KEY);
    if (!saved) return null;
    const value: unknown = JSON.parse(saved);
    if (!value || typeof value !== 'object') return null;
    const assignment = value as Partial<PreviewAssignment>;
    if (assignment.mode !== 'choose' && assignment.mode !== 'draw') return null;
    if (assignment.assignedCharacterId !== null && !characterById(assignment.assignedCharacterId ?? null)) return null;
    return { mode: assignment.mode, assignedCharacterId: assignment.assignedCharacterId ?? null };
  } catch {
    return null;
  }
}

export function readPreviewCharacterId(): CharacterId | null {
  return readPreviewAssignment()?.assignedCharacterId ?? null;
}

function savePreviewAssignment(assignment: PreviewAssignment): void {
  try {
    window.sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(assignment));
  } catch {
    // 浏览器禁用会话存储时，当前页面仍能完成一次预览。
  }
  // 同一窗口的 sessionStorage 不会触发 storage 事件，主动通知游玩状态。
  previewRevision += 1;
  window.dispatchEvent(new Event(PREVIEW_CHANGED));
}

export function clearPreviewAssignment(mode: OpeningMode): void {
  savePreviewAssignment({ mode, assignedCharacterId: null });
}

function previewSnapshot(mode: OpeningMode): OpeningSnapshot {
  const saved = readPreviewAssignment();
  const assignedCharacterId = saved?.mode === mode ? saved.assignedCharacterId : null;
  return {
    source: 'preview', mode, stage: assignedCharacterId ? 'assigned' : 'choosing',
    roomId: null, seatNumber: null, isMyTurn: true,
    availableCharacterIds: CHARACTERS.map(character => character.id),
    assignedCharacterId, version: assignedCharacterId ? 1 : 0,
  };
}

function assertReady(snapshot: OpeningSnapshot, expectedVersion: number): void {
  if (snapshot.stage !== 'choosing' || snapshot.version !== expectedVersion) {
    throw new Error('开局状态已变化，请刷新页面后重试。');
  }
}

function drawCharacter(ids: readonly CharacterId[]): CharacterId {
  if (!ids.length) throw new Error('可抽取的角色已用完。');
  // 拒绝超出整除范围的随机数，避免取模偏差；正式房间必须改由服务端抽取。
  const range = 0x100000000;
  const limit = range - (range % ids.length);
  const sample = new Uint32Array(1);
  do {
    window.crypto.getRandomValues(sample);
  } while (sample[0] >= limit);
  return ids[sample[0] % ids.length];
}

// 两种本地预览共用一份身份记录；正式房间通过 HTTP/WebSocket 适配同一接口。
export function createPreviewOpeningGateway(mode: OpeningMode): OpeningAssignmentGateway {
  return {
    async load() {
      if (readPreviewAssignment()?.mode !== mode) clearPreviewAssignment(mode);
      return previewSnapshot(mode);
    },
    async requestChoice({ characterId, expectedVersion }) {
      if (mode !== 'choose') throw new Error('此房间不允许自主选择。');
      const snapshot = previewSnapshot(mode);
      assertReady(snapshot, expectedVersion);
      if (!snapshot.availableCharacterIds.includes(characterId)) throw new Error('此角色目前不可选。');
      savePreviewAssignment({ mode, assignedCharacterId: characterId });
      return { ...snapshot, stage: 'assigned', assignedCharacterId: characterId, version: snapshot.version + 1 };
    },
    async requestDraw({ expectedVersion }) {
      if (mode !== 'draw') throw new Error('此房间不允许抽取。');
      const snapshot = previewSnapshot(mode);
      assertReady(snapshot, expectedVersion);
      const assignedCharacterId = drawCharacter(snapshot.availableCharacterIds);
      savePreviewAssignment({ mode, assignedCharacterId });
      return { ...snapshot, stage: 'assigned', assignedCharacterId, version: snapshot.version + 1 };
    },
  };
}

export const previewChooseGateway = createPreviewOpeningGateway('choose');
export const previewDrawGateway = createPreviewOpeningGateway('draw');
