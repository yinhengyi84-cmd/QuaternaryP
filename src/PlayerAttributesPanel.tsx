import AttributesRadar from './AttributesRadar';
import { factionOf } from './atlas';
import { characterById } from './opening-characters';
import { FACTION_AXES, ROLE_AXES, previewAttributesGateway, type PlayerAttributesGateway } from './player-attributes';
import { usePlayerAttributes } from './usePlayerAttributes';
import './player-attributes.css';

export default function PlayerAttributesPanel({ gateway = previewAttributesGateway }: { gateway?: PlayerAttributesGateway }) {
  const { snapshot, loading, error, retry } = usePlayerAttributes(gateway);
  const character = characterById(snapshot?.characterId ?? null);
  const faction = snapshot?.currentFactionId ? factionOf(snapshot.currentFactionId) : null;

  return (
    <section className="play-card player-attributes-card" aria-label="我的八维" aria-busy={loading}>
      <div className="play-card-heading">
        <div><span className="play-index">05 / ATTRIBUTES</span><h2>我的八维</h2></div>
        <span className="attributes-scale">0—20</span>
      </div>
      {error && (
        <div className="attributes-error" role="alert">
          <span>{error}{snapshot && ' 下方保留最近一次有效资料。'}</span>
          <button type="button" onClick={retry}>重新加载八维</button>
        </div>
      )}
      {loading && !snapshot && <p className="attributes-empty" role="status">正在读取你的八维资料…</p>}
      {!loading && !error && !snapshot && (
        <div className="attributes-empty">
          <p>选择角色后，这里会显示你的八维。</p>
          <a href="#/opening">开局选角色</a>
        </div>
      )}
      {snapshot && character && (
        <div className="attributes-content">
          <figure className="attributes-figure">
            <AttributesRadar snapshot={snapshot} />
            <figcaption><span className="attributes-key-role">角色自身</span><span className="attributes-key-faction">当前阵营</span></figcaption>
          </figure>
          <div className="attributes-groups">
            <section className="attributes-group attributes-group-role" aria-label="角色自身四维">
              <div className="attributes-group-heading"><h3>角色自身</h3><strong>{character.name}</strong></div>
              <dl>{ROLE_AXES.map(axis => <div key={axis.key} data-attribute={axis.key}><dt>{axis.label}</dt><dd>{snapshot.role[axis.key]}</dd></div>)}</dl>
            </section>
            <section className="attributes-group attributes-group-faction" aria-label="当前阵营四维">
              <div className="attributes-group-heading"><h3>当前阵营</h3><strong>{faction?.name ?? '暂无所属阵营'}</strong></div>
              <dl>{FACTION_AXES.map(axis => <div key={axis.key} data-attribute={axis.key}><dt>{axis.label}</dt><dd>{snapshot.faction?.[axis.key] ?? '—'}</dd></div>)}</dl>
            </section>
            <p className="attributes-note">角色自身与当前阵营分别记录。数值随对局进展更新。</p>
          </div>
        </div>
      )}
    </section>
  );
}
