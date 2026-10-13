import { createRoot } from 'react-dom/client';
import ChooseCharacter from '../../src/ChooseCharacter';
import OpeningDraw from '../../src/OpeningDraw';
import { CHARACTERS, type CharacterId } from '../../src/opening-characters';
import type { OpeningAssignmentGateway, OpeningMode, OpeningSnapshot } from '../../src/opening-assignment';
import '../../src/style.css';

const mode: OpeningMode = new URLSearchParams(window.location.search).get('mode') === 'draw' ? 'draw' : 'choose';
let snapshot: OpeningSnapshot = {
  source: 'room', mode, stage: 'waiting-turn', roomId: 'test-room', seatNumber: 2,
  isMyTurn: false,
  availableCharacterIds: mode === 'draw' ? ['wei-wuxian'] : CHARACTERS.filter(character => character.id !== 'lan-wangji').map(character => character.id),
  assignedCharacterId: null, version: 1,
};
let pendingChoice: CharacterId | null = null;
const listeners = new Set<(next: OpeningSnapshot) => void>();

function publish(next: OpeningSnapshot): OpeningSnapshot {
  snapshot = next;
  for (const listener of listeners) listener(snapshot);
  return snapshot;
}

const gateway: OpeningAssignmentGateway = {
  async load() { return snapshot; },
  async requestChoice({ characterId, expectedVersion }) {
    if (snapshot.stage !== 'choosing' || expectedVersion !== snapshot.version || !snapshot.availableCharacterIds.includes(characterId)) {
      throw new Error('角色不可选或状态已变化。');
    }
    if (characterId === 'gao-zhan') {
      publish({ ...snapshot, availableCharacterIds: snapshot.availableCharacterIds.filter(id => id !== characterId), version: snapshot.version + 1 });
      throw new Error('高战刚被其他玩家占用。');
    }
    pendingChoice = characterId;
    return publish({ ...snapshot, stage: 'pending-dm', version: snapshot.version + 1 });
  },
  async requestDraw({ expectedVersion }) {
    if (snapshot.stage !== 'choosing' || expectedVersion !== snapshot.version) throw new Error('尚未轮到你。');
    return publish({ ...snapshot, stage: 'assigned', assignedCharacterId: 'wei-wuxian', version: snapshot.version + 1 });
  },
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
};

window.addEventListener('fixture:advance', () => publish({ ...snapshot, stage: 'choosing', isMyTurn: true, version: snapshot.version + 1 }));
window.addEventListener('fixture:approve', () => {
  if (pendingChoice) publish({ ...snapshot, stage: 'assigned', assignedCharacterId: pendingChoice, version: snapshot.version + 1 });
});

createRoot(document.getElementById('room-test-root')!).render(
  mode === 'draw' ? <OpeningDraw gateway={gateway} /> : <ChooseCharacter gateway={gateway} />,
);
