"""将固定版本真实行政边界与五列地理志对应，生成网页静态数据。"""
from pathlib import Path
from zipfile import ZipFile
import json
import re
import hashlib
from collections import Counter
from xml.etree import ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT.parents[1]
CACHE=ROOT/'.cache/boundaries'
OUT=ROOT/'public/data'
OUT.mkdir(parents=True,exist_ok=True)
records=json.loads((BASE/'.gazetteer-work/all-records.json').read_text(encoding='utf-8'))
by_code={r['code']:r for r in records}
doc=BASE/'魔道祖师_六国地理志_逐地块版.docx'
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(doc) as z:
    table=ET.fromstring(z.read('word/document.xml')).find('.//w:tbl',ns)
    rows=table.findall('w:tr',ns)[1:]
    assert len(rows)==len(records)==172
    for row,r in zip(rows,records):
        text=[''.join(c.itertext()) for c in row.findall('w:tc',ns)]
        assert r['code'] in text[0]
        assert r['china'] in text[2]
        assert r['geography']==text[3]
        assert r['lore'].replace('驻軍','驻军')==text[4]

# 每项依次为来源名称、中文真实名称、原地理志编号；合并区可关联多个旧条目。
mapping={
'DEU':[
('Baden-Württemberg','巴登—符腾堡','D031'),('Bayern','巴伐利亚','D032'),('Berlin','柏林市','D010'),('Brandenburg','勃兰登堡','D010'),
('Bremen','不来梅','D006'),('Hamburg','汉堡','D006'),('Hessen','黑森','D013'),('Mecklenburg-Vorpommern','梅克伦堡—前波美拉尼亚','D007'),
('Niedersachsen','下萨克森','D005'),('Nordrhein-Westfalen','北莱茵—威斯特法伦','D012'),('Rheinland-Pfalz','莱茵兰—普法尔茨','D021'),
('Saarland','萨尔兰','D020'),('Sachsen','萨克森','D015'),('Sachsen-Anhalt','萨克森—安哈尔特','D009'),('Schleswig-Holstein','石勒苏益格—荷尔斯泰因','D001'),('Thüringen','图林根','D014')],
'CZE':[
('Hlavní město Praha','布拉格市','D024'),('Středočeský kraj','中波希米亚','D025'),('Jihočeský kraj','南波希米亚','D033'),('Plzeňský kraj','比尔森','D023'),
('Karlovarský kraj','卡罗维发利','D022'),('Ústecký kraj','乌斯季','D016'),('Liberecký kraj','利贝雷茨','D017'),('Královéhradecký kraj','赫拉德茨—克拉洛韦','D027'),
('Pardubický kraj','帕尔杜比采','D028'),('Kraj Vysočina','维索基纳','D026'),('Jihomoravský kraj','南摩拉维亚','D034'),('Olomoucký kraj','奥洛穆茨','D029'),('Moravskoslezský kraj','摩拉维亚—西里西亚','D030'),('Zlínský kraj','兹林','D035')],
'POL':[
('Subcarpathian Voivodeship','喀尔巴阡山前省','P011'),('Podlaskie Voivodeship','波德拉谢省','P003'),('Łódź Voivodeship','罗兹省','P005'),
('Lower Silesian Voivodeship','下西里西亚省','D018'),('Opole Voivodeship','奥波莱省','D019'),('Świętokrzyskie Voivodeship','圣十字省','P007'),
('Masovian Voivodeship','马佐夫舍省','P006'),('Greater Poland Voivodeship','大波兰省','P004'),('Lesser Poland Voivodeship','小波兰省','P010'),
('Lubusz Voivodeship','卢布什省','D011'),('Kuyavian-Pomeranian Voivodeship','库亚维—波美拉尼亚省','P002'),('Pomeranian Voivodeship','波美拉尼亚省','P001'),
('West Pomeranian Voivodeship','西波美拉尼亚省','D008'),('Lublin Voivodeship','卢布林省','P008'),('Warmian-Masurian Voivodeship','瓦尔米亚—马祖里省','D003'),('Silesian Voivodeship','西里西亚省','P009')],
'NOR':[
('Vestfold og Telemark','韦斯特福尔—泰勒马克','J029 J038'),('Agder','阿格德尔','J037'),('Viken','维肯','J030 J031 J039'),('Rogaland','罗加兰','J036'),
('Nordland','诺尔兰','J012'),('Møre og Romsdal','默勒—鲁姆斯达尔','J022'),('Vestland','韦斯特兰','J023'),('Oslo','奥斯陆市','J031'),
('Trøndelag','特伦德拉格','J017'),('Troms og Finnmark','特罗姆斯—芬马克','J005 J007 J008'),('Innlandet','内陆郡','J024')],
'SWE':[
('Västernorrlands län','西诺尔兰','J019'),('Västerbottens län','西博滕','J015'),('Jämtlands län','耶姆特兰','J018'),('Gävleborgs län','耶夫勒堡','J026'),
('Dalarnas län','达拉纳','J025'),('Uppsala län','乌普萨拉','J034'),('Västmanlands län','西曼兰','J033'),('Örebro län','厄勒布鲁','J041'),
('Värmlands län','韦姆兰','J032'),('Västra Götalands län','西约塔兰','J040'),('Hallands län','哈兰','J049'),('Skåne län','斯科讷','J057'),
('Kronobergs län','克鲁努贝里','J050'),('Blekinge län','布莱金厄','J051'),('Kalmar län','卡尔马','J045'),('Jönköpings län','延雪平','J044'),
('Stockholms län','斯德哥尔摩','J035'),('Östergötlands län','东约特兰','J042'),('Södermanlands län','南曼兰','J043'),('Norrbottens län','北博滕','J014'),('Gotlands län','哥特兰岛','J046')],
'FIN':[
('Uusimaa','新地／赫尔辛基地区','Q017'),('Finland Proper','西南芬兰','Q012'),('Southern Savonia','南萨沃','Q009'),('Northern Savonia','北萨沃','Q006'),
('Tavastia Proper','坎塔海梅','Q014'),('Central Finland','中芬兰','Q008'),('Pirkanmaa','皮尔卡','Q013'),('South Ostrobothnia','南博滕','Q007'),
('Keski-Pohjanmaa','中博滕','Q005'),('Päijät-Häme','派亚特海梅','Q015'),('Lapland','拉普兰','Q001'),('Northern Ostrobothnia','北博滕','Q002'),
('Kainuu','凯努','Q003'),('North Karelia','北卡累利阿','Q010'),('Ostrobothnia','博滕沿海','Q004'),('Satakunta','萨塔昆塔','Q011'),
('South Karelia','南卡累利阿','Q016'),('Kymenlaakso','屈米河谷','Q016'),('Åland Islands','奥兰群岛','Q012')],
'DNK': [('Nordjylland','北日德兰','J048'),('Midtjylland','中日德兰','J047'),('Sjælland','西兰大区','J055'),('Hovedstaden','首都大区／哥本哈根','J056'),('Syddanmark','南丹麦','J053')],
'EST':[
('Saare maakond','萨雷县','B002'),('Pärnu maakond','帕尔努县','B005'),('Hiiu maakond','希尤县','B003'),('Lääne maakond','莱内县','B004'),
('Ida-Viru maakond','东维鲁县','B013'),('Harju maakond','哈留县／塔林','B007'),('Lääne-Viru maakond','西维鲁县','B010'),('Tartu maakond','塔尔图县','B012'),
('Valga maakond','瓦尔加县','B015'),('Viljandi maakond','维尔扬迪县','B009'),('Põlva maakond','珀尔瓦县','B017'),('Järva maakond','耶尔瓦县','B008'),
('Rapla maakond','拉普拉县','B006'),('Võru maakond','沃鲁县','B016'),('Jõgeva maakond','约格瓦县','B011')],
'LTU':[
('Utena County','乌田纳县','S036'),('Marijampole County','马里扬泊列县','S041'),('Vilnius County','维尔纽斯县','S043'),('Panevezys County','帕涅韦日斯县','S035'),
('Kaunas County','考纳斯县','S034'),('Alytus County','阿利图斯县','S042'),('Klaipeda County','克莱佩达县','S031'),('Telsiai County','泰尔希艾县','S012'),('Siauliai County','希奥利艾县','S033'),('Taurage County','陶拉格县','S032')],
'BLR':[('Gomel','戈梅利州','S051'),('Vitebsk','维捷布斯克州','S038'),('Grodno','格罗德诺州','S046'),('Brest','布列斯特州','S050'),('Mogilev','莫吉廖夫州','S048'),('Minsk','明斯克州','S047'),('Minsk City','明斯克市','S044')],
'RUS':[
('Pskov Oblast','普斯科夫州','B018'),('Bryansk Oblast','布良斯克州','S049'),('Leningrad oblast','列宁格勒州','B001'),('Moscow','莫斯科市','S040'),
('Moscow Oblast','莫斯科州','S040'),('Novgorod Oblast','诺夫哥罗德州','B014'),('Saint Petersburg','圣彼得堡市','B001'),('Smolensk Oblast','斯摩棱斯克州','S039'),
('Tver Oblast','特维尔州','S030'),('Kaluga Oblast','卡卢加州','S045'),('Kaliningrad','加里宁格勒／柯尼斯堡','D004')],
'UKR':[('Volyn Oblast','沃伦州','S052'),('Rivne Oblast','罗夫诺州','S053')],
'LVA':[
('Alūksnes novads','阿卢克斯内市镇','S009'),('Līvānu novads','利瓦尼市镇','S025'),('Gulbenes novads','古尔贝内市镇','S008'),('Ventspils novads','文茨皮尔斯市镇','S001'),
('Valkas novads','瓦尔卡市镇','S007'),('Salaspils novads','萨拉斯皮尔斯市镇','S019'),('Jelgavas','叶尔加瓦市','S016'),('Rēzeknes','雷泽克内市','S026'),
('Jūrmalas','尤尔马拉市','S018'),('Ventspils','文茨皮尔斯市','S001'),('Rīga','里加市','S019'),('Liepājas','利耶帕亚市','S010'),
('Dienvidkurzemes novads','南库尔兰市镇','S010'),('Kuldīgas novads','库尔迪加市镇','S011'),('Saldus novads','萨尔杜斯市镇','S013'),('Talsu novads','塔尔西市镇','S002'),
('Tukuma novads','图库姆斯市镇','S014'),('Dobeles novads','多贝莱市镇','S015'),('Jelgavas novads','叶尔加瓦市镇','S016'),('Mārupes novads','马鲁佩市镇','S019'),
('Bauskas novads','包斯卡市镇','S017'),('Ogres novads','奥格雷市镇','S020'),('Aizkraukles novads','艾兹克劳克莱市镇','S021'),('Jēkabpils novads','叶卡布皮尔斯市镇','S022'),
('Ludzas novads','卢德扎市镇','S029'),('Rēzeknes novads','雷泽克内市镇','S026'),('Balvu novads','巴尔维市镇','S027'),('Madonas novads','马多纳市镇','S023'),
('Smiltenes novads','斯米尔泰内市镇','S007'),('Cēsu novads','采西斯市镇','S005'),('Valmieras novads','瓦尔米耶拉市镇','S004'),('Ādažu novads','阿达日市镇','S019'),
('Ropažu novads','罗帕日市镇','S019'),('Siguldas novads','锡古尔达市镇','S005'),('Preiļu novads','普雷利市镇','S025'),('Krāslavas novads','克拉斯拉瓦市镇','S028'),
('Daugavpils','陶格夫匹尔斯市','S037'),('Ķekavas novads','凯卡瓦市镇','S019'),('Olaines novads','奥莱内市镇','S019'),('Saulkrastu novads','绍尔克拉斯蒂市镇','S003'),
('Limbažu novads','林巴日市镇','S003'),('Augšdaugavas novads','上道加瓦市镇','S037'),('Varakļānu novads','瓦拉克利亚尼市镇','S023')]
}
COUNTRY_NAMES={'DEU':'德国','CZE':'捷克','POL':'波兰','NOR':'挪威','SWE':'瑞典','FIN':'芬兰','DNK':'丹麦','EST':'爱沙尼亚','LVA':'拉脱维亚','LTU':'立陶宛','BLR':'白俄罗斯','RUS':'俄罗斯（局部）','UKR':'乌克兰（局部）'}
CUSTOM_NAMES={('DEU','Berlin'):'夷陵／宜昌',('DEU','Brandenburg'):'夷陵·勃兰登堡',('DEU','Bremen'):'叙州·不来梅',('DEU','Hamburg'):'宜宾／叙州',
('NOR','Oslo'):'京兆／长安',('NOR','Viken'):'长安·维肯',('FIN','Finland Proper'):'幽州／北京',('FIN','Åland Islands'):'幽州·奥兰群岛',
('FIN','Kymenlaakso'):'榆关／山海关',('FIN','South Karelia'):'榆关·南卡累利阿',('RUS','Moscow'):'苏州／姑苏',('RUS','Moscow Oblast'):'姑苏·莫斯科州',
('RUS','Saint Petersburg'):'兰陵',('RUS','Leningrad oblast'):'兰陵·列宁格勒州',('LVA','Rīga'):'上海／申城',
('BLR','Minsk'):'合肥·明斯克州'}

def rounded(coords):
    if isinstance(coords[0],(float,int)):
        return [round(coords[0],5),round(coords[1],5)]
    return [rounded(c) for c in coords]

territories=[];features=[];sources=[]
for iso,rows in mapping.items():
    metadata=json.loads((CACHE/f'{iso}-metadata.json').read_text(encoding='utf-8'))
    data=json.loads((CACHE/f'{iso}.geojson').read_text(encoding='utf-8'))
    shapes={f['properties']['shapeName']:f for f in data['features']}
    counts=Counter(c for _,_,codes in rows for c in codes.split())
    sources.append({'iso':iso,'country':COUNTRY_NAMES[iso],'year':metadata['boundaryYearRepresented'],'boundaryId':metadata['boundaryID'],
        'url':metadata['simplifiedGeometryGeoJSON'],'download':metadata['simplifiedGeometryGeoJSON'],'license':metadata['boundaryLicense'],'source':metadata['boundarySource'],
        'fileSha256':hashlib.sha256((CACHE/f'{iso}.geojson').read_bytes()).hexdigest()})
    for name,zh,codes in rows:
        assert name in shapes,(iso,name)
        codes=codes.split();source=by_code[codes[0]];f=shapes[name]
        faction=codes[0][0];assert all(c[0]==faction for c in codes)
        identifier=f'{iso}-{f["properties"]["shapeID"]}'
        inherited=len(codes)>1 or counts[codes[0]]>1 or iso=='LVA'
        review=any(by_code[c]['confidence'] in ['初配','低'] for c in codes) or (iso,name) in [('DEU','Bremen'),('FIN','Åland Islands')]
        match='review' if review else 'inherited' if inherited else 'direct'
        note=''
        if inherited:note='此地块采用真实行政边界，地理与剧情文字为所关联旧地区的背景资料。'
        if len(codes)>1:note+='该真实行政区合并覆盖多个地理志地区，可切换资料条目阅读。'
        if review:note+='边界本身来自公开数据，与原图旧区及故事归属的对应仍需核对。'
        if (iso,name)==('DEU','Bremen'):note='原图未单列不来梅；保留其真实州界，暂沿用汉堡条目的港口背景与德国阵营。'
        if (iso,name)==('FIN','Åland Islands'):note='原图未单列奥兰群岛；采用真实群岛边界，暂沿用西南芬兰地区的故事背景与大清阵营。'
        chinese=CUSTOM_NAMES.get((iso,name),source['china'] if counts[codes[0]]==1 else source['china'].split('／')[0]+'·'+zh)
        if iso=='LVA' and name in ['Ventspils','Liepājas','Jelgavas','Rēzeknes','Daugavpils']:
            chinese=source['china']
        territories.append({'id':identifier,'sourceName':name,'name':zh,'chineseName':chinese,'faction':faction,'iso':iso,'recordIds':codes,'match':match,'note':note})
        geometry=f['geometry'];assert geometry['type'] in ['Polygon','MultiPolygon']
        features.append({'type':'Feature','properties':{'id':identifier},'geometry':{'type':geometry['type'],'coordinates':rounded(geometry['coordinates'])}})

reconciliation=[]
for r in records:
    matches=[t for t in territories if r['code'] in t['recordIds']]
    status='unplaced' if not matches else 'review' if any(t['match']=='review' for t in matches) else 'merged' if any(len(t['recordIds'])>1 for t in matches) else 'split' if len(matches)>1 else 'direct'
    note={'unplaced':'保留地理志资料，未确认真实边界，未绘制猜测轮廓。','review':'真实边界已提供；旧条目对应或架空归属仍需核对。',
        'merged':'多个旧条目对应同一真实行政区。','split':'旧条目拆分对应多个真实行政区。','direct':'对应一个真实行政区。'}[status]
    reconciliation.append({'code':r['code'],'territoryIds':[t['id'] for t in matches],'status':status,'note':note})

water_source=json.loads((CACHE/'water-metadata.json').read_text(encoding='utf-8'))
water_data=json.loads((CACHE/'water.geojson').read_text(encoding='utf-8'))
def points(coords):
    if isinstance(coords[0],(int,float)):yield coords
    else:
        for part in coords:yield from points(part)
water_features=[]
for feature in water_data['features']:
    g=feature.get('geometry')
    if not g or g['type'] not in ['Polygon','MultiPolygon']:continue
    coordinates=list(points(g['coordinates']))
    x0=min(p[0] for p in coordinates);x1=max(p[0] for p in coordinates)
    y0=min(p[1] for p in coordinates);y1=max(p[1] for p in coordinates)
    if x1>=-1 and x0<=42 and y1>=47 and y0<=72:
        water_features.append({'type':'Feature','properties':{'id':str(feature['properties'].get('ne_id',len(water_features))),'name':feature['properties'].get('name','')},'geometry':{'type':g['type'],'coordinates':rounded(g['coordinates'])}})
(OUT/'water.geojson').write_text(json.dumps({'type':'FeatureCollection','features':water_features},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
sources.append({'iso':'HYDRO','country':'内陆水体','year':'1:10m','boundaryId':water_source['commit'],'url':water_source['url'],'download':water_source['url'],'license':water_source['license'],'source':water_source['source'],'fileSha256':hashlib.sha256((CACHE/'water.geojson').read_bytes()).hexdigest()})
atlas={'schemaVersion':1,'title':'魔道祖师','records':records,'territories':territories,'sources':sources,'reconciliation':reconciliation}
(OUT/'atlas.json').write_text(json.dumps(atlas,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(OUT/'geometry.geojson').write_text(json.dumps({'type':'FeatureCollection','features':features},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(OUT/'boundary-manifest.json').write_text(json.dumps({'sources':sources,'referenceDocumentSha256':hashlib.sha256(doc.read_bytes()).hexdigest()},ensure_ascii=False,indent=2),encoding='utf-8')
report=['# 真实边界与地理志对应说明','','以真实区划优先；边界版本固定，年代并不完全一致。原文档未修改。','',f'共 {len(territories)} 个真实地块，保留 {len(records)} 条地理志。','',
        '网页显示别名：S047 明斯克州依当前地图设定显示为「合肥·明斯克州」；原 Word 地理志中的「肥东」作为来源原文保留。','',
        '| 地理志编号 | 故事名称 | 对应真实地区 | 状态 |','| --- | --- | --- | --- |']
for r,m in zip(records,reconciliation):
    names='、'.join(t['name'] for t in territories if t['id'] in m['territoryIds']) or '待核'
    report.append(f'| {r["code"]} | {r["china"]} | {names} | {m["note"]} |')
(ROOT/'边界对应说明.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
print(json.dumps({'territories':len(territories),'records':len(records),'mapped':sum(bool(r['territoryIds']) for r in reconciliation),'factions':dict(Counter(t['faction'] for t in territories))}))
