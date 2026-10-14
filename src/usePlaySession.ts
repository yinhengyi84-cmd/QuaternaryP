import { useEffect, useReducer, useRef } from 'react';
import type { CharacterId } from './opening-characters';
import { createPlaySession, playSessionReducer, type PlaySessionController } from './play-session';

export function usePlaySession(characterId: CharacterId | null, revision = 0): PlaySessionController {
  const identityKey = `${revision}:${characterId ?? 'unassigned'}`;
  const [state, dispatch] = useReducer(playSessionReducer, undefined, () => createPlaySession(characterId, identityKey));
  const rollRequest = useRef<string | null>(null);

  // 身份变更在子页面渲染之前重置，包括重新选中相同角色的情况。
  if (state.identityKey !== identityKey) {
    rollRequest.current = null;
    dispatch({ type: 'reset', characterId, identityKey });
  }

  useEffect(() => {
    const deadline = state.stage === 'submitted' ? state.lockAt : state.resolveAt;
    if (deadline === null) return;
    const timer = window.setTimeout(() => dispatch({ type: 'advance', now: Date.now() }), Math.max(0, deadline - Date.now()));
    return () => window.clearTimeout(timer);
  }, [state.identityKey, state.stage, state.lockAt, state.resolveAt]);

  return {
    state,
    editAction: action => dispatch({ type: 'edit', action }),
    search: query => dispatch({ type: 'search', query }),
    select: id => dispatch({ type: 'select', id, now: Date.now() }),
    toggleMap: () => dispatch({ type: 'toggle-map' }),
    submit: () => dispatch({ type: 'submit', now: Date.now() }),
    revoke: () => dispatch({ type: 'revoke' }),
    roll: () => {
      if (state.stage !== 'locked' || state.die !== null || rollRequest.current === identityKey) return false;
      rollRequest.current = identityKey;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      dispatch({ type: 'roll', die: Math.floor(Math.random() * 20) + 1, now: Date.now(), duration: reduced ? 120 : 1850 });
      return true;
    },
  };
}
