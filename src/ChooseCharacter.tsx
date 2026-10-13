import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, Compass, LockKeyhole, RotateCcw, Sparkles, X } from 'lucide-react';
import TarotArtwork from './TarotArtwork';
import InitialFactionBadge from './InitialFactionBadge';
import { CHARACTERS, characterById, type CharacterId } from './opening-characters';
import {
  clearPreviewAssignment,
  createOpeningRequestId,
  previewChooseGateway,
  type OpeningAssignmentGateway,
  type OpeningSnapshot,
} from './opening-assignment';
import './choose-character.css';

type Props = { gateway?: OpeningAssignmentGateway };

export default function ChooseCharacter({ gateway = previewChooseGateway }: Props) {
  const [snapshot, setSnapshot] = useState<OpeningSnapshot | null>(null);
  const [inspectedId, setInspectedId] = useState<CharacterId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const resultTitleRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const selectedCharacter = characterById(snapshot?.assignedCharacterId ?? null);
  const inspectedCharacter = characterById(inspectedId);

  useEffect(() => {
    let active = true;
    gateway.load().then(next => { if (active) setSnapshot(next); }).catch(() => { if (active) setError('开局资料载入失败，请刷新重试。'); });
    const unsubscribe = gateway.subscribe?.(next => { if (active) setSnapshot(next); });
    return () => { active = false; unsubscribe?.(); };
  }, [gateway]);

  useEffect(() => {
    if (!revealing) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setRevealing(false), reducedMotion ? 80 : 800);
    return () => window.clearTimeout(timer);
  }, [revealing]);

  useEffect(() => {
    if (!inspectedId) return;
    dialogRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    function handleKeys(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) closeDetails();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')];
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [inspectedId, submitting]);

  useEffect(() => {
    if (snapshot?.stage === 'assigned' && !revealing) resultTitleRef.current?.focus();
  }, [snapshot?.stage, revealing]);

  function openDetails(id: CharacterId) {
    if (snapshot?.stage !== 'choosing' || snapshot.mode !== 'choose') return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setInspectedId(id);
    setError('');
  }

  function closeDetails() {
    setInspectedId(null);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }

  async function confirmChoice() {
    if (!inspectedId || snapshot?.stage !== 'choosing' || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const next = await gateway.requestChoice({
        characterId: inspectedId,
        expectedVersion: snapshot.version,
        requestId: createOpeningRequestId(),
      });
      setSnapshot(next);
      setInspectedId(null);
      if (next.stage === 'assigned') setRevealing(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '提交失败，请重试。');
    } finally {
      setSubmitting(false);
    }
  }

  function resetPreview() {
    if (snapshot?.source !== 'preview') return;
    clearPreviewAssignment('choose');
    setSnapshot({ ...snapshot, stage: 'choosing', assignedCharacterId: null, version: 0 });
    setError('');
  }

  return (
    <div className="choice-page">
      <header className="choice-header">
        <a className="choice-brand" href="#/atlas"><Compass size={23} /><span>魔道祖师<small>PERSONAL OPENING</small></span></a>
        <span className="choice-header-note"><span className="choice-live-dot" />{snapshot?.source === 'room' ? '房间选角' : '单人体验原型'}</span>
      </header>

      <main className="choice-main">
        <div className="choice-intro">
          <span className="choice-kicker">SIX FATES / 六张命运牌</span>
          <h1>{snapshot?.stage === 'assigned' ? '命运已经揭晓。' : '选择你的命运。'}</h1>
          <p>{snapshot?.stage === 'assigned' ? '现在，你只需带着自己的身份进入行动。' : '六位角色，六张塔罗。翻开档案，选择你愿意承受的故事。'}</p>
          {snapshot?.source !== 'room' && <div className="choice-preview-note"><LockKeyhole size={14} />本地预览：这里的选择只存在于当前浏览器；正式版由房间服务端按 1—6 入场座次和 DM 指令确认。</div>}
        </div>

        {error && <p className="choice-error" role="alert">{error}</p>}
        {!snapshot && !error && <div className="choice-loading" role="status">正在展开人物档案…</div>}

        {snapshot?.stage === 'choosing' && snapshot.mode === 'choose' && <>
          <div className="choice-gallery-heading"><span>01 / 人物档案</span><span>选择一张，阅读后确认</span></div>
          <div className="choice-grid">
            {CHARACTERS.map((character, index) => {
              const available = snapshot.availableCharacterIds.includes(character.id);
              return <button
                className="choice-card" key={character.id} type="button" disabled={!available}
                onClick={() => openDetails(character.id)}
                aria-label={`查看${character.name}角色档案`}
                style={{ '--card-accent': character.accent, '--card-index': index } as CSSProperties}
              >
                <div className="choice-card-art"><TarotArtwork character={character} /><span className="choice-position">{character.orientation}</span></div>
                <div className="choice-card-copy"><small>ARCANA {character.roman}</small><strong>{character.name}</strong><span>{character.tarot} · {character.tarotEnglish}</span><InitialFactionBadge factionId={character.initialFactionId} compact /><p>{character.description}</p><em>{available ? '展开档案 →' : '已被选择'}</em></div>
              </button>;
            })}
          </div>
          <p className="choice-source-note">人物描述沿用你提供的旧版 HTML 文案；姓名按最终六人名单校正。正式开局时间线由 DM 核对。</p>
        </>}

        {snapshot?.stage === 'waiting-turn' && <div className="choice-state" role="status"><LockKeyhole size={35} /><h2>等待你的选角回合</h2><p>入场座次由房间确定。轮到你时，这里会开放可选角色。</p></div>}
        {snapshot?.stage === 'pending-dm' && <div className="choice-state" role="status"><Sparkles size={35} /><h2>选择已送达 DM</h2><p>正在等待主持人确认。确认后仅向你展示最终身份。</p></div>}
        {snapshot?.stage === 'choosing' && snapshot.mode === 'draw' && <div className="choice-state" role="status"><Sparkles size={35} /><h2>本房间采用抽取模式</h2><p>由服务端发放角色；无需在此自行选择。</p></div>}

        {snapshot?.stage === 'assigned' && selectedCharacter && <section className="choice-result" aria-label="我的角色" style={{ '--card-accent': selectedCharacter.accent } as CSSProperties}>
          {revealing ? <div className="choice-reveal" role="status"><div className="choice-reveal-seal">✦</div><span>身份封印正在开启…</span></div> : <>
            <div className="choice-result-art"><TarotArtwork character={selectedCharacter} /></div>
            <div className="choice-result-copy"><span className="choice-kicker">YOUR ROLE / 你的角色</span><h2 ref={resultTitleRef} tabIndex={-1}>{selectedCharacter.name}</h2><strong>{selectedCharacter.tarot} · {selectedCharacter.orientation}</strong><InitialFactionBadge factionId={selectedCharacter.initialFactionId} /><p>{selectedCharacter.description}</p><a href="#/play" className="choice-primary">进入我的 Play 页面<ArrowRight size={17} /></a>{snapshot.source === 'preview' && <button className="choice-reset" type="button" onClick={resetPreview}><RotateCcw size={14} />重新选择（仅本地预览）</button>}</div>
          </>}
        </section>}
      </main>

      <footer className="choice-footer"><span>MODAO ZUSHI · THE OPENING</span><a href="#/opening">返回开局方式</a><span>角色不与阵营永久绑定</span></footer>

      {inspectedCharacter && <div className="choice-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !submitting) closeDetails(); }}>
        <div className="choice-modal" role="dialog" aria-modal="true" aria-labelledby="choice-dialog-title" ref={dialogRef} tabIndex={-1} style={{ '--card-accent': inspectedCharacter.accent } as CSSProperties}>
          <button className="choice-modal-close" type="button" aria-label="关闭角色档案" onClick={closeDetails} disabled={submitting}><X size={18} /></button>
          <div className="choice-modal-art"><TarotArtwork character={inspectedCharacter} /></div>
          <div className="choice-modal-copy"><span className="choice-kicker">ARCANA {inspectedCharacter.roman} / {inspectedCharacter.orientation}</span><h2 id="choice-dialog-title">{inspectedCharacter.name}</h2><strong>{inspectedCharacter.tarot} <span>{inspectedCharacter.tarotEnglish}</span></strong><InitialFactionBadge factionId={inspectedCharacter.initialFactionId} /><p>{inspectedCharacter.description}</p>{error && <p className="choice-modal-error" role="alert">{error}</p>}<div className="choice-modal-actions"><button className="choice-secondary" type="button" onClick={closeDetails} disabled={submitting}><ArrowLeft size={15} />返回六人列表</button><button className="choice-primary" type="button" onClick={confirmChoice} disabled={submitting}>{submitting ? '正在提交…' : `确定选择${inspectedCharacter.name}`}<ArrowRight size={17} /></button></div><small>{snapshot?.source === 'preview' ? '本地试选可重新选择；正式房间按服务端与 DM 规则确认。' : '提交后等待 DM 与房间服务端确认。'}</small></div>
        </div>
      </div>}
    </div>
  );
}
