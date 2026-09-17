# 透明水纹背景

水纹传播参考 three.js 的 MIT 许可示例 `webgl_gpgpu_water.html`：
https://threejs.org/examples/webgl_gpgpu_water.html

参考源码：https://github.com/mrdoob/three.js/blob/dev/examples/webgl_gpgpu_water.html
2026-09-17 核对的文件 Git blob：`ed20ac11d6d14bb91c5d8bd2f290928e5b5c34c8`。
使用其相邻网格高度与上一时刻高度计算波传播的方式，原许可保留在 `assets/WATER-LICENSE.txt`。

`assets/water-surface.js` 包含可直接编辑的原生 WebGL2 实现、完整着色器、浅青水面与反光构图；无需 Three.js 运行时、外部纹理、模型、CDN 或后台服务。构图、滚动扰动、边缘衰减与调度为本项目实现。此背景属于装饰性视觉，不是空化物理仿真。

`page-background.js` 根据正常滚动的方向和速度输入扰动，不监听鼠标、不阻止滚动。桌面采用 128×128 高度场和最高 30 fps；手机 64×64 和最高 20 fps。最后一次滚动后约两秒衰减并停止绘制；后台、内容视频播放、减少动态效果时停止绘制。静态封面与动态画面使用同一渲染器生成。

只在首次有效滚动时加载水纹脚本。首页首屏视频保留。WebGL2、浮点帧缓冲或加载失败时使用静态封面，不影响正文和导航。所有内容同时支持本地文件和 GitHub Pages。

重现静态封面：安装 Playwright 和 sharp 后执行 `node tools/render-water-poster.cjs`。也可通过 PLAYWRIGHT_MODULE、SHARP_MODULE、CHROMIUM_PATH 指定已有依赖位置。无需额外三维软件。修改水面配色或着色器后应重新生成封面，运行 `node tools/build.cjs`、`node tools/check.cjs` 与 `node tools/water-check.cjs`。

新版技术页保留原有标题文字及视频锚点，以样机实拍录像开场，再展示科普和概念影像。标题对比、三个播放器顺序、首屏可见性、帧率和停止绘制均有对应检查。
