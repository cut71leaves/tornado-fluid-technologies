"""Encode the original Blender PNG sequences; requires Pillow and imageio-ffmpeg.

python tools/encode-fluid.py --desktop RENDER_DIR --mobile PORTRAIT_RENDER_DIR
"""
import argparse
import pathlib
import shutil
import subprocess
import imageio_ffmpeg
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--desktop', type=pathlib.Path, required=True)
parser.add_argument('--mobile', type=pathlib.Path, required=True)
parser.add_argument('--scene', type=pathlib.Path)
parser.add_argument('--only', choices=['desktop','mobile','all'], default='all')
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parent.parent
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
for kind, folder in [('desktop', args.desktop), ('mobile', args.mobile)]:
    if args.only not in ('all',kind):
        continue
    sequence = folder / kind
    frames = sorted(sequence.glob('frame-*.png'))
    if len(frames) != 288:
        raise RuntimeError(f'{kind}: expected 288 frames, found {len(frames)}')
    subprocess.run([ffmpeg, '-y', '-framerate', '24', '-i', str(sequence / 'frame-%04d.png'),
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart', '-an', str(root / 'assets' / f'fluid-{kind}.mp4')], check=True)
    with Image.open(frames[0]) as image:
        image.save(root / 'assets' / f'fluid-{kind}.webp', quality=90, method=6)
source = root / 'design' / 'fluid'
source.mkdir(parents=True, exist_ok=True)
shutil.copy2(args.scene or args.desktop / 'tornado-fluid.blend', source / 'tornado-fluid.blend')
print(f'Encoded 12-second film(s): {args.only}; posters and editable Blender scene saved.')
