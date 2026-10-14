import { useId } from 'react';
import { RADAR_AXES, type PlayerAttributesSnapshot } from './player-attributes';
import { RADAR_CENTER, radarPoint, radarVertices } from './attributes-radar';

export default function AttributesRadar({ snapshot }: { snapshot: PlayerAttributesSnapshot }) {
  const id = useId();
  const upperId = `${id}-upper`;
  const lowerId = `${id}-lower`;
  const vertices = radarVertices(snapshot);
  const points = vertices.map(point => `${point.x},${point.y}`).join(' ');
  const gridPoints = (value: number) => RADAR_AXES.map(axis => {
    const point = radarPoint(value, axis.angle);
    return `${point.x},${point.y}`;
  }).join(' ');

  return (
    <svg className="attributes-radar" viewBox="0 0 360 320" role="img" aria-label="八维雷达图：上方金色为角色自身，下方青绿色为当前阵营，量程零到二十">
      <defs>
        <clipPath id={upperId}><rect width="360" height={RADAR_CENTER.y} /></clipPath>
        <clipPath id={lowerId}><rect y={RADAR_CENTER.y} width="360" height="160" /></clipPath>
      </defs>
      <polygon points={gridPoints(20)} className="radar-background-role" clipPath={`url(#${upperId})`} />
      <polygon points={gridPoints(20)} className="radar-background-faction" clipPath={`url(#${lowerId})`} />
      {[5, 10, 15, 20].map(value => <polygon key={value} points={gridPoints(value)} className="radar-grid" />)}
      {RADAR_AXES.map(axis => {
        const point = radarPoint(20, axis.angle);
        return <line key={axis.key} x1={RADAR_CENTER.x} y1={RADAR_CENTER.y} x2={point.x} y2={point.y} className="radar-spoke" />;
      })}
      <line x1="70" y1={RADAR_CENTER.y} x2="290" y2={RADAR_CENTER.y} className="radar-divider" />
      <polygon points={points} className="radar-area-role" clipPath={`url(#${upperId})`} />
      {snapshot.faction && <polygon points={points} className="radar-area-faction" clipPath={`url(#${lowerId})`} />}
      <polygon points={points} className="radar-outline" />
      {[5, 10, 15, 20].map(value => (
        <text key={value} x="180" y={radarPoint(value, -67.5).y - 4} className="radar-tick">{value}</text>
      ))}
      {RADAR_AXES.map(axis => {
        const point = radarPoint(20, axis.angle, 132);
        const anchor = point.x < 150 ? 'end' : point.x > 210 ? 'start' : 'middle';
        return <text key={axis.key} x={point.x} y={point.y} textAnchor={anchor} dominantBaseline="middle" className={`radar-label radar-label-${axis.group}`}>{axis.label}</text>;
      })}
      {vertices.filter(point => point.value !== null).map(point => (
        <circle key={point.key} cx={point.x} cy={point.y} r="3" className={`radar-dot radar-dot-${point.group}`} data-attribute={point.key} data-value={point.value} />
      ))}
    </svg>
  );
}
