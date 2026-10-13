import { Info } from 'lucide-react';
import type { Source } from './types';

export default function Attribution({ sources }: { sources: Source[] }) {
  return <details className="attribution">
    <summary aria-label="地图数据来源与许可" title="地图数据来源与许可">
      <Info size={18} />
      <span>地图来源</span>
    </summary>
    <div className="attribution-popover">
      <strong>地图数据来源与许可</strong>
      <p>真实行政边界采用 geoBoundaries gbOpen 的固定版本；湖泊来自 Natural Earth。各地区来源与许可如下。</p>
      {sources.map(source => <a key={source.iso} href={source.url} target="_blank" rel="noreferrer">
        <span>{source.country} · {source.year}</span><small>{source.source} · {source.license}</small>
      </a>)}
      <a href="https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_10m_lakes.geojson" target="_blank" rel="noreferrer"><span>内陆水体 · Natural Earth 1:10m lakes</span><small>Public Domain · 固定版本</small></a>
    </div>
  </details>;
}
