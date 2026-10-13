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
  requestDraw?(request: DrawRequest): Promise<OpeningSnapshot>;
  subscribe?(onChange: (snapshot: OpeningSnapshot) => void): () => void;
}

const PREVIEW_KEY = 'modaozushi.opening-choice.preview.v1';

export function readPreviewCharacterId(): CharacterId | null {
  try {
    const saved = window.sessionStorage.getItem(PREVIEW_KEY);
    return characterById(saved)?.id ?? null;
  } catch {
    return null;
  }
}

export function clearPreviewChoice(): void {
  try {
    window.sessionStorage.removeItem(PREVIEW_KEY);
  } catch {
    // 禁用会话存储时，页面仍可通过内存状态完成预览。
  }
}

function previewSnapshot(): OpeningSnapshot {
  const assignedCharacterId = readPreviewCharacterId();
  return {
    source: 'preview', mode: 'choose', stage: assignedCharacterId ? 'assigned' : 'choosing',
    roomId: null, seatNumber: null, isMyTurn: true,
    availableCharacterIds: CHARACTERS.map(character => character.id),
    assignedCharacterId, version: assignedCharacterId ? 1 : 0,
  };
}

// 此适配器只服务单机预览；正式房间替换为 HTTP/WebSocket 适配器。
export const previewOpeningGateway: OpeningAssignmentGateway = {
  async load() {
    return previewSnapshot();
  },
  async requestChoice({ characterId, expectedVersion }) {
    const snapshot = previewSnapshot();
    if (snapshot.stage !== 'choosing' || expectedVersion !== snapshot.version) {
      throw new Error('选角状态已变化，请刷新页面后重试。');
    }
    if (!characterById(characterId)) {
      throw new Error('角色编号无效。');
    }
    try {
      window.sessionStorage.setItem(PREVIEW_KEY, characterId);
    } catch {
      // 浏览器禁止存储时，由调用方维持本页已选状态。
    }
    return { ...snapshot, stage: 'assigned', assignedCharacterId: characterId, version: 1 };
  },
};
