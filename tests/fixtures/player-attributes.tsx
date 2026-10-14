import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PlayPrototype from '../../src/PlayPrototype';
import { previewChooseGateway } from '../../src/opening-assignment';
import { initialAttributesFor, type PlayerAttributesGateway, type PlayerAttributesSnapshot } from '../../src/player-attributes';
import '../../src/style.css';
import { usePlaySession } from '../../src/usePlaySession';

const options = new URLSearchParams(window.location.search);
let fail = options.has('fail');
let snapshot = initialAttributesFor('lan-wangji');
const listeners = new Set<(next: PlayerAttributesSnapshot) => void>();
const reads = new Set<(next: PlayerAttributesSnapshot) => void>();

const gateway: PlayerAttributesGateway = {
  async load() {
    if (fail) throw new Error('模拟八维资料加载失败');
    if (options.has('deferred')) return new Promise(resolve => reads.add(resolve));
    return snapshot;
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

// 测试入口只在此独立页面存在，不在正式应用暴露模拟修改按钮。
window.addEventListener('fixture:attributes', event => {
  snapshot = (event as CustomEvent<PlayerAttributesSnapshot>).detail;
  listeners.forEach(listener => listener(snapshot));
});
window.addEventListener('fixture:load', event => {
  reads.forEach(resolve => resolve((event as CustomEvent<PlayerAttributesSnapshot>).detail));
  reads.clear();
});
window.addEventListener('fixture:recover', () => { fail = false; });

const opening = await previewChooseGateway.load();
if (opening.assignedCharacterId !== 'lan-wangji') {
  await previewChooseGateway.requestChoice({ characterId: 'lan-wangji', expectedVersion: opening.version, requestId: 'fixture' });
}
function FixturePlay() {
  const session = usePlaySession('lan-wangji');
  return <PlayPrototype session={session} data={null} geometry={null} water={null} cityData={null} error="" onRetry={() => {}} onOpenAtlas={() => {}} attributesGateway={gateway} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FixturePlay />
  </StrictMode>,
);
