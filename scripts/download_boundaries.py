"""下载边界及来源元数据，保存固定版本供离线构建使用。"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json
import urllib.request
import time
import sys

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'.cache/boundaries'
CACHE.mkdir(parents=True,exist_ok=True)
COUNTRIES = ['DEU','CZE','POL','NOR','SWE','FIN','DNK','EST','LVA','LTU','BLR','RUS','UKR']

def fetch(url):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent':'IronCurtainGazetteer/1.0'})
            with urllib.request.urlopen(req, timeout=25) as response:
                return json.load(response)
        except Exception:
            if attempt==3: raise
            time.sleep(2)

def download(iso):
    meta_path=CACHE/f'{iso}-metadata.json'
    data_path=CACHE/f'{iso}.geojson'
    if not meta_path.exists():
        meta=fetch(f'https://www.geoboundaries.org/api/current/gbOpen/{iso}/ADM1/')
        meta_path.write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
    else:
        meta=json.loads(meta_path.read_text(encoding='utf-8'))
    if not data_path.exists():
        url=meta['simplifiedGeometryGeoJSON'].replace('https://github.com/wmgeolab/geoBoundaries/raw/','https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/')
        data=fetch(url)
        data_path.write_text(json.dumps(data,ensure_ascii=False),encoding='utf-8')
    data=json.loads(data_path.read_text(encoding='utf-8'))
    print(iso,meta['boundaryYearRepresented'],len(data['features']),flush=True)
    return iso

if __name__=='__main__':
    with ThreadPoolExecutor(max_workers=4) as executor:
        list(executor.map(download,COUNTRIES))
