import fs from 'node:fs';
import assert from 'node:assert/strict';
import { geoArea, geoContains } from 'd3-geo';
const atlas=JSON.parse(fs.readFileSync(new URL('../public/data/atlas.json',import.meta.url),'utf8'));
const geometry=JSON.parse(fs.readFileSync(new URL('../public/data/geometry.geojson',import.meta.url),'utf8'));
const cities=JSON.parse(fs.readFileSync(new URL('../public/data/cities.json',import.meta.url),'utf8')).cities;
const ids=new Set(atlas.territories.map(t=>t.id));const codes=new Set(atlas.records.map(r=>r.code));
assert.equal(ids.size,atlas.territories.length);assert.equal(codes.size,172);
assert.equal(geometry.features.length,ids.size);
function projected(f){if(geoArea(f)<=2*Math.PI)return f;const g=f.geometry;return {...f,geometry:{...g,coordinates:g.type==='Polygon'?g.coordinates.map(r=>[...r].reverse()):g.coordinates.map(p=>p.map(r=>[...r].reverse()))}};}
for(const feature of geometry.features){
  assert(ids.has(feature.properties.id));assert(['Polygon','MultiPolygon'].includes(feature.geometry.type));
  const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
  for(const poly of polygons)for(const ring of poly){assert(ring.length>=4);assert.deepEqual(ring[0],ring.at(-1));assert(new Set(ring.map(p=>p.join(','))).size>=3);for(const [x,y] of ring)assert(Number.isFinite(x)&&Number.isFinite(y)&&x>=-180&&x<=180&&y>=-90&&y<=90);}
  assert(geoArea(projected(feature))<1,'小行省不应覆盖整个球面');
}
for(const t of atlas.territories){assert(t.name&&t.chineseName&&t.faction&&t.recordIds.length);assert(t.recordIds.every(c=>codes.has(c)));}
for(const r of atlas.records){assert(atlas.reconciliation.some(m=>m.code===r.code));assert(atlas.territories.some(t=>t.recordIds.includes(r.code)),`资料未对应：${r.code}`);}
assert.equal(cities.length,14);
assert.equal(new Set(cities.map(c=>c.id)).size,cities.length);
assert.equal(cities.filter(c=>c.role==='capital').length,6);
for(const city of cities){
  const territory=atlas.territories.find(t=>t.id===city.territoryId);
  assert(territory&&territory.recordIds.includes(city.recordCode),`城市资料或地块编号无效：${city.name}`);
  const feature=geometry.features.find(f=>f.properties.id===city.territoryId);
  assert(geoContains(projected(feature),city.coordinates),`城市坐标不在所属真实地块内：${city.name}`);
}
assert.equal(atlas.territories.find(t=>t.name==='明斯克州')?.chineseName,'合肥·明斯克州');
// 用实地城市坐标核验易错的小城区、飞地和港口。
for(const [name,point] of [['布拉格市',[14.42,50.08]],['柏林市',[13.405,52.52]],['里加市',[24.105,56.95]],['莫斯科市',[37.62,55.75]],['加里宁格勒／柯尼斯堡',[20.51,54.71]]]){
  const t=atlas.territories.find(t=>t.name===name);assert(t,name);const f=geometry.features.find(f=>f.properties.id===t.id);assert(geoContains(projected(f),point),`城市不在其真实地区内：${name}`);
}
const coast=geometry.features.map(projected);
for(const point of [[20,57.5],[19,54.5],[19.2,60.5]])assert(!coast.some(f=>geoContains(f,point)),`外海不应被填为陆地：${point}`);
const water=JSON.parse(fs.readFileSync(new URL('../public/data/water.geojson',import.meta.url),'utf8')).features.map(projected);
for(const point of [[13.3,58.9],[14.4,58.1]])assert(water.some(f=>geoContains(f,point)),`大湖水面应独立显示：${point}`);
assert(atlas.territories.some(t=>t.chineseName.includes('长沙')));assert(atlas.territories.some(t=>t.chineseName==='上海／申城'));assert(atlas.territories.some(t=>t.chineseName.includes('杭州')));
console.log(`数据校验通过：${ids.size} 个真实地块、${codes.size} 条地理志、${cities.length} 个城市标记、${atlas.sources.length} 个固定版本来源。`);
