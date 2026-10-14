import { RADAR_AXES, type PlayerAttributesSnapshot } from './player-attributes';

export const RADAR_CENTER = { x: 180, y: 160 };
export const RADAR_RADIUS = 100;

export function radarPoint(value: number, angle: number, radius = RADAR_RADIUS) {
  const radians = angle * Math.PI / 180;
  const distance = radius * value / 20;
  return { x: RADAR_CENTER.x + distance * Math.cos(radians), y: RADAR_CENTER.y + distance * Math.sin(radians) };
}

export function radarVertices(snapshot: PlayerAttributesSnapshot) {
  return RADAR_AXES.map(axis => {
    const value = axis.group === 'role' ? snapshot.role[axis.key] : snapshot.faction?.[axis.key] ?? null;
    // 缺失阵营只在绘图时收至圆心；业务数值仍为空，与真正的零分区分。
    return { ...axis, value, ...radarPoint(value ?? 0, axis.angle) };
  });
}
