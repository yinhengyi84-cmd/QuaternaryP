import type { CSSProperties } from 'react';
import { Shield } from 'lucide-react';
import { factionOf } from './atlas';
import type { FactionId } from './types';
import './initial-faction-badge.css';

type Props = { factionId: FactionId; compact?: boolean };

export default function InitialFactionBadge({ factionId, compact = false }: Props) {
  const faction = factionOf(factionId);
  return (
    <span className={`initial-faction-badge${compact ? ' initial-faction-badge-compact' : ''}`} style={{ '--faction-color': faction.color } as CSSProperties}>
      <Shield size={13} strokeWidth={1.7} aria-hidden="true" />
      <span>初始阵营 · {faction.name}</span>
    </span>
  );
}
