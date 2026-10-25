(() => {
  'use strict';
  let { editions, projects } = window.STROLL_CONTENT;
  let dataStatus = {source:'seed',updatedAt:null};
  const feedKey = 'open-source-stroll:feed:v1';
  function validFeed(data) {
    return data && Array.isArray(data.editions) && data.editions.length && data.projects && data.editions.every(e=>/^\d{4}-\d{2}-\d{2}$/.test(e.id) && Array.isArray(e.projects) && e.projects.length===6 && e.projects.every(id=>data.projects[id])) && Object.entries(data.projects).every(([id,p])=>/^[\w-]+$/.test(id) && /^[\w.-]+\/[\w.-]+$/.test(p.repo) && ['name','title','description','category','note'].every(k=>typeof p[k]==='string') && Array.isArray(p.tags));
  }
  function acceptFeed(data) { if(!validFeed(data))throw new Error('Invalid feed'); projects={...window.STROLL_CONTENT.projects,...data.projects};editions=data.editions;dataStatus=data.status||{}; }
  try {const cached=JSON.parse(localStorage.getItem(feedKey)||'null');if(cached)acceptFeed(cached);}catch{}
  const storageKey = 'open-source-stroll:saved:v1';
  const root = document.getElementById('view-root');
  const bookmarkIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4Z" stroke-linejoin="round"/></svg>';
  const externalIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>';
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let saved = new Set();
  let storageAvailable = true;
  let toastTimeout;
  let activeView = 'today';
  const avatarIDs = { localsend:120677616, umi:56373419, sharex:5548736, upscayl:112148288, vtracer:72055406, czkawka:41945903 };
  const initials = {localsend:'LS', umi:'文', sharex:'SX', upscayl:'U', vtracer:'V', czkawka:'C'};

  function readSaved() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return new Set(Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string' && /^[\w-]+$/.test(id)) : []);
    } catch { return new Set(); }
  }
  saved = readSaved();
  try { localStorage.setItem(storageKey,JSON.stringify([...saved])); } catch { storageAvailable = false; }

  function notify(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('visible'),2600);
  }

  function avatar(id, extra = '') {
    const p = projects[id];
    return `<span class="project-avatar avatar-${id} ${extra}"><span class="avatar-fallback" aria-hidden="true">${escapeHTML(initials[id] || p.name.slice(0,1))}</span><img src="https://avatars.githubusercontent.com/u/${Number(p.avatarId||avatarIDs[id])}?v=4&amp;s=128" alt="${escapeHTML(p.repo.split('/')[0])} 的 GitHub 头像" width="52" height="52" decoding="async" referrerpolicy="no-referrer"></span>`;
  }

  function saveButton(id) {
    const selected = saved.has(id);
    return `<button class="bookmark" type="button" data-save="${id}" aria-pressed="${selected}" aria-label="${selected?'取消收藏':'收藏'} ${escapeHTML(projects[id].name)}" title="${selected?'取消收藏':'收藏到本机'}">${bookmarkIcon}</button>`;
  }

  function row(id) {
    const p = projects[id];
    if(!p)return '';
    const url = `https://github.com/${p.repo}`;
    return `<article class="project-row" data-project="${id}"><a class="avatar-link" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="前往 ${escapeHTML(p.name)} 的 GitHub 项目主页，新窗口打开">${avatar(id)}</a><div class="project-copy"><h3><a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHTML(p.name)}</a><span class="row-tagline">${escapeHTML(p.title)}</span></h3><p class="description">${escapeHTML(p.description)}</p><div class="row-meta"><span class="category">${escapeHTML(p.category)}</span>${Number.isFinite(p.stars)?`<span title="GitHub Star 数，${escapeHTML(p.checkedAt)} 获取">★ ${new Intl.NumberFormat('zh-CN',{notation:'compact',maximumFractionDigits:1}).format(p.stars)}</span>`:''}${p.tags.map(tag=>`<span>${escapeHTML(tag)}</span>`).join('')}<details class="project-info"><summary>使用提示 <span aria-hidden="true">⌄</span></summary><div class="usage-note">${escapeHTML(p.note)}${p.copySource==='github' && p.sourceDescription?`<br>仓库原文：${escapeHTML(p.sourceDescription)}`:''}${p.checkedAt?`<br>GitHub：${escapeHTML((p.license && p.license!=='NOASSERTION'?p.license:'请查阅原仓库许可'))} · 最近提交 ${escapeHTML((p.pushedAt||'').slice(0,10))} · ${p.archived?'已归档':'未归档'}。资料核对于 ${escapeHTML(new Date(p.checkedAt).toLocaleString('zh-CN'))}。`:''} <a href="${url}#license" target="_blank" rel="noopener noreferrer" aria-label="查看 ${escapeHTML(p.name)} 的许可证，新窗口打开">许可证 ↗</a></div></details></div></div><div class="row-actions">${saveButton(id)}<a class="external-link" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="打开 ${escapeHTML(p.name)} 项目，新窗口打开">${externalIcon}</a></div></article>`;
  }

  function dateLabel(date) {
    return new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
  }

  function hero(edition) {
    return `<section class="daily-banner" aria-labelledby="welcome-heading"><div class="banner-copy"><span class="banner-eyebrow"><span></span> 每日开源发现</span><h1 id="welcome-heading">好工具，<br>总会在这里遇见。</h1><p>每天一小份，挑你用得上的。</p></div><div class="banner-art" aria-hidden="true"><div class="orbit-circle orbit-one"></div><div class="orbit-circle orbit-two"></div><div class="orbit-center"><svg viewBox="0 0 36 36"><path d="M18 5c5-7 13 0 8 7 9-2 12 8 4 11 6 7-3 14-9 7-2 9-13 7-12-2-8 3-13-7-5-11-7-5-1-14 6-10-1-9 10-11 11-2Z" fill="currentColor"/><circle cx="18" cy="18" r="5" fill="#eee7ff"/></svg></div><span class="orbit-icon orbit-a">${avatar('localsend')}</span><span class="orbit-icon orbit-b">${avatar('upscayl')}</span><span class="orbit-icon orbit-c">${avatar('sharex')}</span><span class="orbit-code">&lt; / &gt;</span><span class="art-spark spark-a">✳</span><span class="art-spark spark-b">＋</span></div><span class="banner-number">小小发现 · 第 ${escapeHTML(edition.number)} 期</span></section>`;
  }

  function rail(edition) {
    const url = 'https://github.com/visioncortex/vtracer';
    return `<aside class="discovery-rail" aria-label="本期导读"><section class="rail-note"><span class="rail-eyebrow">这期聊什么</span><h2>把小麻烦，<br>交给好工具。</h2><p>${edition.selection==='automatic'?'从 GitHub 公开项目中自动筛选，排除已推荐的项目。项目简介依据仓库描述自动翻译。':'传个文件、认几个字、整理一下照片。从你今天遇到的小事开始。'}</p><div class="issue-stats"><span><strong>${edition.projects.length}</strong> 个项目</span><span><strong>3</strong> 分钟左右</span></div><time datetime="${edition.id}">${dateLabel(edition.id)}</time></section><section class="tiny-pick"><div class="rail-section-title"><span class="little-star">✧</span><h2>顺手发现</h2></div><a class="vector-preview" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="查看 VTracer 位图转矢量项目，新窗口打开"><div class="flower-before"><span></span></div><span class="convert-arrow" aria-hidden="true">→</span><svg class="flower-after" viewBox="0 0 80 80" aria-hidden="true"><path d="M39 34C7 33 15 1 33 17 31-11 66-3 53 22 81 9 88 45 59 45 89 61 60 82 47 55 40 87 9 68 28 49 0 54 1 18 27 28Z" fill="#efb853"/><circle cx="43" cy="37" r="11" fill="#7660a0"/></svg><span class="preview-label">用途示意</span></a><h3><a href="${url}" target="_blank" rel="noopener noreferrer">小图，也能变成矢量图。 ↗</a></h3><p>VTracer · 位图转 SVG</p><a class="rail-text-link" href="${url}" target="_blank" rel="noopener noreferrer">去看看 <span aria-hidden="true">↗</span></a></section><div class="rail-bottom"><span>✳</span> 保持好奇，慢慢发现。</div></aside>`;
  }

  function renderToday(edition = editions[0]) {
    const today = new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Denver'}).format(new Date());
    const title = edition.id === today ? '今日精选' : '最新一期';
    root.innerHTML = `<div class="discovery-layout"><div class="main-column">${hero(edition)}<section class="project-feed" aria-labelledby="feed-heading"><header class="feed-heading"><div><h2 id="feed-heading">${title}</h2><span class="feed-count">${edition.projects.length}</span></div><span class="feed-curation"><i></i> ${dataStatus.updatedAt?new Intl.DateTimeFormat('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(dataStatus.updatedAt))+' 更新':'初始推荐 · 待同步'}</span></header><div class="project-list">${edition.projects.map(row).join('')}</div><div class="feed-ending"><span aria-hidden="true">✧</span><p>今天的发现，就先到这里。</p><a href="#archive">翻翻往日推荐 <span aria-hidden="true">→</span></a></div></section></div>${rail(edition)}</div>`;
  }

  function renderArchive() {
    root.innerHTML = `<header class="page-intro"><span class="page-eyebrow">发现，值得再看一遍</span><h1>往日推荐<span>.</span></h1><p>每一期都留在这里，什么时候来都不算晚。</p></header><section class="archive-list" aria-label="推荐期刊列表">${editions.map(e=>`<a class="archive-item" href="#edition/${e.id}"><span class="archive-number">${escapeHTML(e.number)}</span><div class="archive-copy"><span class="archive-date">${escapeHTML(e.id.replaceAll('-','.'))} · ${e.projects.length} 个项目</span><h2>${escapeHTML(e.title)}</h2><p>${escapeHTML(e.subtitle)}</p><div class="archive-avatars" aria-hidden="true">${e.projects.slice(0,4).map(id=>avatar(id)).join('')}</div></div><span class="archive-arrow" aria-hidden="true">↗</span></a>`).join('')}<p class="archive-footnote">从第一期开始，记录每一个值得分享的发现。</p></section>`;
  }

  function renderSaved() {
    root.innerHTML = `<header class="page-intro"><span class="page-eyebrow">把好奇心，留给下次</span><h1>我的收藏<span>.</span></h1><p>${saved.size?`收好了 ${saved.size} 个项目。需要的时候，再慢慢试。`:'感兴趣的项目，点一下书签就能收好。'}</p></header>${saved.size?`<section class="saved-feed" aria-label="已收藏项目">${[...saved].reverse().map(row).join('')}</section>${[...saved].some(id=>!projects[id])?'<p class="saved-note">部分收藏资料暂未加载，联网后会重新读取；收藏记录仍保留在本机。</p>':''}<p class="saved-note">${storageAvailable?'收藏只保存在当前浏览器，不会上传。清除站点数据会清除收藏。':'浏览器限制存储，收藏暂时只在本次页面打开期间保留。'}</p>`:`<section class="empty-state"><div class="empty-icon">${bookmarkIcon}</div><h2>口袋里，还是空空的。</h2><p>先去逛逛，遇到喜欢的就留下。</p><a class="primary-link" href="#today">发现今日精选 <span aria-hidden="true">↗</span></a></section>`}`;
  }

  function updateCount() {
    const count = document.getElementById('saved-count');
    count.textContent=String(saved.size);
    count.hidden=saved.size===0;
  }

  function render({scroll=true}={}) {
    const hash=location.hash.slice(1);
    const edition=hash.startsWith('edition/')?editions.find(e=>e.id===hash.slice(8)):null;
    const view=hash==='saved'?'saved':hash==='archive'||(hash.startsWith('edition/')&&!edition)?'archive':'today';
    activeView=view;
    document.querySelectorAll('[data-view]').forEach(link=>{if(link.dataset.view===view)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    const title=view==='saved'?'我的收藏':view==='archive'?'往日推荐':'今日精选';
    document.getElementById('current-view-label').textContent=title;
    if(view==='saved')renderSaved();else if(view==='archive')renderArchive();else renderToday(edition||editions[0]);
    document.title=`${title} · 开源散步`;
    updateCount();
    updateStatus();
    if(scroll){window.scrollTo({top:0,behavior:'instant'});document.getElementById('content').focus({preventScroll:true});}
  }

  // The fallback remains legible if GitHub avatars are blocked or unavailable.
  root.addEventListener('error',event=>{if(event.target.matches('.project-avatar img'))event.target.hidden=true;},true);
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-save]');
    if(!button)return;
    const id=button.dataset.save;
    if(!Object.hasOwn(projects,id))return;
    saved.has(id)?saved.delete(id):saved.add(id);
    const selected=saved.has(id);
    try{localStorage.setItem(storageKey,JSON.stringify([...saved]));storageAvailable=true;}catch{storageAvailable=false;}
    if(activeView==='saved'){
      const index=[...root.querySelectorAll('[data-save]')].indexOf(button);
      renderSaved();
      const buttons=[...root.querySelectorAll('[data-save]')];
      if(buttons.length)buttons[Math.min(index,buttons.length-1)].focus({preventScroll:true});else root.querySelector('.primary-link').focus({preventScroll:true});
    }else{button.setAttribute('aria-pressed',String(selected));button.setAttribute('aria-label',`${selected?'取消收藏':'收藏'} ${projects[id].name}`);button.title=selected?'取消收藏':'收藏到本机';}
    updateCount();
    notify(selected?(storageAvailable?'已收好，留给下次。':'已暂存本页；浏览器限制存储，刷新后不会保留。'):'已取消收藏。');
  });
  window.addEventListener('hashchange',()=>render());
  window.addEventListener('storage',event=>{if(event.key!==storageKey&&event.key!==null)return;saved=readSaved();const position=window.scrollY;render({scroll:false});window.scrollTo({top:position,behavior:'instant'});});
  const dialog=document.getElementById('about-dialog');
  document.getElementById('about-button').addEventListener('click',()=>dialog.showModal());
  document.getElementById('close-about').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  function updateStatus() {
    const el=document.getElementById('data-status');
    if(!el)return;
    const stale=dataStatus.updatedAt && Date.now()-new Date(dataStatus.updatedAt).getTime()>2*3600000;
    el.textContent=dataStatus.updatedAt?((dataStatus.lastError||stale?'更新延迟 · ':'同步于 ')+new Intl.DateTimeFormat('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(dataStatus.updatedAt))):'显示初始推荐';
    el.title=dataStatus.updatedAt?'上次成功同步：'+new Date(dataStatus.updatedAt).toLocaleString('zh-CN')+'；后台每小时更新。'+(dataStatus.lastError||''):'暂未获得在线资料，保留初始推荐。';
    const stamp=root.querySelector('.feed-curation');
    if(stamp)stamp.title=el.title;
  }
  let loading=false;
  async function loadFeed() {
    if(loading||location.protocol==='file:')return;
    loading=true;
    try {
      const response=await fetch('./api/feed',{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('Feed unavailable');
      const data=await response.json();acceptFeed(data);
      try{localStorage.setItem(feedKey,JSON.stringify(data));}catch{}
      const focused=document.activeElement;
      // Avoid resetting an open usage note or focused control during background polling.
      if(!root.querySelector('details[open]') && !root.contains(focused))render({scroll:false});
    } catch {dataStatus={...dataStatus,lastError:'网络暂时不可用，保留已缓存的推荐'};}
    finally{loading=false;updateStatus();}
  }
  render({scroll:false});
  updateStatus();
  loadFeed();
  setInterval(()=>{if(!document.hidden)loadFeed();},5*60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadFeed();});
})();
