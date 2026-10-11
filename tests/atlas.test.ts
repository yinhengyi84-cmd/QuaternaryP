import { describe, expect, it } from 'vitest';
import { normalizeSearch, searchAtlas } from '../src/atlas';
import raw from '../public/data/atlas.json';
import type { AtlasData } from '../src/types';
const atlas=raw as AtlasData;
describe('地图搜索与资料对应',()=>{
  it('核心中国名称定位到真实城区',()=>{for(const [query,expected] of [['长沙','布拉格市'],['上海','里加市'],['杭州','布良斯克州']])expect(searchAtlas(atlas,query)[0].territory?.name).toBe(expected);});
  it('编号搜索包含全部拆分地区',()=>{const results=searchAtlas(atlas,'D010');expect(results.map(r=>r.territory?.name)).toEqual(expect.arrayContaining(['柏林市','勃兰登堡']));});
  it('现代地区合并后，旧条目仍可被搜索',()=>{expect(searchAtlas(atlas,'J008').some(r=>r.territory?.name==='特罗姆斯—芬马克')).toBe(true);});
  it('不区分大小写与拉丁变音',()=>{expect(searchAtlas(atlas,'cesu').some(r=>r.territory?.name==='采西斯市镇')).toBe(true);expect(normalizeSearch('Rīga')).toBe('riga');});
  it('无结果、空查询不返回无关地区',()=>{expect(searchAtlas(atlas,'不存在的地区XYZ')).toEqual([]);expect(searchAtlas(atlas,'  ')).toEqual([]);});
});
