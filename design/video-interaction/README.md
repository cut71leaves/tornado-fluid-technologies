# 视频与互动流体维护

后续调整：当前首页已精简，三个视频集中在技术与产品页，独立互动雕塑已移除并停止加载。本文中的首页分段和雕塑说明记录上一版本，相关源码与素材保留供参考。当前导航、视频入口和整页背景的验证使用 `tools/navigation-preview-check.cjs`。

本版本将科普、样机运行记录和反应概念影像分段加入首页，并在技术页、资料中心和空化知识文章提供对应入口。首屏原有循环动画继续使用。

## 三个视频

| 提供的文件 | 网页副本 | 类型 |
| --- | --- | --- |
| 0.mp4 | assets/videos/prototype.mp4 | 样机运行录像与仿真可视化 |
| 1.mp4 | assets/videos/cavitation-science.mp4 | 空化原理科普 |
| 2.mp4 | assets/videos/reaction-concept.mp4 | AI 生成的反应概念影像 |

0、1 号由 HEVC 转为 H.264，保留完整 1280×720 画幅和原 AAC 音轨；2 号逐字节复制。原文件位于工作区的宣传材料目录，未修改。源文件 SHA-256 校验记录保存在 `assets/videos/sources.json`。

更新素材时安装 Pillow，并使用 FFmpeg 执行：

```text
python tools/prepare-videos.py --source SOURCE_FOLDER --ffmpeg FFMPEG_EXE
node tools/build.cjs
node tools/check.cjs
```

标题、时长、说明维护于 `tools/video-catalog.cjs`，组件和页面段落维护于 `tools/video-sections.cjs`。音量、进度和全屏使用浏览器原生控件。播放需用户点击，同一时间只播放一个内容视频；离屏、后台或关闭弹窗时暂停，回到页面不自动恢复内容视频。

`media-player.js` 通过 `window.VORTEX_MEDIA.isPlaying()` 和 `vortex:media-state` 事件协调首屏动画及互动雕塑；事件 detail 的 playing 为布尔值。原有背景动画的用户暂停状态独立保留。

`window.VORTEX_MOTION` 统一持有减少动态效果的媒体查询（reduced），并通过 subscribe(callback) 向首屏和雕塑发送偏好变化，保证两处同时切换为静态显示。

## 原创互动雕塑

形态、形变与摄影棚反射由本项目程序生成，属于品牌概念视觉，非空化物理仿真。鼠标位置和自然页面滚动控制形变、转角与高光；没有拦截 wheel 或 touchmove，也没有锁屏滚动。

实现使用 Three.js 0.180.0，许可证位于 `assets/THREE-LICENSE.txt`。运行包全部在本地，无 CDN、外部模型或远程纹理；桌面靠近展示区才加载，手机/触屏或减少动态效果时不加载。渲染器仅在可见、允许互动且状态变化时工作；内容视频播放时暂停。不可用或加载失败时自动显示静态海报。

源文件：`tools/interaction/sculpture.mjs`。调度与降级逻辑：`fluid-loader.js`。重建流程：

```text
npm ci --prefix tools/interaction
node tools/build-interaction.cjs
node tools/render-sculpture-posters.cjs
node tools/build.cjs
node tools/check.cjs
```

当前任务的构建依赖放在工作区 `work/`，可通过 FLUID_DEPS 指向该目录的 node_modules。重建海报需要 Playwright、Chromium 和 sharp；可用 PLAYWRIGHT_MODULE、CHROMIUM_PATH、SHARP_MODULE 指定已安装位置。海报直接由同一三维实现输出，保留透明背景；手机海报采用单独画幅。

## 验证

`tools/video-interaction-check.cjs` 验证内容视频、互斥播放、弹窗、三维鼠标/滚动交互、暂停、手机静态模式、减少动态效果、加载失败及本地文件访问。设置 VIDEO_CHECK_OUT 将输出定向到工作区 `work/`。

继续运行 `tools/motion-check.cjs` 检查首屏背景动效，运行 `tools/verify.cjs` 检查全站导航、布局和交互。浏览器脚本需要 Playwright 与 Chromium；新增脚本支持 PLAYWRIGHT_MODULE、CHROMIUM_PATH 环境变量。

网页、编码后的素材、构建源码和依赖锁文件应一并提交。渲染截图、依赖缓存和临时脚本不提交到仓库。
