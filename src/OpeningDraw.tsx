import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, Compass, RotateCcw, Shield, Sparkles } from 'lucide-react';
import InitialFactionBadge from './InitialFactionBadge';
import TarotArtwork from './TarotArtwork';
import { characterById } from './opening-characters';
import {
  clearPreviewAssignment,
  createOpeningRequestId,
  previewDrawGateway,
  type OpeningAssignmentGateway,
  type OpeningSnapshot,
} from './opening-assignment';
import './opening-draw.css';

type DrawPhase = 'sealed' | 'drawing' | 'revealed';
type Props = { gateway?: OpeningAssignmentGateway };

export default function OpeningDraw({ gateway = previewDrawGateway }: Props) {
  const [snapshot, setSnapshot] = useState<OpeningSnapshot | null>(null);
  const [phase, setPhase] = useState<DrawPhase>('sealed');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const revealRef = useRef<HTMLHeadingElement>(null);
  const drawingRef = useRef(false);
  const role = characterById(snapshot?.assignedCharacterId ?? null);

  useEffect(() => {
    let active = true;
    gateway.load().then(next => {
      if (!active) return;
      setSnapshot(next);
      setPhase(next.stage === 'assigned' ? 'revealed' : 'sealed');
    }).catch(() => { if (active) setError('开局资料载入失败，请刷新重试。'); });
    const unsubscribe = gateway.subscribe?.(next => {
      if (!active) return;
      setSnapshot(next);
      if (next.stage === 'assigned' && !drawingRef.current) setPhase('revealed');
    });
    return () => { active = false; unsubscribe?.(); };
  }, [gateway]);

  useEffect(() => {
    if (phase !== 'drawing') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => {
      drawingRef.current = false;
      setPhase('revealed');
    }, reducedMotion ? 100 : 1100);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'revealed') revealRef.current?.focus();
  }, [phase]);

  async function beginDraw() {
    if (snapshot?.stage !== 'choosing' || snapshot.mode !== 'draw' || phase !== 'sealed' || submitting) return;
    drawingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      const next = await gateway.requestDraw({ expectedVersion: snapshot.version, requestId: createOpeningRequestId() });
      setSnapshot(next);
      if (next.stage === 'assigned' && next.assignedCharacterId) setPhase('drawing');
      else drawingRef.current = false;
    } catch (reason) {
      drawingRef.current = false;
      setError(reason instanceof Error ? reason.message : '抽取失败，请重试。');
      try {
        const latest = await gateway.load();
        setSnapshot(latest);
        if (latest.stage === 'assigned') setPhase('revealed');
      } catch {
        // 保留原错误，让玩家刷新后重试。
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resetPreview() {
    if (snapshot?.source !== 'preview') return;
    drawingRef.current = false;
    clearPreviewAssignment('draw');
    setSnapshot({ ...snapshot, stage: 'choosing', assignedCharacterId: null, version: 0 });
    setPhase('sealed');
    setError('');
  }

  const canDraw = snapshot?.mode === 'draw' && snapshot.stage === 'choosing' && phase === 'sealed';
  const waitingTurn = snapshot?.stage === 'waiting-turn';

  return (
    <div className="opening-page">
      <header className="opening-header">
        <a className="opening-brand" href="#/atlas" aria-label="返回魔道祖师地图">
          <Compass size={24} />
          <span>魔道祖师<small>PLAYER ENTRANCE</small></span>
        </a>
        <span className="opening-edition">{snapshot?.source === 'room' ? '房间抽取' : '本地交互预览'} <i /> THE OPENING</span>
      </header>

      <main className="opening-main">
        <section className="opening-copy" aria-labelledby="opening-title">
          <span className="opening-kicker"><span>01</span> / THE OPENING DRAW</span>
          <h1 id="opening-title">命运落在<br /><em>谁的手中？</em></h1>
          <div className="opening-rule" />
          <p>六段未写定的命运，等待一位玩家。抽取后，你只会看到自己的角色档案，再进入个人行动与 D20 判定页面。</p>
          <div className="opening-steps" aria-label="开局流程">
            <span className={phase === 'revealed' ? '' : 'current'}>抽取角色</span>
            <span className={phase === 'revealed' ? 'current' : ''}>阅读档案</span>
            <span>进入 Play</span>
          </div>
          <p className="opening-disclaimer">{snapshot?.source === 'room' ? '房间由 DM 指定抽取模式；服务端保存分配结果，仅向本人揭晓。' : '当前仅演示抽取手感。每台设备独立抽取；正式对局由服务端统一分配、保存身份与座次。'}</p>
        </section>

        <section className="opening-stage" aria-label="角色抽取">
          <div className="opening-stage-top"><span>PERSONAL DOSSIER</span><span>NO. 01—06</span></div>
          <div className={`opening-card opening-card-${phase}`} style={{ '--role-accent': role?.accent ?? '#c7b58a' } as CSSProperties}>
            <div className="opening-card-corner opening-card-corner-tl" />
            <div className="opening-card-corner opening-card-corner-br" />
            {phase === 'revealed' && role ? (
              <div className="opening-card-content" aria-live="polite">
                <span className="opening-card-label">IDENTITY REVEALED / 身份已揭晓</span>
                <div className="opening-tarot-art"><TarotArtwork character={role} /></div>
                <span className="opening-card-kicker">ARCANA {role.roman} · {role.tarot} · {role.orientation}</span>
                <h2 ref={revealRef} tabIndex={-1}>{role.name}</h2>
                <InitialFactionBadge factionId={role.initialFactionId} />
                <div className="opening-card-divider" />
                <p>{role.description}</p>
              </div>
            ) : (
              <div className="opening-card-seal" aria-live="polite">
                <span>CONFIDENTIAL / 绝密</span>
                <div className="opening-sigil"><Shield size={34} strokeWidth={1.15} /><span>?</span></div>
                <strong>{phase === 'drawing' ? '正在揭开命运…' : '未揭封的档案'}</strong>
                <small>{phase === 'drawing' ? '请稍候' : '六位角色 · 一次抽取'}</small>
              </div>
            )}
          </div>

          {error && <p className="opening-error" role="alert">{error}</p>}
          <div className="opening-actions">
            {canDraw && <button className="opening-primary" onClick={beginDraw} disabled={submitting}><Sparkles size={18} />{submitting ? '正在抽取…' : '抽取我的角色'}<ArrowRight size={17} /></button>}
            {phase === 'drawing' && <div className="opening-progress" role="status">档案正在开启…</div>}
            {phase === 'revealed' && role && <>
              <a className="opening-primary" href="#/play">以{role.name}进入 Play<ArrowRight size={17} /></a>
              {snapshot?.source === 'preview' && <button className="opening-reset" onClick={resetPreview}><RotateCcw size={14} />重新试抽</button>}
            </>}
            {waitingTurn && <div className="opening-progress" role="status">等待轮到你的抽取回合…</div>}
            {snapshot?.stage === 'pending-dm' && <div className="opening-progress" role="status">等待 DM 确认…</div>}
            {!snapshot && !error && <div className="opening-progress" role="status">正在载入开局资料…</div>}
          </div>
          <p className="opening-note">{snapshot?.source === 'preview' ? '试抽仅保存在当前浏览器会话；“重新试抽”只用于比较原型。' : '房间中的抽取结果由服务端保存。'}角色与阵营不作永久绑定。<a href="#/opening">返回开局方式</a></p>
        </section>
      </main>

      <footer className="opening-footer"><span>魔道祖师 / THE SIX FATES</span><span>单人页面原型 · 尚未接入房间服务</span></footer>
    </div>
  );
}
