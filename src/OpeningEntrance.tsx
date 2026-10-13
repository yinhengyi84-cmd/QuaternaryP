import { ArrowRight, Compass, Dices, Hand, LockKeyhole } from 'lucide-react';
import { characterById } from './opening-characters';
import { readPreviewAssignment } from './opening-assignment';
import './opening-entrance.css';

export default function OpeningEntrance() {
  const saved = readPreviewAssignment();
  const savedCharacter = characterById(saved?.assignedCharacterId ?? null);

  return (
    <div className="entrance-page">
      <header className="entrance-header">
        <a href="#/atlas" className="entrance-brand"><Compass size={24} /><span>魔道祖师<small>PERSONAL OPENING</small></span></a>
        <span>六张命运牌 · 两种开局方式</span>
      </header>
      <main className="entrance-main">
        <div className="entrance-heading">
          <span>THE SIX FATES / 开局原型</span>
          <h1>命运，由你选择，<br /><em>或交给一次抽取。</em></h1>
          <p>先比较两种开场体验。它们使用同一份六人塔罗档案，最终都通往你的个人行动与判定页面。</p>
        </div>
        <div className="entrance-options" aria-label="选择开局体验方式">
          <a href="#/choose" className="entrance-option entrance-option-choose">
            <div className="entrance-option-top"><span>01 / CHOOSE</span><Hand size={27} strokeWidth={1.4} /></div>
            <div className="entrance-option-mark" aria-hidden="true">✦</div>
            <h2>自主选择</h2>
            <p>浏览六张塔罗牌，读完人物档案，再确定你想扮演的角色。</p>
            <span className="entrance-option-action">进入自主选择 <ArrowRight size={17} /></span>
          </a>
          <a href="#/draw" className="entrance-option entrance-option-draw">
            <div className="entrance-option-top"><span>02 / DRAW</span><Dices size={27} strokeWidth={1.4} /></div>
            <div className="entrance-option-mark" aria-hidden="true">?</div>
            <h2>随机抽取</h2>
            <p>让封存的卡牌决定身份。抽取前，你不会看到即将揭晓的人物。</p>
            <span className="entrance-option-action">进入随机抽取 <ArrowRight size={17} /></span>
          </a>
        </div>
        {savedCharacter && <p className="entrance-resume">本次浏览器会话已有{saved?.mode === 'choose' ? '自主选择' : '随机抽取'}结果：{savedCharacter.name}。进入另一种方式会开启新的本地试用。</p>}
        <p className="entrance-room-note"><LockKeyhole size={15} />正式多人房间由 DM 确定开局方式；玩家不会自行切换房间模式或查看他人的角色。</p>
      </main>
      <footer className="entrance-footer"><span>MODAO ZUSHI / THE OPENING</span><span>本地交互预览</span></footer>
    </div>
  );
}
