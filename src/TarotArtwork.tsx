import { useId } from 'react';
import type { CharacterProfile } from './opening-characters';

type Props = { character: CharacterProfile; className?: string };

export default function TarotArtwork({ character, className = '' }: Props) {
  const reversed = character.orientation === '逆位';
  const instanceId = useId().replaceAll(':', '');
  const skyId = `tarot-sky-${instanceId}`;
  const earthId = `tarot-earth-${instanceId}`;

  return (
    <svg className={`tarot-artwork ${className}`} viewBox="0 0 220 310" role="img" aria-label={`${character.name}对应的${character.tarot}${character.orientation}塔罗图案`}>
      <defs>
        <linearGradient id={skyId} x2="0" y2="1">
          <stop stopColor="#263b42" />
          <stop offset="1" stopColor="#0e2027" />
        </linearGradient>
        <linearGradient id={earthId} x2="0" y2="1">
          <stop stopColor="#9d8d67" />
          <stop offset="1" stopColor="#554e45" />
        </linearGradient>
      </defs>
      <rect width="220" height="310" fill="#c7ba96" />
      <rect x="8" y="8" width="204" height="294" fill="#182b32" stroke="#746e5b" strokeWidth="2" />
      <rect x="16" y="16" width="188" height="278" fill={`url(#${skyId})`} stroke="#b2a077" />
      <path d="M23 245 Q65 218 107 239 T197 243 V285 H23Z" fill={`url(#${earthId})`} opacity=".65" />
      <circle cx="110" cy="105" r="48" fill="#c7ad75" opacity=".08" />
      <circle cx="110" cy="105" r="35" fill="none" stroke="#c2af84" opacity=".28" />
      <g fill="#d7c696" opacity=".8"><circle cx="41" cy="51" r="1.3" /><circle cx="180" cy="66" r="1.3" /><circle cx="170" cy="134" r="1" /><circle cx="56" cy="145" r="1" /></g>

      <g transform={reversed ? 'rotate(180 110 151)' : undefined} stroke="#e3d0a5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {character.symbol === 'crown' && <>
          <path d="M56 225 V91 L75 78 V225 M164 225 V91 L145 78 V225" fill="#584f4b" />
          <path d="M77 218 V140 Q110 122 143 140 V218Z" fill="#7b695c" />
          <path d="M91 133 L91 103 L101 111 L110 90 L119 111 L129 103 L129 133Z" fill="#bd9c61" />
          <circle cx="110" cy="150" r="15" fill="#c3ab82" />
          <path d="M83 214 Q83 175 110 173 Q137 175 137 214Z" fill="#576a6e" />
          <path d="M66 225 H154" />
        </>}
        {character.symbol === 'wanderer' && <>
          <circle cx="159" cy="65" r="22" fill="#d2b775" stroke="none" />
          <path d="M26 238 L80 201 L104 215 L86 238Z" fill="#6f776c" />
          <path d="M88 238 L136 183 L198 234Z" fill="#627277" />
          <circle cx="91" cy="119" r="12" fill="#c8b18c" />
          <path d="M88 132 L106 172 L90 206 M103 168 L121 202 M95 145 L66 154 M103 150 L128 130" fill="none" />
          <path d="M128 126 L139 88" /><path d="M136 89 L155 97 L139 107Z" fill="#b89068" />
          <path d="M48 185 Q67 172 82 190" fill="none" />
        </>}
        {character.symbol === 'horns' && <>
          <path d="M80 117 Q60 95 71 73 L88 92 M140 117 Q160 95 149 73 L132 92" fill="#836b62" />
          <path d="M81 109 Q110 84 139 109 L132 147 L87 147Z" fill="#82665d" />
          <path d="M77 148 Q110 134 143 148 L151 216 H69Z" fill="#735959" />
          <path d="M84 137 L100 137 M120 137 L136 137" />
          <path d="M73 176 Q45 183 52 216 M147 176 Q175 183 168 216" fill="none" />
          <circle cx="51" cy="220" r="10" fill="none" /><circle cx="169" cy="220" r="10" fill="none" />
          <path d="M110 151 V174" />
        </>}
        {character.symbol === 'suspended' && <>
          <path d="M45 75 H172 M60 75 V235 M157 75 V235" fill="none" strokeWidth="8" />
          <path d="M110 75 V100" fill="none" />
          <path d="M110 99 L104 131 L121 148 L110 178" fill="none" strokeWidth="7" />
          <path d="M104 129 L86 111 M120 148 L142 129 M110 178 L90 202 M110 178 L133 197" fill="none" strokeWidth="5" />
          <circle cx="110" cy="192" r="13" fill="#c5ad85" />
          <circle cx="110" cy="192" r="23" fill="none" stroke="#d5b978" opacity=".8" />
        </>}
        {character.symbol === 'chariot' && <>
          <path d="M50 164 H170 L157 221 H63Z" fill="#656e69" />
          <path d="M68 160 L78 122 H142 L152 160Z" fill="#a7926b" />
          <path d="M95 124 V109 H125 V124 M101 109 L101 93 H119 V109" fill="#a7926b" />
          <path d="M100 140 L110 148 L120 140 L117 161 H103Z" fill="#d4ba85" />
          <circle cx="70" cy="220" r="16" fill="#27373b" /><circle cx="150" cy="220" r="16" fill="#27373b" />
          <path d="M34 200 Q39 171 56 179 M186 200 Q181 171 164 179" fill="none" />
        </>}
        {character.symbol === 'tower' && <>
          <path d="M79 229 V111 H141 V229Z" fill="#77706a" />
          <path d="M72 112 L79 85 L94 95 L110 76 L126 95 L141 85 L148 112Z" fill="#94816a" />
          <path d="M101 228 V188 Q110 173 119 188 V228 M91 141 H100 V155 H91 M120 141 H129 V155 H120" fill="#203139" />
          <path d="M168 53 L118 113 L136 108 L105 165 L114 123 L94 128Z" fill="#f0cd82" stroke="#f0cd82" />
          <path d="M67 162 L55 185 L72 180 M151 163 L164 187 L148 179" fill="none" stroke="#c8906b" />
        </>}
      </g>
      <path d="M25 268 H195" stroke="#a99b77" opacity=".6" />
      <text x="110" y="281" textAnchor="middle" fill="#d8c99f" fontFamily="Georgia, serif" fontSize="15" letterSpacing="3">{character.roman}</text>
    </svg>
  );
}
