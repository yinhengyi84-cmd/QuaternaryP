import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import InitialFactionBadge from './InitialFactionBadge';
import type { CharacterProfile } from './opening-characters';
import './player-role-dialog.css';

type Props = {
  character: CharacterProfile;
  onClose: () => void;
};

export default function PlayerRoleDialog({ character, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="play-role-dialog"
      aria-labelledby="play-role-title"
      onClose={onClose}
      onClick={event => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="play-role-sheet">
        <div className="play-role-sheet-top">
          <span>YOUR ROLE / 个人档案</span>
          <button type="button" aria-label="关闭角色档案" onClick={() => dialogRef.current?.close()}>
            <X size={20} />
          </button>
        </div>
        <div className="play-role-symbol" style={{ borderColor: character.accent, color: character.accent }} aria-hidden="true">
          {character.roman}
        </div>
        <h2 id="play-role-title">{character.name}</h2>
        <p className="play-role-tarot">{character.tarot} · {character.orientation}</p>
        <InitialFactionBadge factionId={character.initialFactionId} />
        <p className="play-role-description">{character.description}</p>
        <p className="play-role-note">这里只展示你的开局身份。后续阵营归属由对局状态决定。</p>
        <button className="play-role-done" type="button" onClick={() => dialogRef.current?.close()}>
          返回我的判定
        </button>
      </div>
    </dialog>
  );
}
