# 旋风流体品牌官网

英文品牌：Tornado Fluid Technologies  
核心技术：悬浮空化技术  
版本：原创首页流体动效版 2026-09-17

## 浏览

解压完整文件夹，使用 Chrome 或 Edge 打开 index.html。页面、图片、图标、搜索和下载资料均位于本地，浏览不需要启动服务器。

## 内容

网站包含品牌首页、技术与产品、6 个行业、35 个细分场景、13 项工艺、4 篇技术文章、资料中心、关于我们、联系页面、隐私说明、使用条款及英文概览。所有内容页为独立 HTML，支持直接访问、浏览器返回和站内搜索。

搜索在浏览器内运行。技术轮播和内容筛选可直接使用。资料中心的概览与准备清单均可真实下载。

首页加入 12 秒原创银白、浅青色流体动画，电脑与手机采用独立构图。视频静音循环，可手动暂停；离开首屏或切换后台时暂停，开启系统“减少动态效果”时只显示封面。视频无法播放时仍可正常阅读和使用网站。

## 当前上线状态

前端与静态内容已完成，源码协作仓库为 https://github.com/cut71leaves/tornado-fluid-technologies 。目前尚未启用 GitHub Pages 公网网站。

正式上线需要落实以下实际信息：

- 企业正式对外联系方式、运营主体和域名。
- 邮件或咨询接收方式。当前表单只在本地生成需求摘要，不上传或发送信息。
- 实际样机照片、视频和可公开的技术参数及实验报告。参考图的模块影像已明确标注为概念示意。
- 中文、英文品牌和图形商标的正式核验。
- 与实际托管服务和咨询接收系统相匹配的隐私说明，以及适用的主体备案信息。

不会将参考图中的 50+、3x、-60%、100+ 当作公司业绩。信息带中的 6 个行业、13 项工艺是网站内容分类数量；演示样机可运行来自已确认信息。

## 维护

多人协作流程见 [CONTRIBUTING.md](CONTRIBUTING.md)。提交前运行静态构建、英文品牌与本地资源检查。自动检查模板位于 `tools/github-check.yml`；获得 GitHub 工作流权限后，将其放入 `.github/workflows/check.yml` 即可启用提交与 Pull Request 自动检查。

- content.js：行业、场景、工艺和文章正文。
- site.css：完整设计系统与响应式排版。
- site.js：搜索、导航、轮播、筛选和需求摘要下载。
- hero-motion.js：仅首页加载的背景视频播放、暂停、设备选择和静态回退逻辑。
- config.js：已核验的公开联系方式与正式域名配置。
- tools/build.cjs：使用 Node.js 生成所有静态页面与搜索索引，不需要第三方构建依赖。
- tools/check.cjs：跨电脑运行的品牌名称与本地链接资源检查，无第三方依赖。
- tools/motion-check.cjs：流体视频、手机布局、暂停、减少动态效果、失败回退及本地文件播放验证；需要 Playwright，可通过 PLAYWRIGHT_MODULE、CHROMIUM_PATH 和 MOTION_CHECK_OUT 指定依赖、浏览器和输出位置。
- tools/verify.cjs 与 tools/recheck.cjs：本机浏览器验证脚本，使用当前电脑的 Playwright 与 Chromium 路径；在其他电脑运行时需调整依赖路径。验证输出位于项目 work/vortex-fluid-checks。
- assets：网站需要的全部图片、图标和可下载资料。

修改内容后，在网站目录执行 node tools/build.cjs，重新生成 HTML。不要删除 content.js、assets 或 tools 中的构建文件，以便继续维护与复现。

提交前执行 `node tools/check.cjs`，并提交源码及重新生成的 HTML、搜索索引和下载资料。GitHub 仓库保存网站完整源码；将文件上传仓库不会自动启用 GitHub Pages 公网浏览。

在 config.js 的 siteUrl 填入正式 https 域名后重新构建，将自动写入各页面 canonical 和 Open Graph 地址，并生成 sitemap.xml 与对应 robots.txt。域名未确认时不生成虚构的站点地址。

## 视觉素材

首页使用 `assets/fluid-desktop.mp4`、`assets/fluid-mobile.mp4` 及配套 WebP 封面。可编辑 Blender 场景、制作说明见 [原创流体动画](design/fluid/README.md)，生成和编码工具保留在 tools 中。动画为品牌视觉，非空化仿真或实验实测；未使用参考录屏作为网页素材。

flow-hero.webp、reaction-module.webp 和 flow-edge.webp 根据用户提供的设计图提取与处理，用于还原视觉方向。模块概念图不代表实际产品结构或样机照片。

wine.jpg、chemical.jpg、environment.jpg、beauty.jpg、pharma.jpg、energy.jpg 沿用先前版本中的 Unsplash 行业参考图，均不作为客户案例。实际上线可替换为企业自有或已确认可用的高清素材。

图标使用 Lucide 0.468.0。本地副本位于 assets/lucide.min.js。
