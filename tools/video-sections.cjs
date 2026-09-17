const catalog = require('./video-catalog.cjs');
function videoCard(key, scope) {
  const item = catalog[key], id = `film-${scope}-${key}`, base = `assets/videos/${item.file}`;
  return `<figure class="content-media" data-media-card>
    <div class="media-frame">
      <img class="media-poster" src="${base}.webp" alt="" loading="lazy" width="1280" height="720">
      <video id="${id}" data-content-video controls playsinline preload="none" poster="${base}.webp" src="${base}.mp4" aria-label="${item.title}"></video>
      <button class="media-start" type="button" data-media-start aria-controls="${id}" aria-label="播放：${item.title}"><span class="media-play-mark" aria-hidden="true"></span><span>播放视频 <small>${item.duration}</small></span></button>
    </div>
    <figcaption><strong>${item.title}</strong><span>${item.caption}</span><small>${item.duration}</small></figcaption>
    <div class="media-error" hidden role="status"><p>视频暂时无法播放，您可以重新加载或直接打开文件。</p><button type="button" data-media-retry>重新播放</button><a href="${base}.mp4">直接打开视频</a></div>
  </figure>`;
}
function scienceSection() {
  return `<section class="section science-section" id="cavitation-science"><div class="container science-layout">
    <div class="science-copy"><p class="eyebrow">01 / UNDERSTAND THE PHENOMENON</p><h2>什么是空化</h2><p class="section-lead">从一枚气泡，理解液体内部的变化。</p><p>液体中的局部压力变化，可以伴随气泡形成、生长与溃灭。通过一段短片，认识这一流体现象。</p><a class="line-link" href="article-understanding-cavitation.html">阅读空化知识 <span aria-hidden="true">↗</span></a></div>
    ${videoCard('science','home')}
  </div></section>`;
}
function interactionSection() {
  return `<section class="section fluid-experience" id="fluid-experience"><div class="container">
    <div class="section-intro"><div><p class="eyebrow">03 / EXPLORE THE FLOW</p><h2>感受流体中的变化</h2></div><p>光沿着曲面流动，形态在聚拢与舒展之间变化。换一个视角，感受流动的可能。</p></div>
    <div class="experience-layout"><div class="sculpture-stage" data-fluid-stage>
      <div class="sculpture-visual" aria-hidden="true"><picture><source media="(max-width: 700px)" srcset="assets/sculpture-mobile.webp"><img class="sculpture-poster" src="assets/sculpture-desktop.webp" alt="" loading="lazy" width="1200" height="1100"></picture><div class="sculpture-canvas"></div></div>
      <div class="sculpture-topline"><span>FORM / LIGHT / FLOW</span><span class="sculpture-index">01 — 03</span></div>
      <div class="sculpture-bottom"><p class="sculpture-hint">移动鼠标，或上下滚动<br><small>品牌概念视觉 · 非空化物理仿真</small></p><button class="sculpture-toggle" data-fluid-toggle type="button" hidden>暂停互动</button></div>
    </div><div class="experience-copy"><p class="eyebrow">AN IMAGE OF CAVITATION</p><h3>看见变化<br>理解想象</h3><p>用概念影像呈现反应的视觉印象。具体作用过程与处理效果，仍需结合真实介质、工况和实验结果理解。</p>${videoCard('concept','home')}<a class="line-link" href="technology.html">进一步了解技术 <span aria-hidden="true">↗</span></a></div></div>
  </div></section>`;
}
function videoGallery(scope) {
  if(scope==='technology') {
    const details={
      science:'认识空化现象，是理解技术应用的起点。短片介绍局部压力变化与气泡形成、溃灭之间的关系。',
      prototype:'通过演示样机的运行录像观察处理过程，并结合仿真画面理解流场的可视化表达。',
      concept:'概念影像呈现液体内部变化的视觉印象，用于帮助理解与交流。'
    };
    const notes={science:'空化原理科普，不等同于具体设备的性能承诺。',prototype:'片中包含实拍与仿真。具体参数及处理结果，以对应工况和技术文件为准。',concept:'AI 生成的概念影像，非样机实拍或实验记录。'};
    return `<section class="section video-library technology-videos-first" id="videos"><div class="container"><div class="section-intro"><div><p class="eyebrow">TECHNOLOGY IN MOTION</p><h2>从原理到运行<br>进一步理解技术</h2></div><p>在这里观看空化科普、样机运行与仿真可视化，以及反应概念影像。</p></div><div class="video-library-detail">${['prototype','science','concept'].map((k,i)=>`<section class="technology-video-row" id="video-${k}"><div><p class="eyebrow">0${i+1} / ${catalog[k].caption}</p><h3>${catalog[k].title}</h3><p>${details[k]}</p><p class="caption">${notes[k]}</p></div>${videoCard(k,scope)}</section>`).join('')}</div></div></section>`;
  }
  return `<section class="section video-library" id="videos"><div class="container"><div class="section-intro"><div><p class="eyebrow">WATCH & UNDERSTAND</p><h2>从影像理解技术</h2></div><p>原理科普、样机运行记录与概念影像，各自呈现不同层面的技术信息。</p></div><div class="video-library-grid">${['science','prototype','concept'].map(k=>videoCard(k,scope)).join('')}</div></div></section>`;
}
function homeTechnology() {
  return `<section class="section" id="technology"><div class="container home-tech-brief"><div><p class="eyebrow">TECHNOLOGY & ENGINEERING</p><h2>悬浮空化技术<br>从研究走向真实应用</h2><p>围绕流体作用、介质适配与工程实现，探索可评估的处理方案。进入技术与产品，了解核心原理与样机运行。</p><div class="home-tech-tags"><span>空化原理</span><span>样机运行</span><span>工艺评价</span></div><a class="pill" href="technology.html#videos">探索技术与产品 <span aria-hidden="true">↗</span></a></div><a class="home-tech-preview" href="technology.html#video-prototype"><figure><img src="assets/videos/prototype.webp" width="1280" height="720" loading="lazy" alt="样机运行录像预览"><figcaption><span>样机运行记录</span><span>前往观看 ↗</span></figcaption></figure></a></div></section>`;
}
module.exports = {videoCard,scienceSection,interactionSection,videoGallery,homeTechnology};
