import { useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Compass, Dice5, LockKeyhole, Search, Send, UserRound, X } from 'lucide-react';
import MapView from './MapView';
import Attribution from './Attribution';
import D20RollOverlay from './D20RollOverlay';
import InitialFactionBadge from './InitialFactionBadge';
import PlayerRoleDialog from './PlayerRoleDialog';
import PlayerAttributesPanel from './PlayerAttributesPanel';
import type { PlayerAttributesGateway } from './player-attributes';
import { characterById } from './opening-characters';
import type { PlaySessionController } from './play-session';
import { factionOf, searchAtlas } from './atlas';
import type { AtlasData, AtlasGeometry, CityData, Territory } from './types';
import './play.css';

type Props = {
  session: PlaySessionController;
  data: AtlasData | null;
  geometry: AtlasGeometry | null;
  water: AtlasGeometry | null;
  cityData: CityData | null;
  error: string;
  onRetry: () => void;
  onOpenAtlas: (territoryId?: string) => void;
  attributesGateway?: PlayerAttributesGateway;
};

// 判定数值只用于预览交互；正式对局由 DM 在服务端确认并保存。
const DC = 15;
const ROLE_MODIFIER = 2;
const SITUATION = 1;
const signed = (value: number) => `${value >= 0 ? '+' : ''}${value}`;

export default function PlayPrototype({ session, data, geometry, water, cityData, error, onRetry, onOpenAtlas, attributesGateway }: Props) {
  const { selectedId, focus, mapOpen, query, action, stage, die } = session.state;
  const previewCharacter = characterById(session.state.characterId);
  const [rollOpen, setRollOpen] = useState(false);
  const rollRevealed = stage === 'resolved';
  const [roleOpen, setRoleOpen] = useState(false);
  const roleButtonRef = useRef<HTMLButtonElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const selected = data?.territories.find(item => item.id === selectedId);
  const record = data?.records.find(item => item.code === selected?.recordIds[0]);
  const results = useMemo(() => data ? searchAtlas(data, query, cityData?.cities).filter(item => item.territory).slice(0, 6) : [], [data, cityData, query]);
  const total = die === null ? null : die + ROLE_MODIFIER + SITUATION;
  const success = total !== null && (die === 20 || (die !== 1 && total >= DC));
  const outcome = die === 20 ? '大成功' : die === 1 ? '大失败' : success ? '成功' : '失败';
  const place = selected?.chineseName || '行动现场';

  function chooseTerritory(territory: Territory) {
    session.select(territory.id);
  }
  function beginRoll() {
    if (session.roll()) setRollOpen(true);
  }
  function closeRoll() {
    if (!rollRevealed) return;
    setRollOpen(false);
    window.requestAnimationFrame(() => storyRef.current?.focus());
  }
  return <div className="play-page">
    <header className="play-header">
      <div className="play-brand"><span className="play-brand-icon"><Compass size={25} /></span><div><small>魔道祖师 / PLAYER VIEW</small><strong>行动与判定</strong></div></div>
      <div className="play-header-actions">
        <span className="play-demo-label">界面原型 · 本地演示</span>
        {previewCharacter ? (
          <button ref={roleButtonRef} className="play-role-trigger" type="button" onClick={() => setRoleOpen(true)}>
            <UserRound size={17} />我的角色
          </button>
        ) : (
          <a className="play-role-trigger" href="#/opening"><UserRound size={17} />开局选角色</a>
        )}
      </div>
      <button className="play-entry play-atlas-entry" type="button" onClick={() => onOpenAtlas(selectedId ?? undefined)}>
        <BookOpen size={18} />地图志
      </button>
    </header>
    <main className="play-main">
      <div className="play-intro">
        <div>
          <span className="play-kicker">PERSONAL ACTION / PLAYER VIEW</span>
          <h1>我的行动与判定</h1>
          <p>{previewCharacter ? `当前本地角色：${previewCharacter.name}。这里只有你的行动、判定条件与私有剧情；正式身份和行动轮次将在加入房间后由服务端载入。` : '这里只有你的行动、判定条件与私有剧情。角色身份和行动轮次将在加入房间后载入。'}</p>
          {previewCharacter && <div className="play-identity"><InitialFactionBadge factionId={previewCharacter.initialFactionId} /></div>}
        </div>
      </div>
      <div className="play-grid">
        <section className="play-card play-map-card" aria-label="行动地图">
          <div className="play-card-heading"><div><span className="play-index">01 / THEATRE</span><h2>行动地点</h2></div><button className="play-collapse" onClick={session.toggleMap} aria-expanded={mapOpen} aria-controls="play-map-body"><span>{mapOpen ? '收起地图' : '展开地图'}</span><ChevronDown size={17} /></button></div>
          {mapOpen && <div id="play-map-body"><div className="play-map-search"><Search size={16} /><input aria-label="搜索行动地点" value={query} disabled={stage !== 'draft'} onChange={event => session.search(event.target.value)} placeholder="搜索中国名、欧洲名或地理志编号" />{query && <button aria-label="清除地点搜索" onClick={() => session.search('')}><X size={15} /></button>}{query && stage === 'draft' && <div className="play-map-results">{results.length ? results.map(item => <button key={item.territory!.id} onClick={() => chooseTerritory(item.territory!)}><strong>{item.territory!.chineseName}</strong><small>{item.territory!.name}</small><ChevronRight size={14} /></button>) : <p>没有找到对应地块。</p>}</div>}</div>
            <div className="play-map-viewport">{error ? <div className="play-map-status" role="alert"><p>{error}</p><button onClick={onRetry}>重新加载地图</button></div> : data && geometry && water && cityData ? <MapView geometry={geometry} water={water} cities={cityData.cities} territories={data.territories} selectedId={selectedId} focus={focus} faction={null} onSelect={id => { const territory = data.territories.find(item => item.id === id); if (territory) chooseTerritory(territory); }} /> : <div className="play-map-status" role="status">正在载入战区地图…</div>}</div>
            <div className="play-place-summary">{selected ? <div><span className="play-index">已选地块 / {selected.id}</span><strong>{selected.chineseName}</strong><small>{selected.name} · {factionOf(selected.faction).name}</small></div> : <p>{stage === 'draft' ? '点击地图或搜索地名，为本次行动指定地点。也可以不指定地块。' : '本次行动未指定地块。'}</p>}</div>
            {selected && record && <details className="play-place-details"><summary>查看所属地区资料</summary><p>{record.geography}</p><small>该资料来自地理志条目 {record.code}；地块的具体边界以地图为准。</small></details>}</div>}
        </section>

        <section className="play-card play-action-card" aria-label="行动输入与判定">
          <div className="play-card-heading"><div><span className="play-index">02 / ACTION</span><h2>提交行动</h2></div><span className={`play-stage play-stage-${stage}`} role="status">{stage === 'draft' ? '撰写中' : stage === 'submitted' ? '等待 DM 审核' : stage === 'locked' ? '判定条件已送达' : '等待后续安排'}</span></div>
          <form onSubmit={event => { event.preventDefault(); session.submit(); }}>
            <label className="play-field-label" htmlFor="play-action">你打算做什么？</label>
            <textarea id="play-action" maxLength={600} value={action} onChange={event => session.editAction(event.target.value)} disabled={stage === 'locked' || stage === 'resolved' || stage === 'submitted'} placeholder="写下行动目标、采取的手段，以及希望影响的地区或人物……" />
            <div className="play-form-meta"><span>{action.length} / 600 字</span><span>仅当前玩家与 DM 可见 · 正式版</span></div>
            <p className="play-action-hint">写明目标与手段即可。难度和修正由 DM 在查看行动后确认。</p>
            {stage === 'draft' && <button className="play-primary" type="submit" disabled={!action.trim()}><Send size={17} />提交我的行动</button>}
          </form>
          {stage === 'submitted' && <div className="play-review"><LockKeyhole size={21} /><div><strong>行动已提交，等待判定条件</strong><p>本地原型约 3 秒后自动载入示例条件。正式对局会等待 DM 在 CLI 审核，并由服务端只发给你。</p></div><div className="play-review-actions"><button onClick={session.revoke}>撤回修改</button></div></div>}
          {(stage === 'locked' || stage === 'resolved') && <div className="play-check"><div className="play-check-title"><LockKeyhole size={16} />判定条件已送达 <small>本地演示数据</small></div><div className="play-check-grid"><div><span>难度 DC</span><strong>{DC}</strong></div><div><span>角色修正</span><strong>{signed(ROLE_MODIFIER)}</strong></div><div><span>情境修正</span><strong>{signed(SITUATION)}</strong></div></div><p className="play-check-reason"><strong>判定理由</strong>此处使用固定示例数值；正式版由 DM 在 CLI 确认后传给当前玩家。</p><p>骰点＋角色修正＋情境修正 ≥ DC 即成功。自然 20 自动成功，自然 1 自动失败。</p></div>}
          <div className="play-roll">
            <div className={`play-die ${stage === 'resolved' ? 'rolled' : ''}`} aria-hidden="true"><Dice5 size={40} /><strong>{die ?? 'D20'}</strong></div>
            <div className="play-roll-copy">
              <span className="play-index">03 / D20 CHECK</span>
              <h3>{stage === 'resolved' ? `${outcome} · ${total} 对 DC ${DC}` : die !== null ? '骰子正在落定' : stage === 'locked' ? '条件已公开，轮到你掷骰' : '等待判定条件公开'}</h3>
              <p>{stage === 'resolved' ? `骰点 ${die} ${signed(ROLE_MODIFIER)} 角色 ${signed(SITUATION)} 情境 = ${total}` : stage === 'locked' ? '点击后由浏览器生成演示点数。正式多人版须由服务器生成并保存。' : '提交行动并由 DM 锁定判定条件后，才能投掷。'}</p>
            </div>
            <button className="play-primary" disabled={stage !== 'locked' || die !== null} onClick={beginRoll}>
              {stage === 'resolved' ? '已投掷 · 等待' : die !== null ? '正在投掷' : '投掷 D20'}
            </button>
          </div>
        </section>

        <section className="play-card play-story-card" aria-label="判定结果与剧情" ref={storyRef} tabIndex={-1}><div className="play-card-heading"><div><span className="play-index">04 / CHRONICLE</span><h2>我的判定与剧情</h2></div><span className="play-manuscript">PRIVATE RECORD</span></div>{stage === 'resolved' ? <><div className={`play-outcome ${success ? 'success' : 'failure'}`}><span>{outcome}</span><strong>D20 {die} {signed(ROLE_MODIFIER)} {signed(SITUATION)} = {total}</strong></div><p className="play-story-text">{success ? `在${place}，你的部署取得了突破。传令兵带回消息：道路暂时畅通，但新的局势已在边界另一侧酝酿。` : `在${place}，计划遭遇阻碍。前线的消息比预想更迟抵达，局势迫使你重新权衡下一步。`}</p><p className="play-disclaimer">以上为固定模板示例，尚未接入剧情智能体，也未存档或广播。</p><div className="play-waiting" role="status"><LockKeyhole size={16}/><span>本次判定已完成，等待 DM 的下一步安排。你无需查看其他玩家的行动。</span></div></> : <div className="play-story-placeholder"><BookOpen size={29} /><p>行动判定完成后，这里只显示你的结果与剧情文字。</p><small>正式版会保存你的行动、判定依据、骰点和经审核的剧情。</small></div>}</section>
        <PlayerAttributesPanel gateway={attributesGateway} />
      </div>
      <footer className="play-footer">
        <span>魔道祖师 · Play 界面原型</span>
        <span>尚未接入加入房间、真实 DM 审核、AI 生成或联机同步</span>
        <div className="play-footer-links">
          <Attribution sources={data?.sources || []} />
        </div>
      </footer>
    </main>
    {roleOpen && previewCharacter && (
      <PlayerRoleDialog
        character={previewCharacter}
        onClose={() => {
          setRoleOpen(false);
          window.requestAnimationFrame(() => roleButtonRef.current?.focus());
        }}
      />
    )}
    {rollOpen && die !== null && total !== null && <D20RollOverlay die={die} total={total} dc={DC} roleModifier={ROLE_MODIFIER} situationModifier={SITUATION} outcome={outcome} success={success} revealed={rollRevealed} onClose={closeRoll} />}
  </div>;
}
