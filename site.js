(() => {
 'use strict';
 const $ = (q,root=document)=>root.querySelector(q);
 const $$ = (q,root=document)=>[...root.querySelectorAll(q)];
 const icons=()=>window.lucide?.createIcons();
 icons();
 const nav=$('#primary-nav'), menu=$('.menu-toggle');
 function closeMenu(){nav?.classList.remove('is-open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','打开菜单');}
 menu?.addEventListener('click',()=>{
  const open=nav.classList.toggle('is-open');
  menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'关闭菜单':'打开菜单');
 });
 document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  const opened=$('dialog[open]');
  if(opened){e.preventDefault();e.stopPropagation();opened.close();}
  closeMenu();
 },true);
 window.addEventListener('resize',()=>{if(innerWidth>1020)closeMenu();},{passive:true});
 document.addEventListener('click',e=>{if(nav?.classList.contains('is-open')&&!e.target.closest('.header'))closeMenu();});

 const searchDialog=$('#search-dialog'), searchInput=$('#search-input'), resultHost=$('#search-results');
 const searchOpen=$('#search-open');
 const typeLabels={technology:'技术与工艺',sectors:'行业与场景',research:'研究与动态',about:'公司信息',home:'品牌首页',contact:'联系与咨询'};
 function renderSearch(){
  const q=searchInput.value.trim().toLocaleLowerCase();
  const tokens=q.split(/\s+/).filter(Boolean);
  const all=window.VORTEX_SEARCH||[];
  const matches=q?all.filter(x=>tokens.every(t=>(x.title+' '+x.description).toLocaleLowerCase().includes(t))):all.filter(x=>['technology.html','sectors.html','applications.html','resources.html'].includes(x.url));
  resultHost.replaceChildren();
  $('#search-count').textContent=q?(matches.length?'找到 '+matches.length+' 条相关内容':'未找到相关内容，请尝试其他关键词。'):'推荐浏览';
  matches.slice(0,30).forEach(item=>{
   const a=document.createElement('a');a.href=item.url;
   const strong=document.createElement('strong');strong.textContent=item.title;
   const small=document.createElement('small');small.textContent=(typeLabels[item.type]||'内容')+' · '+item.description;
   a.append(strong,small);resultHost.append(a);
  });
 }
 searchOpen?.addEventListener('click',()=>{closeMenu();searchDialog.showModal();renderSearch();searchInput.focus();});
 searchInput?.addEventListener('input',renderSearch);
 searchInput?.addEventListener('keydown',e=>{if(e.key==='Enter'){$('a',resultHost)?.click();}});
 $$('dialog').forEach(dialog=>{
  $$('[data-close]',dialog).forEach(b=>b.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('click',e=>{
   const r=dialog.getBoundingClientRect();
   if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();
  });
 });

 let moduleIndex=0;
 function moduleSlide(delta){
  const slides=window.MODULE_SLIDES;if(!slides)return;
  moduleIndex=(moduleIndex+delta+slides.length)%slides.length;
  const s=slides[moduleIndex];
  const fields={title:s.title,en:s.en,lead:s.lead,copy:s.copy,counter:String(moduleIndex+1).padStart(2,'0')+' / 03'};
  Object.entries(fields).forEach(([key,value])=>{$('[data-module-'+key+']').textContent=value;});
  $('[data-module-link]').href=s.href;
 }
 $('[data-module-prev]')?.addEventListener('click',()=>moduleSlide(-1));
 $('[data-module-next]')?.addEventListener('click',()=>moduleSlide(1));
 const heroStatements=[['流动之间','蕴藏着改变的力量'],['从技术出发','走向真实应用'],['以研究为起点','理解流体的可能']];
 let heroIndex=0;
 function heroSlide(delta){
  heroIndex=(heroIndex+delta+heroStatements.length)%heroStatements.length;
  const el=$('.rail-quote');el.replaceChildren();
  el.append(document.createTextNode(heroStatements[heroIndex][0]),document.createElement('br'),document.createTextNode(heroStatements[heroIndex][1]),document.createElement('span'));
  $('.rail-controls>span').textContent=String(heroIndex+1).padStart(2,'0')+' / 03';
 }
 $('[data-hero-prev]')?.addEventListener('click',()=>heroSlide(-1));
 $('[data-hero-next]')?.addEventListener('click',()=>heroSlide(1));
 $$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  $$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  let visible=0;$$('[data-category]').forEach(article=>{
   article.hidden=button.dataset.filter!=='全部'&&article.dataset.category!==button.dataset.filter;
   if(!article.hidden)visible++;
  });
  if($('.filter-empty'))$('.filter-empty').hidden=visible>0;
 }));

 const form=$('#enquiry-form'),config=window.VORTEX_CONFIG||{};
 if(config.contactEmail&&$('#contact-channel')){
  const a=document.createElement('a');a.href='mailto:'+config.contactEmail;a.textContent=config.contactEmail;$('#contact-channel').replaceChildren(a);
 }
 form?.addEventListener('submit',e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const values=Object.fromEntries(new FormData(form));
  const text=['旋风流体 应用需求摘要','Tomado Fluid Technologies','','姓名：'+values.name,'公司：'+values.company,'邮箱：'+values.email,'领域：'+values.sector,'','问题：',values.message,'','此文件由浏览器本地生成，未向旋风流体发送信息。'].join('\n');
  const blob=new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='旋风流体-应用需求摘要.txt';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('#form-status').textContent='需求摘要已生成。您的信息仅保存在下载文件中，尚未发送。';
 });
})();
