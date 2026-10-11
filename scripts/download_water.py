"""固定 Natural Earth 版本，下载公共领域内陆水体轮廓。"""
from pathlib import Path
import urllib.request
import json
import sys

folder=Path(sys.argv[1]);folder.mkdir(parents=True,exist_ok=True)
def get(url):
    request=urllib.request.Request(url,headers={'User-Agent':'IronCurtainAtlas/1.0'})
    with urllib.request.urlopen(request,timeout=45) as response:return json.load(response)
metadata_file=folder/'water-metadata.json'
if metadata_file.exists():meta=json.loads(metadata_file.read_text(encoding='utf-8'))
else:
    commit=get('https://api.github.com/repos/nvkelso/natural-earth-vector/commits/master')['sha']
    meta={'commit':commit,'url':f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{commit}/geojson/ne_10m_lakes.geojson','license':'Public Domain','source':'Natural Earth 1:10m lakes','terms':'https://www.naturalearthdata.com/about/terms-of-use/'}
    metadata_file.write_text(json.dumps(meta,indent=2),encoding='utf-8')
target=folder/'water.geojson'
if not target.exists():target.write_text(json.dumps(get(meta['url']),ensure_ascii=False),encoding='utf-8')
print('Water source pinned:',meta['commit'])
