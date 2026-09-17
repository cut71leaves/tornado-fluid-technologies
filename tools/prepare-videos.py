"""Prepare browser videos and posters without changing supplied originals.
python tools/prepare-videos.py --source SOURCE_FOLDER --ffmpeg FFMPEG_EXE
Requires Pillow. Video 0/1 preserve original AAC audio; video 2 is copied.
"""
import argparse
import hashlib
import io
import json
import pathlib
import shutil
import subprocess
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--source', type=pathlib.Path, required=True)
parser.add_argument('--ffmpeg', required=True)
args = parser.parse_args()
target = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'videos'
target.mkdir(parents=True, exist_ok=True)
records = []
for number, name, moment in [(0,'prototype',5),(1,'cavitation-science',1),(2,'reaction-concept',2)]:
    source = args.source / f'{number}.mp4'
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    output = target / f'{name}.mp4'
    if number < 2:
        subprocess.run([args.ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(source),
                        '-map','0:v:0','-map','0:a?','-c:v','libx264','-preset','medium',
                        '-crf','19','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',str(output)],check=True)
    else:
        shutil.copy2(source, output)
    frame = subprocess.run([args.ffmpeg,'-hide_banner','-loglevel','error','-ss',str(moment),
                            '-i',str(source),'-frames:v','1','-f','image2pipe','-vcodec','png','-'],
                            check=True,stdout=subprocess.PIPE).stdout
    with Image.open(io.BytesIO(frame)) as image:
        image.save(target / f'{name}.webp',quality=90,method=6)
    assert hashlib.sha256(source.read_bytes()).hexdigest() == digest
    records.append({'source':f'{number}.mp4','sourceSha256':digest,'webVideo':output.name,
                    'poster':f'{name}.webp','sourceUnchanged':True})
(target / 'sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(records,ensure_ascii=False,indent=2))
