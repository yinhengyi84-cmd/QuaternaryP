import { useEffect, useMemo, useRef, useState } from 'react';
import { geoArea, geoConicConformal, geoPath } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import type { Feature } from 'geojson';
import type { AtlasGeometry, City, FactionId, Territory, TerritoryFeature } from './types';
import { factionOf } from './atlas';
import { Crosshair, Minus, Plus } from 'lucide-react';

interface Props { geometry: AtlasGeometry; water: AtlasGeometry; cities: City[]; territories: Territory[]; selectedId: string | null; focus: { id: string; nonce: number } | null; faction: FactionId | null; onSelect: (id: string) => void; }
// GeoJSON 保持标准方向，绘制时转换为 D3 的球面绕向，避免把小行省画成整个地球。
function forProjection(feature: TerritoryFeature): TerritoryFeature {
  if (geoArea(feature) <= 2 * Math.PI) return feature;
  const g = feature.geometry;
  return { ...feature, geometry: g.type === 'Polygon' ? { ...g, coordinates: g.coordinates.map(r => [...r].reverse()) } : { ...g, coordinates: g.coordinates.map(p => p.map(r => [...r].reverse())) } };
}
export default function MapView({ geometry, water, cities, territories, selectedId, focus, faction, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const behavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const animation = useRef<number | null>(null);
  function stopAnimation() { if(animation.current!==null){cancelAnimationFrame(animation.current);animation.current=null;} }
  const dragged = useRef(false);
  const origin = useRef<[number, number] | null>(null);
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  const [hover, setHover] = useState<{ territory: Territory; x: number; y: number } | null>(null);
  const [displayScale, setDisplayScale] = useState(1);
  const [compact, setCompact] = useState(false);
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const dictionary = useMemo(() => new Map(territories.map(t => [t.id,t])), [territories]);
  const projectionResult = useMemo(() => {
    const features = geometry.features.map(forProjection);
    const collection = { type: 'FeatureCollection' as const, features };
    const projection = geoConicConformal().parallels([50,65]).rotate([-20,0]).fitExtent([[55,45],[945,850]],collection);
    const path = geoPath(projection);
    return { regions:features.map(f => ({ id:f.properties.id, d:path(f as Feature) || '', bounds:path.bounds(f), center:path.centroid(f), area:path.area(f) })), waters:water.features.map(forProjection).map(f=>({id:f.properties.id,d:path(f)||''})), projection };
  }, [geometry,water]);
  const projected=projectionResult.regions;
  const projectedCities=useMemo(()=>cities.map(city=>({city,point:projectionResult.projection(city.coordinates)})).filter((item):item is {city:City;point:[number,number]}=>Boolean(item.point)),[cities,projectionResult]);

  useEffect(()=>{
    const svg=svgRef.current;
    if(!svg)return;
    const update=()=>{const box=svg.getBoundingClientRect();setDisplayScale(Math.max(.01,Math.min(box.width/1000,box.height/900)));setCompact(box.width<500);};
    update();const observer=new ResizeObserver(update);observer.observe(svg);return()=>observer.disconnect();
  },[]);

  useEffect(() => {
    const svg = svgRef.current!;
    const z = zoom<SVGSVGElement,unknown>().scaleExtent([1,24]).extent([[0,0],[1000,900]]).translateExtent([[-220,-200],[1220,1100]])
      .clickDistance(6).filter(event => !event.ctrlKey || event.type === 'wheel')
      .on('start', event => { setHover(null); if(event.sourceEvent)stopAnimation(); })
      .on('zoom', event => setTransform(event.transform));
    behavior.current=z;
    select(svg).call(z).on('dblclick.zoom',null);
    return () => { select(svg).on('.zoom',null); behavior.current=null; };
  }, []);
  useEffect(() => {
    if (!focus || !behavior.current || !svgRef.current) return;
    const item=projected.find(p=>p.id===focus.id);
    if (!item) return;
    const [[x0,y0],[x1,y1]]=item.bounds;
    const k=Math.min(18, Math.max(2, .62/Math.max((x1-x0)/1000,(y1-y0)/900)));
    const target=zoomIdentity.translate(500-k*(x0+x1)/2,450-k*(y0+y1)/2).scale(k);
    // 动画采用逐帧插值，不依赖额外的 D3 DOM 动画操作。
    const svg=select(svgRef.current);const start=transform;let frame=0;const then=performance.now();
    stopAnimation();
    function step(now:number) { if(!behavior.current)return;const progress=reducedMotion?1:Math.min(1,(now-then)/380);const t=1-Math.pow(1-progress,3);svg.call(behavior.current.transform, zoomIdentity.translate(start.x+(target.x-start.x)*t,start.y+(target.y-start.y)*t).scale(start.k+(target.k-start.k)*t));if(progress<1){frame=requestAnimationFrame(step);animation.current=frame;}else animation.current=null; }
    frame=requestAnimationFrame(step);animation.current=frame;return()=>{cancelAnimationFrame(frame);};
    // 只在明确的定位请求时执行，普通拖动不会触发定位。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[focus,projected,reducedMotion]);
  const cityLayout=useMemo(()=>{
    const occupied:[number,number,number,number][]=[];
    const scale=1/displayScale;
    // 姑苏是苏俄首都，先为它保留全图标牌位置，再安排其他城市。
    const sorted=[...projectedCities].sort((a,b)=>Number(b.city.id==='s-gusu')-Number(a.city.id==='s-gusu')||Number(b.city.role==='capital')-Number(a.city.role==='capital'));
    return sorted.map(({city,point})=>{
      const x=point[0]*transform.k+transform.x,y=point[1]*transform.k+transform.y;
      const labelWidth=compact?(city.role==='capital'?63:43):(city.role==='capital'?74:48);
      const labelHeight=compact?23:25;
      const width=labelWidth*scale,height=labelHeight*scale,gap=13*scale;
      const options:[number,number][]=[[x+gap,y-height/2],[x-gap-width,y-height/2],[x-width/2,y-gap-height],[x-width/2,y+gap]];
      // 北欧湾口的首都较密集，标签可沿周围空白海面阶梯排布。
      for(const distance of [29,55,82]){
        const offset=distance*scale;
        options.push([x+gap,y-height/2-offset],[x-gap-width,y-height/2-offset],[x+gap,y-height/2+offset],[x-gap-width,y-height/2+offset]);
      }
      const position=options.find(([left,top])=>left>=7&&top>=7&&left+width<=993&&top+height<=893&&!occupied.some(([a,b,c,d])=>left<c+4*scale&&left+width>a-4*scale&&top<d+4*scale&&top+height>b-4*scale))
        ?? (city.id==='s-gusu'&&transform.k<=1.3?[Math.max(7,Math.min(993-width,x-gap-width)),Math.max(7,Math.min(893-height,y-height/2))] as [number,number]:undefined);
      if(position)occupied.push([position[0],position[1],position[0]+width,position[1]+height]);
      return {city,x,y,label:compact&&transform.k<2&&city.role==='major'?undefined:position,labelWidth,labelHeight,visible:x>=-20&&x<=1020&&y>=-20&&y<=920};
    });
  },[projectedCities,transform,displayScale,compact]);
  // 按屏幕像素设定字号，随地图放大缓慢增长，避免手机上被 viewBox 缩成几像素。
  const labelPixels=Math.min(18,(compact?12:11)+2*Math.log2(Math.max(1,transform.k/(compact?2:1))));
  const labelFontSize=labelPixels/displayScale;
  const labelSpacing=.8/displayScale;
  const visibleLabels=useMemo(() => {
    const gap=4/displayScale;
    const occupied: [number,number,number,number][]=[];
    const overlaps=(box:[number,number,number,number],other:[number,number,number,number])=>box[0]<other[2]+gap&&box[2]>other[0]-gap&&box[1]<other[3]+gap&&box[3]>other[1]-gap;
    // 同时避让城市图标和标牌，长地区名称使用完整文字宽度参与布局。
    const cityBoxes=cityLayout.filter(c=>c.visible).flatMap(c=>{
      const radius=14/displayScale;
      const boxes:[number,number,number,number][]=[[c.x-radius,c.y-radius,c.x+radius,c.y+radius]];
      if(c.label)boxes.push([c.label[0],c.label[1],c.label[0]+c.labelWidth/displayScale,c.label[1]+c.labelHeight/displayScale]);
      return boxes;
    });
    return projected.flatMap(p => {
      if (!Number.isFinite(p.center[0]) || !Number.isFinite(p.center[1]) || (compact&&transform.k<2) || p.area*transform.k*transform.k<2300 || (faction && dictionary.get(p.id)?.faction!==faction)) return [];
      const x=p.center[0]*transform.k+transform.x,y=p.center[1]*transform.k+transform.y;
      const name=dictionary.get(p.id)!.chineseName.split('／')[0].split('·')[0];
      const chars=Array.from(name);
      const width=chars.reduce((sum,char)=>sum+labelFontSize*(/[\x00-\x7f]/.test(char)?.65:1),0)+chars.length*labelSpacing;
      const height=labelFontSize*1.3;
      const box:[number,number,number,number]=[x-width/2,y-height/2,x+width/2,y+height/2];
      if(box[0]<gap||box[2]>1000-gap||box[1]<gap||box[3]>900-gap||occupied.some(other=>overlaps(box,other))||cityBoxes.some(other=>overlaps(box,other)))return [];
      occupied.push(box);return [{id:p.id,x,y,name}];
    });
  },[projected,transform,faction,dictionary,cityLayout,displayScale,compact,labelFontSize,labelSpacing]);
  function reset() { stopAnimation();if(behavior.current&&svgRef.current)select(svgRef.current).call(behavior.current.transform,zoomIdentity); }
  function scale(factor:number) { stopAnimation();if(behavior.current&&svgRef.current)select(svgRef.current).call(behavior.current.scaleBy,factor,[500,450]); }
  return <div className="map-stage" data-testid="map-stage">
    <div className="map-watermark">THE NORTHERN THEATRE<span>北 方 战 区</span></div>
    <svg ref={svgRef} className="atlas-map" viewBox="0 0 1000 900" aria-label="魔道祖师六国交互地图"
      onPointerDown={e=>{origin.current=[e.clientX,e.clientY];dragged.current=false;}}
      onPointerMove={e=>{if(origin.current&&Math.hypot(e.clientX-origin.current[0],e.clientY-origin.current[1])>6)dragged.current=true;}}
      onPointerUp={()=>{origin.current=null;}} onPointerCancel={()=>{origin.current=null;dragged.current=true;}} onMouseLeave={()=>setHover(null)}>
      <defs><pattern id="sea-grid" width="90" height="90" patternUnits="userSpaceOnUse"><path d="M90 0H0V90" fill="none" stroke="#597078" strokeOpacity=".07" strokeWidth="1"/></pattern></defs>
      <rect width="1000" height="900" fill="url(#sea-grid)"/>
      <g transform={transform.toString()}>
        {projected.map(p=>{const t=dictionary.get(p.id)!;const selected=selectedId===p.id;return <path key={p.id} d={p.d} className={`province ${selected?'selected':''}`} data-territory-id={p.id} data-testid={`territory-${p.id}`} style={{fill:factionOf(t.faction).color,opacity:faction&&faction!==t.faction? .19:1}}
          role="button" aria-label={`${t.chineseName}，${t.name}，${factionOf(t.faction).name}`} aria-pressed={selected} tabIndex={selected?0:-1}
          onClick={e=>{if(!dragged.current&&!e.defaultPrevented)onSelect(p.id);}}
          onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(p.id);}}}
          onMouseMove={e=>{if(!origin.current)setHover({territory:t,x:e.clientX,y:e.clientY});}}
          onMouseLeave={()=>setHover(null)}><title>{t.chineseName} · {t.name}</title></path>})}
        {projectionResult.waters.map(p=><path key={p.id} d={p.d} aria-hidden="true" className="inland-water" fill="#17282e" fillRule="evenodd" stroke="#17282e" strokeWidth=".4" vectorEffect="non-scaling-stroke" onClick={e=>e.stopPropagation()} onMouseMove={()=>setHover(null)}/>)}
      </g>
      <g className="province-label-layer" aria-hidden="true">
        {visibleLabels.map(p=><text key={p.id} x={p.x} y={p.y} className="province-label" dominantBaseline="middle" fontSize={labelFontSize} strokeWidth={2/displayScale} style={{letterSpacing:labelSpacing}}>{p.name}</text>)}
      </g>
      <g className="city-layer">
        {cityLayout.filter(item=>item.visible).map(({city,x,y,label,labelWidth,labelHeight})=>{
          const t=dictionary.get(city.territoryId)!;
          const dimmed=Boolean(faction&&faction!==t.faction);
          const selected=selectedId===city.territoryId;
          const scale=1/displayScale;
          return <g key={city.id} className={`city-marker ${city.role} ${selected?'selected':''} ${dimmed?'dimmed':''}`} data-city-id={city.id} data-role={city.role}
            onClick={e=>{e.stopPropagation();if(!dragged.current)onSelect(city.territoryId);}}
            onMouseMove={e=>{if(!origin.current)setHover({territory:t,x:e.clientX,y:e.clientY});}}
            onMouseLeave={()=>setHover(null)}>
            <title>{city.name} · {city.europe} · {city.role==='capital'?'首都':'战略城市'}</title>
            <g transform={`translate(${x} ${y}) scale(${scale})`}>
              <circle className="city-hit" r="18" role="button" tabIndex={0} aria-label={`${city.name}，${city.europe}，${city.role==='capital'?'首都':'战略城市'}，${factionOf(t.faction).name}`}
                onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(city.territoryId);}}}/>
              <g transform={compact?'scale(.78)':undefined}>{city.role==='capital'?<><circle className="capital-halo" r="13"/><path className="capital-star" d="M0,-8.5 2.1,-2.6 8.2,-2.6 3.3,1.1 5.1,7.4 0,3.9 -5.1,7.4 -3.3,1.1 -8.2,-2.6 -2.1,-2.6Z"/></>:<><circle className="major-halo" r="9"/><circle className="major-dot" r="4.7"/></>}</g>
            </g>
            {label&&Math.hypot(label[0]-x,label[1]-y)>40*scale&&<line className="city-leader" x1={x} y1={y} x2={Math.max(label[0],Math.min(x,label[0]+labelWidth*scale))} y2={Math.max(label[1],Math.min(y,label[1]+labelHeight*scale))}/>}
            {label&&<g transform={`translate(${label[0]} ${label[1]}) scale(${scale})`} className="city-label">
              <rect width={labelWidth} height={labelHeight} rx="3"/>
              <text x="9" y={compact?16:17}>{city.name}</text>
            </g>}
          </g>;
        })}
      </g>
    </svg>
    {hover&&<div className="map-tooltip" style={{left:Math.min(window.innerWidth-210,hover.x+14),top:Math.min(window.innerHeight-85,hover.y+15)}}><strong>{hover.territory.chineseName}</strong><span>{hover.territory.name} · {factionOf(hover.territory.faction).name}</span></div>}
    <div className="map-coordinate"><span>55° N / 20° E</span><i/>欧洲战区 · 真实行政边界</div>
    <div className="map-controls"><button onClick={()=>scale(1.5)} aria-label="放大地图"><Plus size={18}/></button><span data-testid="zoom-level">{Math.round(transform.k*100)}%</span><button onClick={()=>scale(1/1.5)} aria-label="缩小地图"><Minus size={18}/></button><div className="control-divider"/><button onClick={reset} aria-label="恢复全图"><Crosshair size={18}/></button></div>
    <div className="map-instruction">拖动探索<span>·</span>滚轮缩放<span>·</span>点击行省查看档案</div>
  </div>;
}
