import { useEffect, useRef, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import './d20-roll.css';

type Props = {
  die: number;
  total: number;
  dc: number;
  roleModifier: number;
  situationModifier: number;
  outcome: string;
  success: boolean;
  revealed: boolean;
  onClose: () => void;
};

const signed = (value: number) => `${value >= 0 ? '+' : ''}${value}`;

export default function D20RollOverlay({ die, total, dc, roleModifier, situationModifier, outcome, success, revealed, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // 弹窗期间冻结背景，避免键盘和触摸误操作地图或行动表单。
    const root = document.getElementById('root');
    const previousOverflow = document.body.style.overflow;
    root?.setAttribute('inert', '');
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      root?.removeAttribute('inert');
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (revealed) closeRef.current?.focus();
  }, [revealed]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (revealed) onClose();
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      if (revealed) closeRef.current?.focus();
      else panelRef.current?.focus();
    }
  }

  return createPortal(
    <div className={`d20-overlay ${revealed ? 'is-revealed' : 'is-spinning'}`}>
      <div className="d20-panel" role="dialog" aria-modal="true" aria-labelledby="d20-dialog-title" aria-describedby="d20-dialog-description" ref={panelRef} tabIndex={-1} onKeyDown={handleKeyDown}>
        <div className="d20-corners" aria-hidden="true"><span/><span/><span/><span/></div>
        <div className="d20-overline">PERSONAL CHECK <span>◆</span> D20</div>
        <h2 id="d20-dialog-title">{revealed ? '判定已揭晓' : '命运正在转动'}</h2>
        <p id="d20-dialog-description" className="d20-description">{revealed ? '你的骰点与判定结果已经确定。' : '条件已锁定。骰子落定后，结果只属于你和 DM。'}</p>

        <div className="d20-stage" aria-hidden="true">
          <div className="d20-orbit d20-orbit-outer"/>
          <div className="d20-orbit d20-orbit-inner"/>
          <div className="d20-glow"/>
          <svg className="d20-die-art" viewBox="0 0 240 240">
            <defs>
              <linearGradient id="d20-shell-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e8d79c"/><stop offset="0.4" stopColor="#aa9063"/><stop offset="1" stopColor="#5a624f"/></linearGradient>
              <linearGradient id="d20-face-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#405957"/><stop offset="0.55" stopColor="#1d353b"/><stop offset="1" stopColor="#10262e"/></linearGradient>
            </defs>
            <polygon className="d20-shell" points="120,8 183,28 225,82 225,151 178,211 120,234 62,211 15,151 15,82 57,28"/>
            <polygon className="d20-facet dark" points="120,8 57,28 78,84 120,58"/>
            <polygon className="d20-facet light" points="120,8 183,28 162,84 120,58"/>
            <polygon className="d20-facet medium" points="57,28 15,82 78,84"/>
            <polygon className="d20-facet dark" points="183,28 225,82 162,84"/>
            <polygon className="d20-facet medium" points="15,82 15,151 65,157 78,84"/>
            <polygon className="d20-facet light" points="225,82 225,151 175,157 162,84"/>
            <polygon className="d20-facet center" points="120,58 162,84 175,157 120,188 65,157 78,84"/>
            <polygon className="d20-facet dark" points="15,151 62,211 120,188 65,157"/>
            <polygon className="d20-facet medium" points="225,151 178,211 120,188 175,157"/>
            <polygon className="d20-facet light" points="62,211 120,234 178,211 120,188"/>
            <path className="d20-engraving" d="M120 58 L78 84 M120 58 L162 84 M65 157 L120 188 L175 157"/>
            <text x="120" y="139" textAnchor="middle" className="d20-face-number">{revealed ? die : '?'}</text>
          </svg>
          <div className="d20-ground"/>
        </div>

        <div className="d20-reveal" aria-live="polite">
          {revealed ? <><span className="d20-result-label">NATURAL ROLL / {die === 20 ? 'CRITICAL' : die === 1 ? 'FUMBLE' : 'RESULT'}</span><strong className={success ? 'd20-outcome success' : 'd20-outcome failure'}>{outcome}</strong><p>D20 <b>{die}</b> {signed(roleModifier)} 角色 {signed(situationModifier)} 情境 <span>= {total}</span> <i>／ DC {dc}</i></p></> : <><span className="d20-result-label">ROLLING THE DIE</span><strong className="d20-pending">正在投掷 D20…</strong><div className="d20-progress"/></>}
        </div>
        <div className="d20-bottom">{revealed ? <button ref={closeRef} onClick={onClose}>查看我的剧情 <span aria-hidden="true">→</span></button> : <span>骰子落定前无法重复投掷</span>}<small>本地动画演示；正式对局由服务端掷骰并存档</small></div>
      </div>
    </div>, document.body
  );
}
