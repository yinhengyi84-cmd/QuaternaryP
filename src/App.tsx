import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowDownLeft, BookOpen, ChevronRight, Compass, Crosshair, UserRound, Globe2, Info, Layers3, Map, Search, Shield, X } from 'lucide-react';
import MapView from './MapView';
import Attribution from './Attribution';
import PlayPrototype from './PlayPrototype';
import ChooseCharacter from './ChooseCharacter';
import OpeningDraw from './OpeningDraw';
import OpeningEntrance from './OpeningEntrance';
import { getPreviewAssignmentRevision, readPreviewCharacterId, subscribePreviewAssignment } from './opening-assignment';
import { resolveAppRoute } from './navigation';
import { usePlaySession } from './usePlaySession';
import { FACTIONS, factionOf, recordDisplayName, searchAtlas } from './atlas';
import type { AtlasData, AtlasGeometry, CityData, FactionId, GazetteerRecord, Territory } from './types';

type Panel = 'details' | 'directory';
export default function App() {
  const [data,setData]=useState<AtlasData|null>(null);const [geometry,setGeometry]=useState<AtlasGeometry|null>(null);
  const [water,setWater]=useState<AtlasGeometry|null>(null);
  const [cityData,setCityData]=useState<CityData|null>(null);
  const [error,setError]=useState('');const [retry,setRetry]=useState(0);
  const [selectedId,setSelectedId]=useState<string|null>(null);const [recordCode,setRecordCode]=useState<string|null>(null);
  const [faction,setFaction]=useState<FactionId|null>(null);const [panel,setPanel]=useState<Panel>('details');
  const [query,setQuery]=useState('');const [searchOpen,setSearchOpen]=useState(false);const [activeResult,setActiveResult]=useState(0);
  const [directoryQuery,setDirectoryQuery]=useState('');const [mobileOpen,setMobileOpen]=useState(false);
  const [focus,setFocus]=useState<{id:string;nonce:number}|null>(null);const inputRef=useRef<HTMLInputElement>(null);
  const [hash,setHash]=useState(()=>window.location.hash);
  const revision = useSyncExternalStore(subscribePreviewAssignment, getPreviewAssignmentRevision);
  const characterId = readPreviewCharacterId();
  const route = resolveAppRoute(hash, characterId);
  const playSession = usePlaySession(characterId, revision);
  const needsAtlas = route === 'atlas' || route === 'play';
  useEffect(()=>{const sync=()=>setHash(window.location.hash);window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[]);
  useEffect(() => {
    const canonical = `#/${route}`;
    if (window.location.hash !== canonical) {
      window.history.replaceState(window.history.state, '', canonical);
      setHash(canonical);
    }
    window.scrollTo(0, 0);
  }, [route, hash]);
  useEffect(()=>{if(!needsAtlas)return;const controller=new AbortController();setError('');
    Promise.all(['atlas.json','geometry.geojson','water.geojson','cities.json'].map(async file=>{const r=await fetch(`${import.meta.env.BASE_URL}data/${file}`,{signal:controller.signal});if(!r.ok)throw Error('资料文件未能加载');return r.json();}))
      .then(([a,g,w,c])=>{setData(a);setGeometry(g);setWater(w);setCityData(c);}).catch(e=>{if(e.name!=='AbortError')setError('地图资料暂时无法加载，请检查本地服务后重试。');});
    return()=>controller.abort();},[retry,needsAtlas]);
  useEffect(()=>{function keys(e:KeyboardEvent){if(route!=='atlas')return;if(e.key==='Escape'){setSearchOpen(false);setMobileOpen(false);}if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();inputRef.current?.focus();setSearchOpen(true);}}
    window.addEventListener('keydown',keys);return()=>window.removeEventListener('keydown',keys);},[route]);
  const selected=data?.territories.find(t=>t.id===selectedId);
  const record=data?.records.find(r=>r.code===(recordCode||selected?.recordIds[0]));
  const results=useMemo(()=>data?searchAtlas(data,query,cityData?.cities):[],[data,cityData,query]);
  const directory=useMemo(()=>data?.records.filter(r=>(!faction||r.code[0]===faction)&&`${recordDisplayName(r)} ${r.china} ${r.europe} ${r.code}`.toLocaleLowerCase().includes(directoryQuery.toLocaleLowerCase()))||[],[data,faction,directoryQuery]);
  function choose(id:string,locate=false) {setSelectedId(id);setRecordCode(null);setPanel('details');setMobileOpen(true);setSearchOpen(false);if(locate){setFocus({id,nonce:Date.now()});setFaction(null);}}
  function chooseRecord(r:GazetteerRecord) {const territories=data!.territories.filter(t=>t.recordIds.includes(r.code));if(territories.length===1){choose(territories[0].id,true);setRecordCode(r.code);}else{setRecordCode(r.code);setSelectedId(null);setPanel('details');setMobileOpen(true);setSearchOpen(false);}}
  function openPanel(p:Panel){setPanel(p);setMobileOpen(true);setSearchOpen(false);}
  function chooseResult(index:number) {const result=results[index];if(result?.territory)choose(result.territory.id,true);else if(result?.record)chooseRecord(result.record);}
  if(route==='opening')return <OpeningEntrance/>;
  if(route==='choose')return <ChooseCharacter/>;
  if(route==='draw')return <OpeningDraw/>;
  if(route==='play')return <PlayPrototype session={playSession} data={data} geometry={geometry} water={water} cityData={cityData} error={error} onRetry={()=>setRetry(n=>n+1)} onOpenAtlas={id=>{if(id)choose(id,true);window.location.hash='#/atlas';}}/>;
  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#/atlas" onClick={e=>{e.preventDefault();setSelectedId(null);setRecordCode(null);setPanel('details');setMobileOpen(false);}} aria-label="重置地图志视图"><span className="brand-emblem"><Compass size={29}/></span><div><strong>魔道祖师</strong><span>GRANDMASTER OF DEMONIC CULTIVATION</span></div></a>
      <div className="edition"><span className="edition-dot"/>战略地理志<span className="edition-sub">FIRST EDITION</span></div>
      <div className="search-wrap" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setSearchOpen(false);}}>
        <Search size={17}/><input ref={inputRef} aria-label="搜索地区" role="combobox" aria-autocomplete="list" aria-expanded={searchOpen&&Boolean(query)} aria-controls="search-results" aria-activedescendant={searchOpen&&results.length?`result-${activeResult}`:undefined} placeholder="搜索地名、行省或编号…" value={query} onChange={e=>{setQuery(e.target.value);setActiveResult(0);setSearchOpen(true);}} onFocus={()=>setSearchOpen(true)}
          onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setActiveResult(i=>Math.min(results.length-1,i+1));}if(e.key==='ArrowUp'){e.preventDefault();setActiveResult(i=>Math.max(0,i-1));}if(e.key==='Enter'){e.preventDefault();chooseResult(activeResult);}}}/>
        {query?<button className="clear-search" aria-label="清空搜索" onClick={()=>{setQuery('');inputRef.current?.focus();}}><X size={14}/></button>:<kbd>Ctrl K</kbd>}
        {searchOpen&&query&&<div className="search-results" id="search-results" role="listbox"><div className="search-heading">{results.length?`找到 ${results.length} 个结果`:'未找到对应地区'}</div>{results.map((result,i)=><button key={result.city?.id||result.territory?.id||result.record?.code} role="option" aria-selected={activeResult===i} id={`result-${i}`} className={activeResult===i?'active':''} onMouseEnter={()=>setActiveResult(i)} onMouseDown={e=>e.preventDefault()} onClick={()=>chooseResult(i)}><span className="result-dot" style={{background:factionOf((result.territory?.faction||result.record!.code[0]) as FactionId).color}}/><span><strong>{result.city?.name||result.territory?.chineseName||(result.record&&recordDisplayName(result.record))}</strong><small>{result.city?`${result.city.europe} · ${result.territory?.name}`:result.territory?.name||result.record?.europe}</small></span><ChevronRight size={15}/></button>)}</div>}
      </div>
      <a className="play-entry" href="#/play"><UserRound size={17}/>玩家主页面</a>
      <Attribution sources={data?.sources||[]}/>
    </header>
    <div className="workspace">
      <nav className="rail" aria-label="地图工具"><button className={panel==='details'?'active':''} aria-label="地区档案" onClick={()=>openPanel('details')}><Map size={20}/></button><button className={panel==='directory'?'active':''} aria-label="地理志目录" onClick={()=>openPanel('directory')}><BookOpen size={20}/></button><span className="rail-bottom">N<br/>↑</span></nav>
      <main className="map-area">
        <div className="theatre-title"><span className="eyebrow">EUROPEAN THEATRE / 六国版图</span><h1>地理志</h1><p>以欧洲为版图，以熟悉的名字进入故事。</p></div>
        {error?<div className="loading-state" role="alert"><Globe2 size={36}/><h2>地图加载失败</h2><p>{error}</p><button className="primary-button" onClick={()=>setRetry(n=>n+1)}>重新加载</button></div>:data&&geometry&&water&&cityData?<MapView water={water} geometry={geometry} cities={cityData.cities} territories={data.territories} selectedId={selectedId} focus={focus} faction={faction} onSelect={id=>choose(id)}/>:<div className="loading-state" role="status"><Compass className="loading-compass" size={40}/><h2>正在展开战区地图</h2><p>载入行省边界与地理档案…</p></div>}
        <div className="legend"><div className="legend-title"><Layers3 size={15}/><span>势力版图</span><button onClick={()=>setFaction(null)} aria-label="显示全部阵营" disabled={!faction}>全部</button></div><div className="legend-items">{FACTIONS.map(f=><button key={f.id} className={faction===f.id?'active':''} aria-pressed={faction===f.id} onClick={()=>setFaction(v=>v===f.id?null:f.id)}><span style={{background:f.color}}/>{f.name}<small>{data?.territories.filter(t=>t.faction===f.id).length||'—'}</small></button>)}</div><div className="city-key"><span>★ 首都</span><span>● 战略城市</span></div></div>
      </main>
      <button className="mobile-toggle" onClick={()=>setMobileOpen(v=>!v)}><BookOpen size={17}/>{selected?.chineseName||(record&&recordDisplayName(record))||'打开地理档案'}<ChevronRight size={17}/></button>
      <aside className={`dossier ${mobileOpen?'mobile-open':''}`} aria-label="地理资料面板">
        <div className="panel-tabs"><button className={panel==='details'?'active':''} onClick={()=>setPanel('details')}>地区档案</button><button className={panel==='directory'?'active':''} onClick={()=>setPanel('directory')}>地理志</button><button className="mobile-close" aria-label="关闭资料面板" onClick={()=>setMobileOpen(false)}><X size={17}/></button></div>
        <div className="panel-scroll">
          {panel==='details'&&data&&(record?<Dossier sourceRecords={data.records.filter(r=>selected?.recordIds.includes(r.code))} onSourceRecord={code=>setRecordCode(code)} record={record} territory={selected} related={data.territories.filter(t=>t.recordIds.includes(record.code))} onChoose={id=>choose(id,true)} onLocate={()=>selected&&setFocus({id:selected.id,nonce:Date.now()})}/>:<div className="welcome-dossier"><span className="eyebrow">FIELD ARCHIVE / 战区档案</span><div className="archive-illustration"><div className="archive-ring"/><Shield size={46} strokeWidth={1}/><span>VI</span></div><h2>每一块土地，<br/>都有它的故事。</h2><p>从北海港湾到东部林原，探索六个阵营的行省、战略要地与人物往事。</p><div className="welcome-stats"><div><strong>{data.territories.length}</strong><span>真实边界地块</span></div><div><strong>{data.records.length}</strong><span>地理志条目</span></div></div><div className="welcome-hint"><ArrowDownLeft size={20}/><span>点击地图上的行省<br/><small>或搜索一个熟悉的名字</small></span></div><button className="primary-button" onClick={()=>openPanel('directory')}>浏览地理志<BookOpen size={16}/></button><div className="archive-note"><span className="eyebrow">关于这份地图</span><p>中国名称用于故事代入，地形与边界依据欧洲真实地理。阵营归属为架空设定。</p></div></div>)}
          {panel==='directory'&&<div className="directory-panel"><span className="eyebrow">GAZETTEER / 地理志目录</span><h2>山河档案</h2><p className="muted">完整保留 {data?.records.length||172} 条故事地区资料。</p><label className="directory-search"><Search size={15}/><input aria-label="筛选地理志" placeholder="筛选名称或编号" value={directoryQuery} onChange={e=>setDirectoryQuery(e.target.value)}/></label><div className="directory-count">{faction?`${factionOf(faction).name} · `:''}{directory.length} 条记录</div>{directory.map(r=>{const n=data!.territories.filter(t=>t.recordIds.includes(r.code)).length;return <button className="directory-record" key={r.code} onClick={()=>chooseRecord(r)}><div className="record-code" style={{color:factionOf(r.code[0] as FactionId).color}}>{r.code}</div><div><strong>{recordDisplayName(r)}</strong><small>{r.europe.split('(')[0].split('（')[0]}</small><span>{n?`${n} 个对应地块`:'边界对应待核'}</span></div><ChevronRight size={15}/></button>})}{!directory.length&&<p className="empty-results">没有符合筛选条件的条目。</p>}</div>}
        </div>
        <footer className="panel-footer"><span className="live-dot"/>本地地图档案<span>VOL. 01</span></footer>
      </aside>
    </div>
  </div>;
}
function Dossier({record,territory,related,onChoose,onLocate,sourceRecords,onSourceRecord}:{record:GazetteerRecord;territory?:Territory;related:Territory[];onChoose:(id:string)=>void;onLocate:()=>void;sourceRecords:GazetteerRecord[];onSourceRecord:(code:string)=>void}) {
  const faction=factionOf((territory?.faction||record.code[0]) as FactionId);
  return <article className="region-dossier"><div className="dossier-meta"><span className="eyebrow">REGIONAL DOSSIER</span><span>{record.code}</span></div><span className="faction-badge" style={{color:faction.color,borderColor:`${faction.color}66`}}><Shield size={12}/>{faction.name} · {faction.subtitle}</span><h2 data-testid="region-title">{territory?.chineseName||recordDisplayName(record)}</h2><p className="region-europe">{territory?.name||record.europe}</p>{territory&&<button className="locate-button" onClick={onLocate}><Crosshair size={14}/>定位此地块</button>}
    {sourceRecords.length>1&&<label className="source-switcher">关联地理志条目<select aria-label="关联地理志条目" value={record.code} onChange={e=>onSourceRecord(e.target.value)}>{sourceRecords.map(r=><option key={r.code} value={r.code}>{r.code} · {recordDisplayName(r)}</option>)}</select></label>}
    <div className="dossier-rule"/><dl className="region-facts"><div><dt>故事名称</dt><dd>{recordDisplayName(record)}</dd></div><div><dt>现实原型</dt><dd>{record.europe}</dd></div><div><dt>资料对应</dt><dd>{!territory?'查看下方地块':territory.match==='direct'?'直接对应':territory.match==='review'?'对应待核':'所属地区资料'}</dd></div></dl>
    {territory?.note&&<p className="mapping-note"><Info size={14}/><span>{territory.note}</span></p>}
    <section className="dossier-section"><h3><span>01</span>地理与战略</h3><p>{record.geography}</p></section><section className="dossier-section lore-section"><h3><span>02</span>剧情与博弈</h3><p>{record.lore}</p></section>
    {related.length>1||!territory?<section className="related-section"><h3>{related.length?'对应的真实地块':'边界对应待核'}</h3>{related.map(t=><button key={t.id} onClick={()=>onChoose(t.id)}><span>{t.chineseName}<small>{t.name}</small></span><ChevronRight size={14}/></button>)}{!related.length&&<p>该条目的真实边界尚未确认，保留资料供查阅，未绘制猜测轮廓。</p>}</section>:null}
    <div className="dossier-stamp">魔道祖师<span>GEOGRAPHICAL ARCHIVE</span></div></article>;
}
