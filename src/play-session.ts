import type { CharacterId } from './opening-characters';

export type PlayStage = 'draft' | 'submitted' | 'locked' | 'resolved';
export type PlaySessionState = {
  identityKey: string;
  characterId: CharacterId | null;
  selectedId: string | null;
  focus: { id: string; nonce: number } | null;
  mapOpen: boolean;
  query: string;
  action: string;
  stage: PlayStage;
  die: number | null;
  lockAt: number | null;
  resolveAt: number | null;
};

export type PlaySessionAction =
  | { type: 'reset'; characterId: CharacterId | null; identityKey: string }
  | { type: 'edit'; action: string }
  | { type: 'search'; query: string }
  | { type: 'select'; id: string; now: number }
  | { type: 'toggle-map' }
  | { type: 'submit'; now: number }
  | { type: 'revoke' }
  | { type: 'roll'; die: number; now: number; duration: number }
  | { type: 'advance'; now: number };

export function createPlaySession(characterId: CharacterId | null, identityKey: string): PlaySessionState {
  return { characterId, identityKey, selectedId: null, focus: null, mapOpen: true, query: '', action: '', stage: 'draft', die: null, lockAt: null, resolveAt: null };
}

// 原型流程的变更统一经过纯函数；正式版将由服务端返回对应状态。
export function playSessionReducer(state: PlaySessionState, event: PlaySessionAction): PlaySessionState {
  switch (event.type) {
    case 'reset':
      return state.identityKey === event.identityKey ? state : createPlaySession(event.characterId, event.identityKey);
    case 'edit':
      return state.stage === 'draft' ? { ...state, action: event.action } : state;
    case 'search':
      return state.stage === 'draft' ? { ...state, query: event.query } : state;
    case 'select':
      return state.stage === 'draft' ? { ...state, selectedId: event.id, query: '', focus: { id: event.id, nonce: event.now } } : state;
    case 'toggle-map':
      return { ...state, mapOpen: !state.mapOpen };
    case 'submit':
      return state.characterId && state.stage === 'draft' && state.action.trim()
        ? { ...state, stage: 'submitted', lockAt: event.now + 3000 } : state;
    case 'revoke':
      return state.stage === 'submitted' ? { ...state, stage: 'draft', lockAt: null } : state;
    case 'roll':
      return state.stage === 'locked' && state.die === null
        ? { ...state, die: event.die, resolveAt: event.now + event.duration } : state;
    case 'advance':
      if (state.stage === 'submitted' && state.lockAt !== null && event.now >= state.lockAt) {
        return { ...state, stage: 'locked', lockAt: null };
      }
      if (state.stage === 'locked' && state.die !== null && state.resolveAt !== null && event.now >= state.resolveAt) {
        return { ...state, stage: 'resolved', resolveAt: null };
      }
      return state;
  }
}

export type PlaySessionController = {
  state: PlaySessionState;
  editAction: (action: string) => void;
  search: (query: string) => void;
  select: (id: string) => void;
  toggleMap: () => void;
  submit: () => void;
  revoke: () => void;
  roll: () => boolean;
};
