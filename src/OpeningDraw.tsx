import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Compass, RotateCcw, Shield, Sparkles } from 'lucide-react';
import {
  clearPreviewRole,
  drawPreviewRole,
  readPreviewRole,
  savePreviewRole,
  type OpeningRole,
} from './role-draw';
import './opening-draw.css';

type DrawPhase = 'sealed' | 'drawing' | 'revealed';

export default function OpeningDraw() {
  const [role, setRole] = useState<OpeningRole | null>(readPreviewRole);
  const [phase, setPhase] = useState<DrawPhase>(() => readPreviewRole() ? 'revealed' : 'sealed');
  const revealRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (phase !== 'drawing') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setPhase('revealed'), reducedMotion ? 100 : 1100);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'revealed') revealRef.current?.focus();
  }, [phase]);

  function beginDraw() {
    if (phase !== 'sealed') return;
    const chosen = drawPreviewRole();
    savePreviewRole(chosen);
    setRole(chosen);
    setPhase('drawing');
  }

  function resetPreview() {
    clearPreviewRole();
    setRole(null);
    setPhase('sealed');
  }

  return (
    <div className="opening-page">
      <header className="opening-header">
        <a className="opening-brand" href="#/atlas" aria-label="返回魔道祖师地图">
          <Compass size={24} />
          <span>魔道祖师<small>PLAYER ENTRANCE</small></span>
        </a>
        <span className="opening-edition">本地交互预览 <i /> 1939</span>
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
          <p className="opening-disclaimer">当前仅演示界面与抽取手感。每台设备独立抽取；正式对局需由服务端在六人加入后统一分配、保存身份与座次。</p>
        </section>

        <section className="opening-stage" aria-label="角色抽取">
          <div className="opening-stage-top"><span>PERSONAL DOSSIER</span><span>NO. 01—06</span></div>
          <div className={`opening-card opening-card-${phase}`} style={{ '--role-accent': role?.accent ?? '#c7b58a' } as React.CSSProperties}>
            <div className="opening-card-corner opening-card-corner-tl" />
            <div className="opening-card-corner opening-card-corner-br" />
            {phase === 'revealed' && role ? (
              <div className="opening-card-content" aria-live="polite">
                <span className="opening-card-label">IDENTITY REVEALED / 身份已揭晓</span>
                <span className="opening-character" aria-hidden="true">{role.mark}</span>
                <span className="opening-card-kicker">{role.epithet}</span>
                <h2 ref={revealRef} tabIndex={-1}>{role.name}</h2>
                <div className="opening-card-divider" />
                <p>{role.introduction}</p>
                <div className="opening-connection"><span>当前关联</span><strong>{role.currentConnection}</strong></div>
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

          <div className="opening-actions">
            {phase === 'sealed' && <button className="opening-primary" onClick={beginDraw}><Sparkles size={18} />抽取我的角色<ArrowRight size={17} /></button>}
            {phase === 'drawing' && <div className="opening-progress" role="status">档案正在开启…</div>}
            {phase === 'revealed' && <>
              <a className="opening-primary" href="#/play">以{role?.name}进入 Play<ArrowRight size={17} /></a>
              <button className="opening-reset" onClick={resetPreview}><RotateCcw size={14} />重新试抽</button>
            </>}
          </div>
          <p className="opening-note">试抽仅保存在当前浏览器会话；“重新试抽”只用于比较原型。角色与阵营不作永久绑定。</p>
        </section>
      </main>

      <footer className="opening-footer"><span>魔道祖师 / THE SIX FATES</span><span>单人页面原型 · 尚未接入房间服务</span></footer>
    </div>
  );
}
