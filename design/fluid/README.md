# 原创流体动画

首屏动画由旋风流体官网项目原创制作，使用参数化曲面、镜面材质与程序生成的摄影棚反射环境。它是品牌视觉，不代表真实设备、空化仿真或实验结果。参考录屏未作为网站素材使用。

## 可编辑源文件

`tornado-fluid.blend` 包含三层闭合曲面、银色与浅青色材质、已打包的环境光贴图，以及横版、竖版两台固定相机。无需外部图片或插件。动画使用已保存的形态键，打开 Blender 后可直接拖动时间轴查看。

全周期为 12 秒、24 fps，输出第 1–288 帧；第 289 帧的形态与第 1 帧相同，不输出重复端点。横版为 1440×810，竖版为 720×1280。

## 重现与导出

使用 Blender 4.3.2，并为 Python 安装 `Pillow` 和 `imageio-ffmpeg`。在网站目录运行下列命令，将 WORK 替换为工作区 `work/` 下的本任务渲染目录：

```text
blender -b --python tools/fluid-scene.py -- --out WORK/desktop-build --render
blender -b --python tools/fluid-scene.py -- --out WORK/mobile-build --mobile --render
python tools/encode-fluid.py --desktop WORK/desktop-build --mobile WORK/mobile-build
node tools/build.cjs
node tools/check.cjs
```

在渲染命令中将 `--render` 改为 `--preview` 可先输出一张预览。完整序列为中间产物，确认 MP4、WebP 和源文件正常后即可清理。

H.264 视频不含音轨，采用 yuv420p 和 faststart，支持本地浏览与静态网站托管。浏览器按屏幕宽度选择一个版本；减少动态效果时不加载视频，播放失败时保留静态封面。手机版本使用单独构图。

修改材质、曲面或运动参数时，优先更新 `tools/fluid-scene.py` 再重新生成，以保留可复现流程。
