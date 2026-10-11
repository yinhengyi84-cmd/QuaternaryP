import type { AtlasData, City, FactionId, GazetteerRecord, Territory } from './types';
export const FACTIONS: { id: FactionId; name: string; color: string; subtitle: string }[] = [
  { id: 'D', name: '德意志', color: '#66716c', subtitle: '黑色阵营' },
  { id: 'S', name: '苏俄', color: '#bc4c45', subtitle: '红色阵营' },
  { id: 'B', name: '拜占庭', color: '#866091', subtitle: '紫色阵营' },
  { id: 'P', name: '波兰', color: '#c58c9e', subtitle: '粉色阵营' },
  { id: 'J', name: '日本', color: '#c3af63', subtitle: '黄色阵营' },
  { id: 'Q', name: '大清', color: '#618c73', subtitle: '绿色阵营' },
];
export const factionOf = (id: FactionId) => FACTIONS.find(f => f.id === id)!;
// 地图别名遵循当前剧本设定；来源条目仍保留 Word 原文。
export const recordDisplayName = (record: GazetteerRecord) => record.code === 'S047' ? '合肥' : record.china;
export const normalizeSearch = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/\s+/g, '');
export function searchAtlas(data: AtlasData, query: string, cities: City[] = []): { territory?: Territory; record?: GazetteerRecord; city?: City }[] {
  const q = normalizeSearch(query.trim());
  if (!q) return [];
  const cityMatches=cities.filter(city=>normalizeSearch(`${city.name} ${city.europe}`).includes(q))
    .flatMap(city=>{const territory=data.territories.find(t=>t.id===city.territoryId);return territory?[{city,territory}]:[];});
  const cityTerritoryIds=new Set(cityMatches.map(result=>result.territory.id));
  const matched = data.territories.filter(t => {
    const records = data.records.filter(r => t.recordIds.includes(r.code));
    return normalizeSearch([t.chineseName, t.name, t.sourceName, t.id, ...records.map(r => `${r.code} ${recordDisplayName(r)} ${r.china} ${r.europe}`)].join(' ')).includes(q);
  }).filter(t=>!cityTerritoryIds.has(t.id)).sort((a,b) => Number(normalizeSearch(b.chineseName.split('／')[0]) === q) - Number(normalizeSearch(a.chineseName.split('／')[0]) === q));
  const unplaced = data.records.filter(r => !data.territories.some(t => t.recordIds.includes(r.code)) && normalizeSearch(`${r.code} ${recordDisplayName(r)} ${r.china} ${r.europe}`).includes(q));
  return [...cityMatches, ...matched.map(territory => ({ territory })), ...unplaced.map(record => ({ record }))].slice(0,30);
}
