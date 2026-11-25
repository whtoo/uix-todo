"use strict";

const icons = {
  bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  board:'<rect x="3" y="4" width="7" height="16" rx="1"/><rect x="14" y="4" width="7" height="10" rx="1"/>',
  list:'<path d="M9 6h12M9 12h12M9 18h12"/><path d="M3 6h.01M3 12h.01M3 18h.01" stroke-width="3"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chart:'<path d="M4 19V5M4 19h17M7 15l4-5 4 3 5-7"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.3 2.3 0 0 1 4.4 1c0 2-2.2 2-2.2 4M12 18h.01" stroke-width="2"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  pause:'<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  play:'<path d="m8 5 11 7-11 7V5Z"/>',
  arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
  back:'<path d="M19 12H5m5-5-5 5 5 5"/>',
  edit:'<path d="m4 20 4-1 11-11-3-3L5 16l-1 4ZM14 6l3 3"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  shield:'<path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/>',
  link:'<path d="m10 14 4-4M8 16l-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M16 8l2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(-1 -1) scale(.92)"/>',
  chevron:'<path d="m7 9 5 5 5-5"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01" stroke-width="2"/>',
  scales:'<path d="M12 3v18M5 6h14M5 6 2 13h6L5 6ZM19 6l-3 7h6l-3-7ZM8 21h8"/>',
  reset:'<path d="M4 4v6h6M4 10a8 8 0 1 1 2 7"/>',
  unknown:'<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  grip:'<path d="M5 8h14M5 16h14"/>'
};
function icon(name){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.info}</svg>`;
}
function hydrateIcons(root=document){
  root.querySelectorAll('[data-icon]').forEach(el=>{ el.innerHTML=icon(el.dataset.icon); });
}
function h(value){
  return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function fmt(seconds){
  const n=Math.max(0,Math.floor(Number(seconds)||0));
  return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(v=>String(v).padStart(2,'0')).join(':');
}
function fmtShort(seconds){
  const n=Math.floor(seconds/60);
  return n>=60?`${Math.floor(n/60)}小时${String(n%60).padStart(2,'0')}分`:`${n}分钟`;
}
function uid(){ return 'R'+Date.now().toString(36).toUpperCase(); }

const seed = {
  selectedTask:'R0', currentTask:'R0', selected:[], candidateDismissed:false, interpretationRejected:false,
  interpretation:'产品使用复盘可能适合双周常态化。',
  planName:'企业客户续约',
  planPurpose:'让企业客户清楚看见续约风险，并确认下一阶段是否值得继续投入。',
  spec:{goalHint:'明确复盘对象、使用情境，以及希望被改变或验证的问题。',attrs:['问题清单','证据引用','观察时间']},
  tasks:[
    {id:'R0',title:'整理企业客户续约访谈',plan:'企业客户续约',goal:'梳理访谈中阻碍续约的关键因素，形成一份可以与客户共同确认的风险清单。',status:'active',elapsed:1938,started:'今天 14:06',pause:'04:12',estimate:'',result:'',observed:'',evidence:'',className:'',segments:[{time:'13:24 — 13:50',label:'通读访谈记录',duration:26},{time:'13:50 — 13:54',label:'暂停',duration:4},{time:'13:54 — 14:00',label:'标记续约风险',duration:6}]},
    {id:'R1',title:'产品使用复盘',plan:'首次使用体验',goal:'找出新用户在首次使用中的阻碍，形成可复现的问题清单。',status:'done',elapsed:4080,completed:'11月18日 10:20',result:'识别 4 个首次使用阻碍，均已附操作路径。',observed:'已记录',evidence:'首次使用录屏与问题清单',className:'产品使用复盘',segments:[{time:'09:12 — 09:48',label:'整理使用记录',duration:36},{time:'10:02 — 10:34',label:'归纳阻碍与路径',duration:32}]},
    {id:'R2',title:'产品使用复盘',plan:'企业客户续约',goal:'梳理访谈中阻碍续约的因素，形成可与客户确认的风险清单。',status:'done',elapsed:5160,completed:'11月25日 10:55',result:'形成 3 项续约风险，其中 2 项已有访谈证据。',observed:'11月28日复查',evidence:'访谈记录 §3、§7',className:'产品使用复盘',segments:[{time:'09:12 — 09:48',label:'整理访谈记录',duration:36},{time:'10:05 — 10:41',label:'归纳风险与证据',duration:36},{time:'10:41 — 10:55',label:'补充待确认事项',duration:14}]},
    {id:'R3',title:'产品使用复盘',plan:'企业客户复盘',goal:'核验续约风险是否已被客户理解，并记录仍待确认的问题。',status:'done',elapsed:4680,completed:'11月25日 16:20',result:'风险清单已发送，客户反馈待观察。',observed:'11月28日复查',evidence:'客户确认清单',className:'产品使用复盘',segments:[{time:'14:48 — 15:26',label:'整理复盘材料',duration:38},{time:'15:40 — 16:20',label:'形成确认清单',duration:40}]},
    {id:'N1',title:'核对首次使用体验记录',plan:'产品体验',goal:'复核首次使用问题与原始录屏是否一致。',status:'next',elapsed:0,estimate:'约 40 分钟',result:'',segments:[]},
    {id:'N2',title:'补充客户访谈证据引用',plan:'企业客户续约',goal:'为关键风险补齐访谈原文证据。',status:'next',elapsed:0,estimate:'约 25 分钟',result:'',segments:[]},
    {id:'N3',title:'整理本周一次性工作',plan:'未分类',goal:'汇总尚未形成重复类任务的工作。',status:'next',elapsed:0,estimate:'约 20 分钟',result:'',segments:[]},
    {id:'N4',title:'更新访谈提纲',plan:'企业客户续约',goal:'补充下一轮访谈需要确认的问题。',status:'done',elapsed:2520,completed:'昨天 15:03',result:'',observed:'保持未知',unknown:true,evidence:'',segments:[{time:'14:21 — 15:03',label:'更新访谈提纲',duration:42}]}
  ]
};
const STORAGE_KEY='ji-work-log-v1';
let state;
try{ state=JSON.parse(localStorage.getItem(STORAGE_KEY))||structuredClone(seed); }
catch{ state=structuredClone(seed); }
function save(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{} }
function task(id){ return state.tasks.find(t=>t.id===id); }
function activeTask(){ return state.tasks.find(t=>t.status==='active')||(task(state.currentTask)?.status==='paused'?task(state.currentTask):null)||state.tasks.find(t=>t.status==='paused'); }
function classTasks(){ return state.tasks.filter(t=>t.className==='产品使用复盘'); }
function route(){ const r=location.hash.slice(1)||'now'; return ['now','detail','compare','class','plan','review','board','list','time'].includes(r)?r:'now'; }
function go(name){ if(location.hash==='#'+name)render();else location.hash=name; }
function header(kicker,title,subtitle='',actions=''){
  return `<div class="page-header"><div class="page-heading">${kicker?`<p class="page-kicker">${h(kicker)}</p>`:''}<h1 class="page-title">${h(title)}</h1>${subtitle?`<p class="page-subtitle">${h(subtitle)}</p>`:''}</div>${actions?`<div class="header-actions">${actions}</div>`:''}</div>`;
}
function openTaskButton(t,extra=''){
  return `<button class="text-button ${extra}" type="button" data-action="open-task" data-id="${h(t.id)}">${h(t.title)}${icon('arrow')}</button>`;
}
function resultBadge(t){
  if(t.unknown)return '<span class="badge">结果保持未知</span>';
  if(t.result)return `<span class="badge ${t.observed.includes('复查')?'badge-amber':'badge-fact'}">${h(t.observed||'已记录')}</span>`;
  return '<span class="badge badge-amber">实际结果待记录</span>';
}
function taskRow(t,showStart=true){
  return `<div class="task-row"><span class="muted" aria-hidden="true">${icon('grip')}</span><div class="task-row-main"><button class="text-button" type="button" data-action="open-task" data-id="${h(t.id)}">${h(t.title)}</button><div class="task-row-meta">${h(t.plan||'未分类')}</div></div><span class="task-row-meta">${h(t.estimate||fmtShort(t.elapsed))}</span>${showStart&&t.status==='next'?`<div class="task-row-actions"><button class="btn btn-soft" type="button" data-action="start-task" data-id="${h(t.id)}">${icon('play')}开始</button></div>`:''}</div>`;
}

function nowPage(){
  const active=activeTask();
  const next=state.tasks.filter(t=>t.status==='next').slice(0,4);
  const recent=state.tasks.filter(t=>t.status==='done').sort((a,b)=>(b.completed||'').localeCompare(a.completed||'')).slice(0,4);
  const activeHtml=active?`<section class="card active-card">
    <div class="status-line"><span class="status-label"><span class="status-dot"></span>${active.status==='active'?'正在执行':'已暂停'}</span>${active.plan?`<span class="badge badge-primary">${h(active.plan)}</span>`:''}</div>
    <button class="text-button" type="button" data-action="open-task" data-id="${h(active.id)}"><h2 class="task-title">${h(active.title)}</h2></button>
    <p class="task-goal">${h(active.goal||'这次任务尚未补充目标')}</p>
    <div class="timer-row"><div><div class="number timer" data-timer-id="${h(active.id)}">${fmt(active.elapsed)}</div><p class="timer-meta">开始于 ${h(active.started||'本次会话')} · 已暂停 ${h(active.pause||'00:00')}</p></div><div class="button-group"><button class="btn btn-secondary" type="button" data-action="toggle-pause" data-id="${h(active.id)}">${icon(active.status==='active'?'pause':'play')}${active.status==='active'?'暂停':'恢复'}</button><button class="btn btn-primary" type="button" data-action="complete-task" data-id="${h(active.id)}">${icon('check')}完成</button></div></div>
  </section>`:`<section class="card active-card empty-state"><p class="strong">此刻没有正在执行的任务</p><p>从“接下来”选择一项，或直接记录这次要做什么。</p></section>`;
  return `${header('2026年11月25日 · 周三','现在','把注意力留给这一次。')}
    <form class="card capture" data-form="capture"><span class="capture-icon">${icon('plus')}</span><input name="title" required maxlength="120" autocomplete="off" aria-label="这次要做什么" placeholder="这次要做什么？"><span class="capture-hint">无需分类，记录即可</span><button class="btn btn-primary" type="submit">记录</button></form>
    <div class="grid now-layout"><div class="stack">${activeHtml}<section class="card list-card"><div class="list-header"><h2 class="card-title">接下来</h2><span class="small muted">${next.length} 项</span></div>${next.length?next.map(t=>taskRow(t)).join(''):'<p class="empty-state">没有待开始的任务，记录一件这次要做的事。</p>'}</section></div>
    <div class="stack">${!state.candidateDismissed?`<button class="card candidate" type="button" data-action="compare"><div class="row-between"><span class="candidate-title">有 2 组重复工作待判断</span><span class="amber">${icon('layers')}</span></div><div class="row-between"><span class="small muted">不打断当前执行，稍后可回看</span><span class="text-button amber">去看看 ${icon('arrow')}</span></div></button>`:''}
      <section class="card list-card"><div class="list-header"><h2 class="card-title">最近完成</h2><a class="text-button" href="#list">查看全部</a></div>${recent.map(t=>`<div class="task-row"><span class="${t.result?'':'amber'}">${icon(t.unknown?'unknown':'check')}</span><div class="task-row-main"><button class="text-button" type="button" data-action="open-task" data-id="${h(t.id)}">${h(t.title)}</button><div class="task-row-meta">${h(t.completed||'今天')}</div></div><div>${resultBadge(t)}</div>${!t.result&&!t.unknown?`<button class="text-button" type="button" data-action="edit-result" data-id="${h(t.id)}">记录结果 ${icon('arrow')}</button>`:''}</div>`).join('')}</section>
      <p class="notice">${icon('shield')}每次执行都独立保留，不会被归组覆盖。</p>
    </div></div>`;
}

function detailPage(){
  const t=task(state.selectedTask)||activeTask()||state.tasks[0];
  state.selectedTask=t.id;
  const actions=`<button class="btn btn-secondary" type="button" data-action="add-time" data-id="${h(t.id)}">${icon('plus')}补记时间</button><button class="btn btn-primary" type="button" data-action="edit-result" data-id="${h(t.id)}">${icon('edit')}${t.result?'编辑结果':'记录结果'}</button>`;
  const status=t.status==='done'?'<span class="badge badge-fact">已完成</span>':t.status==='next'?'<span class="badge">待开始</span>':`<span class="badge badge-fact">${t.status==='active'?'正在执行':'已暂停'}</span>`;
  return `<a class="back-link" href="#now">${icon('back')}返回现在</a>${header('这次任务 · '+t.id,t.title,'',actions)}
    <div class="grid detail-layout"><div class="stack">
      <section class="card card-pad"><h2 class="card-title">这次要达到什么</h2><p class="body-small" style="margin-top:16px">${h(t.goal||'尚未补充目标')}</p><div class="divider"></div><p class="small muted">当前情境：${h(t.plan||'未分类')}</p></section>
      <section class="card card-pad"><div class="row-between"><h2 class="card-title">实际执行</h2><span class="strong body-small">实际投入 ${fmtShort(t.elapsed)}</span></div><div class="divider"></div>
        ${t.segments.length?`<div class="timeline">${t.segments.map(s=>`<div class="segment"><span class="segment-dot"></span><div><div class="segment-content"><span class="segment-time">${h(s.time)}</span><span class="segment-duration">${h(s.duration)} 分钟</span></div><p class="segment-label">${h(s.label)}</p></div></div>`).join('')}</div>`:'<p class="empty-state">开始执行后，时间段会出现在这里。</p>'}
        <details class="raw-segments"><summary>${icon('chevron')}展开原始时间段与暂停记录</summary><div class="raw-detail">${t.segments.length?t.segments.map(s=>`${h(s.time)} · ${h(s.label)} · ${h(s.duration)} 分钟`).join('<br>'):'尚无执行段。'}<br>派生总时长只由以上原始记录计算，不被类任务或组合移动覆盖。</div></details>
      </section>
      <section class="card card-pad"><div class="row-between"><h2 class="card-title">实际结果</h2>${t.status==='done'?resultBadge(t):''}</div>${t.result?`<p class="body-small" style="margin-top:16px">${h(t.result)}</p><p class="small muted" style="margin-top:16px">证据：${h(t.evidence||'未引用')} · 观察：${h(t.observed||'未设置')}</p>`:t.unknown?'<p class="body-small" style="margin-top:16px">这次结果保持未知。</p>':`<p class="body-small muted" style="margin:16px 0">没有结果时，不需要填写一组空指标。</p><button class="btn btn-primary" type="button" data-action="edit-result" data-id="${h(t.id)}">记录实际结果</button>`}</section>
    </div><div class="stack">
      <section class="card card-pad"><h2 class="card-title">这次任务</h2><dl class="info-list"><div class="info-pair"><dt>当前状态</dt><dd>${status}</dd></div><div class="info-pair"><dt>${t.status==='done'?'完成时间':'开始时间'}</dt><dd>${h(t.completed||t.started||'尚未开始')}</dd></div><div class="info-pair"><dt>实际投入</dt><dd class="number" style="font-size:22px" data-timer-id="${h(t.id)}">${fmt(t.elapsed)}</dd></div></dl><div class="divider"></div><p class="small muted">完成仅表示这次工作结束</p></section>
      <section class="card card-pad"><h2 class="card-title">组合与顺序</h2><dl class="info-list"><div class="info-pair"><dt>所属计划</dt><dd><button class="text-button" type="button" data-action="plan">${h(t.plan||'未分类')} ${icon('arrow')}</button></dd></div><div class="info-pair"><dt>先于</dt><dd>核对首次使用体验记录</dd></div><div class="info-pair"><dt>后于</dt><dd>无</dd></div></dl></section>
      ${t.className?`<section class="card card-pad" style="background:var(--primary-soft);border-color:oklch(0.88 0.04 264)"><div class="status-label" style="color:var(--primary)">${icon('layers')}已形成类任务</div><button class="text-button" type="button" data-action="class" style="margin-top:12px"><h2 class="card-title">${h(t.className)}</h2>${icon('arrow')}</button><p class="small" style="margin-top:12px">归属只用于复用与观察，不会改写这次任务的执行和结果。</p></section>`:''}
    </div></div>`;
}

function compareCard(t,rid){
  return `<article class="card compare-card"><div class="row-between"><span class="badge badge-primary">${h(rid)}</span><span class="small muted">${h(t.completed||'')}</span></div><h2 class="task-title">${h(t.title)}</h2><div class="divider"></div><dl><div class="compare-section row-between"><dt>所属计划</dt><dd class="strong">${h(t.plan)}</dd></div><div class="compare-section"><dt>这次目标</dt><dd>${h(t.goal)}</dd></div><div class="compare-section"><dt>实际结果</dt><dd>${h(t.result)}</dd></div><div class="compare-section row-between"><dt>实际投入</dt><dd>${fmtShort(t.elapsed)}</dd></div></dl></article>`;
}
function comparePage(){
  const r1=task('R1'),r2=task('R2');
  return `${header('复盘 / 待判断','形成类任务','先比较两次真实工作，再决定是否建立共同规约。','<span class="badge badge-amber">待你判断</span>')}
    <p class="notice">${icon('info')}不会合并任务：R1、R2 的执行记录和实际结果会分别保留。</p>
    <div class="grid compare-grid">${compareCard(r1,'R1')}${compareCard(r2,'R2')}
      <section class="card compare-insight fact"><h2 class="insight-title fact">${icon('check')}可能相同</h2><ul class="insight-list"><li>都围绕产品使用过程进行复盘</li><li>都产出了可追溯的问题或风险清单</li></ul></section>
      <section class="card compare-insight amber"><h2 class="insight-title amber">${icon('help')}需要判断</h2><ul class="insight-list"><li>服务对象和业务情境不同</li><li>结果观测属性不同：使用阻碍 / 续约风险</li></ul></section>
    </div><div class="form-actions"><a class="btn btn-soft" href="#review">稍后处理</a><span class="small muted" style="margin-right:auto">形成后仍可撤销归属，实例历史不变</span><a class="btn btn-secondary" href="#review">取消</a><button class="btn btn-primary" type="button" data-action="confirm-class">${icon('layers')}形成类任务</button></div>`;
}

function classPage(){
  const items=classTasks();
  const total=items.reduce((sum,t)=>sum+t.elapsed,0);
  const actions=`<button class="btn btn-secondary" type="button" data-action="edit-spec">${icon('edit')}编辑默认规约</button><button class="btn btn-primary" type="button" data-action="create-instance">${icon('plus')}创建新实例</button>`;
  return `${header('类任务','产品使用复盘','共同规约与行为观察，不承载任何一次执行。',actions)}
    <p class="notice">${icon('shield')}默认规约只用于之后创建的新实例；修改此处不会改写既有实例。</p>
    <div class="tabs" role="tablist" aria-label="类任务视图"><button class="tab active" type="button" data-action="scroll-to" data-target="class-history">实例历史</button><button class="tab" type="button" data-action="scroll-to" data-target="class-observe">行为观察</button><button class="tab" type="button" data-action="scroll-to" data-target="class-spec">默认规约</button></div>
    <div class="grid class-layout"><section class="card card-pad" id="class-history"><div class="row-between small muted"><span>实例</span><span>完成时间 / 实际投入 / 结果观察</span></div><div class="divider"></div>
      ${items.length?items.map(t=>`<div class="history-row"><span class="badge badge-primary">${h(t.id)}</span><button class="text-button" type="button" data-action="open-task" data-id="${h(t.id)}">${h(t.plan)}</button><span class="small muted">${h(t.completed||'未完成')}</span><span class="number small">${fmt(t.elapsed)}</span><button class="text-button history-action ${t.observed.includes('复查')?'amber':''}" type="button" data-action="open-task" data-id="${h(t.id)}">${h(t.observed||'已记录')} ${icon('arrow')}</button></div>`).join(''):'<p class="empty-state">形成类任务后，实例历史会显示在这里。</p>'}
      <p class="small muted" style="margin-top:16px">每次实例都可独立查看原始执行段与结果证据。</p></section>
      <section class="card card-pad" id="class-spec"><div class="row-between"><h2 class="card-title">默认规约</h2><span class="badge badge-primary">仅影响新实例</span></div><div class="divider"></div><h3 class="field-label">目标提示</h3><p class="body-small" style="margin:10px 0 24px">${h(state.spec.goalHint)}</p><h3 class="field-label">结果属性</h3><div class="spec-tags">${state.spec.attrs.map(a=>`<span class="badge">${h(a)}</span>`).join('')}</div><p class="small muted" style="margin-top:28px">没有执行按钮：开始、暂停和完成只属于具体实例。</p></section>
    </div>
    <section class="card card-pad" id="class-observe" style="margin-top:20px"><div class="row-between"><h2 class="card-title">行为观察</h2><span class="small muted">测量 · 按当前类任务归属计算</span><a class="text-button" href="#review">查看口径与实例 ${icon('arrow')}</a></div><div class="metric-grid"><div class="metric"><div class="number metric-value">${items.length}</div><p class="metric-label">实例次数</p></div><div class="metric"><div class="number metric-value">6天</div><p class="metric-label">平均首次开始间隔</p></div><div class="metric"><div class="number metric-value">${Math.floor(total/3600)}h${Math.floor(total%3600/60)}m</div><p class="metric-label">累计实际投入</p></div></div><p class="small muted" style="margin-top:12px">自动形成的目的结论：0。类任务只提供复用与观察。</p></section>`;
}

const planSteps=[
  ['核对首次使用体验记录','11月21日 15:40','产出 2 项待验证体验问题','00:48:00'],
  ['整理企业客户续约访谈','11月25日 10:55','形成 3 项续约风险，待客户确认','01:26:00'],
  ['补充客户访谈证据引用','11月25日 14:18','关键风险均已关联访谈原文','00:52:00'],
  ['发送续约风险确认清单','11月25日 16:32','客户已接收，续约意愿仍待观察','01:30:00']
];
function planPage(){
  const actions=`<button class="btn btn-secondary" type="button" data-action="edit-purpose">${icon('edit')}编辑当前目的</button>`;
  return `${header('计划',state.planName,'从已选择的任务中建立组合与顺序，而不是先维护一个计划容器。',actions)}
    <div class="grid plan-layout"><section class="card card-pad"><div class="row-between"><h2 class="card-title">执行组合</h2><span class="small muted">4 次任务 · 实际投入 4小时36分</span></div><p class="notice" style="margin-top:20px">${icon('check')}任务已全部完成；目的是否达成仍需另行判断。</p><div style="margin-top:16px">${planSteps.map((s,i)=>`<div class="plan-step"><span class="step-check">${icon('check')}</span><div><div class="row-between"><span class="strong body-small">${h(s[0])}</span><span class="small muted">${h(s[1])}</span></div><div class="row-between"><span class="small">${h(s[2])}</span><span class="number small">${h(s[3])}</span></div></div></div>`).join('')}</div></section>
    <div class="stack"><section class="card card-pad"><h2 class="card-title">当前目的</h2><p class="body-small" style="margin-top:16px">${h(state.planPurpose)}</p><div class="divider"></div><h3 class="field-label">相关背景</h3><p class="small muted" style="margin-top:8px">首轮试用结束 · 续约窗口 14 天</p></section>
      <section class="card compare-insight amber"><h2 class="insight-title amber">${icon('scales')}目的判断</h2><p class="body-small" style="margin-top:14px">续约意愿：待观察<br>结果复查：11月28日</p><p class="small" style="margin-top:16px">没有绿色“目标达成”结论。</p></section>
      <section class="card card-pad"><h2 class="card-title">组合如何形成</h2><p class="body-small" style="margin-top:14px">已选 4 个任务 → 组成组合 → 建立先后顺序 → 命名为计划</p><a class="text-button" href="#list" style="margin-top:12px">从任务选择开始 ${icon('arrow')}</a></section>
    </div></div><p class="small muted" style="margin-top:20px">组合移动不会覆盖任何实例的执行记录与实际结果。</p>`;
}

function reviewPage(){
  const items=classTasks();
  const total=items.reduce((sum,t)=>sum+t.elapsed,0);
  const r2=task('R2');
  return `${header('认识态','复盘','从事实中形成认识，也允许否决认识。','<button class="btn btn-secondary" type="button" data-action="date-range">'+icon('calendar')+h(state.dateRange||'11月23日 — 11月29日')+'</button>')}
    ${!state.candidateDismissed?`<section class="card candidate card-pad" style="margin-bottom:20px"><div class="section-label" style="color:var(--amber)">一、待你判断</div><div class="row-between" style="margin-top:8px"><div><h2 class="candidate-title">2 组重复工作可能形成类任务</h2><p class="small muted">候选解释 · 尚未成为模板或方向事实</p></div><div class="button-group"><button class="btn btn-secondary" type="button" data-action="candidate-later">稍后</button><button class="btn btn-primary" type="button" data-action="compare">比较事实 ${icon('arrow')}</button></div></div></section>`:''}
    <div class="grid review-layout"><div class="stack"><section class="card card-pad review-measure"><p class="section-label">二、类任务观察</p><div class="row-between" style="margin-top:8px"><h2 class="card-title">产品使用复盘</h2><span class="small muted">测量 · 按当前类任务归属计算</span></div><div class="metric-grid"><div class="metric"><div class="number metric-value">${items.length}</div><p class="metric-label">实例次数</p></div><div class="metric"><div class="number metric-value">6天</div><p class="metric-label">平均首次开始间隔</p></div><div class="metric"><div class="number metric-value">${Math.floor(total/3600)}h${Math.floor(total%3600/60)}m</div><p class="metric-label">累计实际投入</p></div></div><div class="divider"></div><p class="small strong">各实例实际投入</p><div class="bars">${items.slice(0,3).map(t=>`<div class="bar-item"><div class="bar-value">${Math.floor(t.elapsed/3600)}h${Math.floor(t.elapsed%3600/60)}m</div><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,Math.round(t.elapsed/52))}%"></div></div><button class="text-button bar-link" type="button" data-action="open-task" data-id="${h(t.id)}">${h(t.id)} · 查看实例 ${icon('arrow')}</button></div>`).join('')}</div></section>
      <section class="card card-pad"><p class="section-label" style="color:var(--muted)">三、一次性工作</p><div class="metric-grid"><div class="metric"><div class="number metric-value">7</div><p class="metric-label">任务数量</p></div><div class="metric"><div class="number metric-value">5h38m</div><p class="metric-label">实际投入</p></div><div class="metric"><p class="small muted">不显示周期<br>因为尚未形成重复类任务</p></div></div></section>
      <section class="card compare-insight amber"><p class="section-label" style="color:var(--amber)">四、当前解释</p>${state.interpretationRejected?`<div class="row-between" style="margin-top:12px"><p class="body-small">这条候选解释已否决，没有进入方向事实。</p><button class="btn btn-secondary" type="button" data-action="restore-interpretation">恢复候选</button></div>`:`<div class="row-between" style="margin-top:12px"><div><span class="badge badge-amber">候选 · 未确认</span><p class="strong body-small" style="margin-top:10px">“${h(state.interpretation)}”</p></div><div class="button-group"><button class="btn btn-secondary" type="button" data-action="reject-interpretation">否决</button><button class="btn btn-primary" type="button" data-action="edit-interpretation">修订</button></div></div>`}</section>
    </div><div class="stack"><section class="card card-pad"><p class="section-label" style="color:var(--fact)">原始事实</p><div class="row-between" style="margin-top:8px"><h2 class="card-title">执行段与结果</h2><span class="badge badge-primary">实例 R2</span></div><div class="fact-list">${r2.segments.map(s=>`<div class="fact-item"><span class="fact-dot"></span><div><div class="row-between"><span class="segment-time">${h(s.time)}</span><span class="segment-duration">${h(s.duration)} 分钟</span></div><p class="body-small">${h(s.label)}</p></div></div>`).join('')}</div><div class="divider"></div><h3 class="field-label">实际结果</h3><p class="small" style="margin-top:8px">${h(r2.result)} · ${h(r2.observed)}</p></section>
      <section class="card card-pad" style="background:var(--primary-soft)"><h2 class="card-title" style="color:var(--primary)">测量可返回原始事实</h2><p class="drill-path" style="margin-top:14px">类任务投入 → 同类实例 → R2<br>→ 原始执行段与结果</p><button class="text-button" type="button" data-action="open-task" data-id="R2" style="margin-top:12px">下钻到 R2 ${icon('arrow')}</button></section>
    </div></div>`;
}

function boardCard(t){
  return `<button class="board-task" type="button" data-action="open-task" data-id="${h(t.id)}"><div class="row-between"><span class="strong body-small">${h(t.title)}</span><span class="small muted">${h(t.id)}</span></div><p class="small muted" style="margin-top:8px">${h(t.plan||'未分类')}</p><div class="row-between" style="margin-top:12px"><span class="number small">${fmt(t.elapsed)}</span>${t.status==='done'?resultBadge(t):`<span class="badge ${t.status==='active'?'badge-fact':''}">${t.status==='active'?'执行中':t.status==='paused'?'已暂停':'待开始'}</span>`}</div></button>`;
}
function boardPage(){
  const cols=[['next','待开始'],['active','执行中'],['done','已完成']];
  return `${header('行动态的一种投影','看板','看板不是事实中心；每次任务仍保留自己的执行履历。')}
    <div class="grid board-grid">${cols.map(([status,title])=>{const items=state.tasks.filter(t=>status==='active'?(t.status==='active'||t.status==='paused'):t.status===status);return `<section class="board-column"><div class="board-column-title"><span>${title}</span><span class="badge">${items.length}</span></div>${items.length?items.map(boardCard).join(''):'<p class="empty-state small">暂无任务</p>'}</section>`;}).join('')}</div>`;
}
function listPage(){
  const selected=state.selected||[];
  return `${header('行动态的一种投影','列表','多选任务后，再组成组合、建立顺序或命名为计划。')}
    <div class="card selection-bar"><span class="selection-count">已选择 <strong>${selected.length}</strong> 项</span><button class="btn btn-soft" type="button" data-action="combine">组成组合</button><button class="btn btn-soft" type="button" data-action="sequence">建立先后顺序</button><button class="btn btn-primary" type="button" data-action="name-plan">命名为计划</button></div>
    <section class="card card-pad">${state.tasks.map(t=>`<div class="task-row"><label class="check-label"><input type="checkbox" data-select-task="${h(t.id)}" ${selected.includes(t.id)?'checked':''} aria-label="选择 ${h(t.title)}"></label><div class="task-row-main"><button class="text-button" type="button" data-action="open-task" data-id="${h(t.id)}">${h(t.title)}</button><div class="task-row-meta">${h(t.id)} · ${h(t.plan||'未分类')}</div></div><span class="number small">${fmt(t.elapsed)}</span>${t.status==='done'?resultBadge(t):t.status==='next'?`<button class="btn btn-soft" type="button" data-action="start-task" data-id="${h(t.id)}">${icon('play')}开始</button>`:`<button class="btn btn-secondary" type="button" data-action="toggle-pause" data-id="${h(t.id)}">${icon(t.status==='active'?'pause':'play')}${t.status==='active'?'暂停':'恢复'}</button>`}</div>`).join('')}</section>`;
}
function timePage(){
  const items=state.tasks.filter(t=>t.segments.length);
  return `${header('原始执行记录','时间记录','所有派生时长都可以展开，并返回原始时间段。')}
    <div class="stack">${items.map(t=>`<section class="card card-pad"><div class="row-between"><div><button class="text-button" type="button" data-action="open-task" data-id="${h(t.id)}"><h2 class="card-title">${h(t.title)}</h2>${icon('arrow')}</button><p class="small muted">${h(t.id)} · ${h(t.plan||'未分类')}</p></div><div style="text-align:right"><div class="number" style="font-size:24px">${fmt(t.elapsed)}</div><span class="small muted">实际投入</span></div></div><div class="timeline">${t.segments.map(s=>`<div class="segment"><span class="segment-dot"></span><div><div class="segment-content"><span class="segment-time">${h(s.time)}</span><span class="segment-duration">${h(s.duration)} 分钟</span></div><p class="segment-label">${h(s.label)}</p></div></div>`).join('')}</div></section>`).join('')}</div>`;
}

const pageMap={now:nowPage,detail:detailPage,compare:comparePage,class:classPage,plan:planPage,review:reviewPage,board:boardPage,list:listPage,time:timePage};
const breadcrumbs={now:'现在',detail:'现在 / 任务详情',compare:'复盘 / 待判断 / 形成类任务',class:'类任务 / 产品使用复盘',plan:'列表 / 计划 / 企业客户续约',review:'复盘',board:'看板',list:'列表',time:'时间记录'};
function render(){
  const r=route();
  document.getElementById('main').innerHTML=pageMap[r]();
  document.getElementById('breadcrumb').textContent=breadcrumbs[r];
  const navActive={detail:'now',compare:'review',plan:'list'}[r]||r;
  document.querySelectorAll('[data-nav]').forEach(a=>{
    const active=a.dataset.nav===navActive;
    a.classList.toggle('active',active);
    if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  document.title=breadcrumbs[r]+' · 迹';
  hydrateIcons(document.getElementById('main'));
  closeNav();
}
function toast(message){
  const region=document.getElementById('toast-region');
  const el=document.createElement('div');el.className='toast';el.textContent=message;region.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),200);},2800);
}
function openNav(){document.getElementById('sidebar').classList.add('open');document.querySelector('.nav-close').focus();}
function closeNav(){document.getElementById('sidebar').classList.remove('open');}
const dialog=document.getElementById('app-dialog');
const dialogContent=document.getElementById('dialog-content');
function openDialog(title,body,footer=''){
  dialogContent.innerHTML=`<div class="dialog-header"><h2 class="dialog-title" id="dialog-title">${h(title)}</h2><button class="icon-button" type="button" data-action="close-dialog" aria-label="关闭对话框" data-icon="close"></button></div><div class="dialog-body">${body}</div>${footer?`<div class="dialog-footer">${footer}</div>`:''}`;
  hydrateIcons(dialogContent);
  if(!dialog.open)dialog.showModal();
}
function closeDialog(){if(dialog.open)dialog.close();}
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
function resultDialog(id){
  const t=task(id);if(!t)return;
  openDialog(t.result?'编辑实际结果':'记录实际结果',`<p class="body-small muted" style="margin-bottom:20px">${h(t.title)} · ${h(t.id)}</p><form id="result-form" data-form="result" data-id="${h(t.id)}"><div class="field"><label for="result-text">实际结果</label><textarea id="result-text" name="result" required maxlength="1000" placeholder="实际发生了什么？">${h(t.result)}</textarea><span class="field-help">允许稍后记录，也允许保持未知；完成不会自动推断目的达成。</span></div><div class="field"><label for="result-observed">观察时间或状态</label><input id="result-observed" name="observed" value="${h(t.observed)}" placeholder="例如：11月28日复查"></div><div class="field"><label for="result-evidence">证据引用</label><input id="result-evidence" name="evidence" value="${h(t.evidence)}" placeholder="例如：访谈记录 §3、§7"></div></form>`,`<button class="btn btn-soft" type="button" data-action="unknown-result" data-id="${h(t.id)}">保持未知</button><button class="btn btn-secondary" type="button" data-action="close-dialog">稍后</button><button class="btn btn-primary" type="submit" form="result-form">保存结果</button>`);
  setTimeout(()=>document.getElementById('result-text')?.focus(),0);
}
function timeDialog(id){
  const t=task(id);if(!t)return;
  openDialog('补记执行时间',`<form id="time-form" data-form="add-time" data-id="${h(t.id)}"><div class="field"><label for="segment-label">这段时间做了什么</label><input id="segment-label" name="label" required placeholder="例如：补充访谈证据"></div><div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:12px"><div class="field"><label for="segment-start">开始</label><input id="segment-start" name="start" type="time" required value="09:00"></div><div class="field"><label for="segment-end">结束</label><input id="segment-end" name="end" type="time" required value="09:30"></div></div><p class="field-help">补记会成为新的原始执行段，并计入这次任务的实际投入。</p></form>`,`<button class="btn btn-secondary" type="button" data-action="close-dialog">取消</button><button class="btn btn-primary" type="submit" form="time-form">补记时间</button>`);
}
function specDialog(){
  openDialog('编辑默认规约',`<p class="notice" style="margin-bottom:20px">${icon('shield')}修改此处不会改写既有实例，只影响之后创建的新实例。</p><form id="spec-form" data-form="spec"><div class="field"><label for="spec-goal">目标提示</label><textarea id="spec-goal" name="goalHint" required>${h(state.spec.goalHint)}</textarea></div><div class="field"><label for="spec-attrs">结果属性</label><input id="spec-attrs" name="attrs" required value="${h(state.spec.attrs.join('，'))}"><span class="field-help">用逗号分隔属性。</span></div></form>`,`<button class="btn btn-secondary" type="button" data-action="close-dialog">取消</button><button class="btn btn-primary" type="submit" form="spec-form">保存规约</button>`);
}

function purposeDialog(){
  openDialog('编辑当前目的',`<form id="purpose-form" data-form="purpose"><div class="field"><label for="purpose-text">希望改变什么</label><textarea id="purpose-text" name="purpose" required>${h(state.planPurpose)}</textarea><span class="field-help">任务全部完成不会自动产生目的达成结论。</span></div></form>`,`<button class="btn btn-secondary" type="button" data-action="close-dialog">取消</button><button class="btn btn-primary" type="submit" form="purpose-form">保存目的</button>`);
}
function interpretationDialog(){
  openDialog('修订候选解释',`<form id="interpretation-form" data-form="interpretation"><div class="field"><label for="interpretation-text">当前解释</label><textarea id="interpretation-text" name="interpretation" required>${h(state.interpretation)}</textarea><span class="field-help">修订后仍是候选解释，需要人的确认，不能直接成为方向事实。</span></div></form>`,`<button class="btn btn-secondary" type="button" data-action="close-dialog">取消</button><button class="btn btn-primary" type="submit" form="interpretation-form">保存候选</button>`);
}
function helpDialog(){
  openDialog('使用帮助',`<p class="body-small">行动时尽量无结构负担，复盘时让结构从事实中显现。</p><ol class="help-list"><li><strong>捕获不依赖分类：</strong>没有模板和计划也能记录任务。</li><li><strong>模板没有执行按钮：</strong>开始、暂停和完成只属于实例。</li><li><strong>归组不等于合并：</strong>组合操作不隐藏实例历史。</li><li><strong>完成不等于有效：</strong>完成操作不产生目的达成结论。</li><li><strong>测量必须可解释：</strong>数字能看到口径并返回原始事实。</li><li><strong>解释必须可否决：</strong>候选不会直接变成模板或计划。</li></ol><p class="notice" style="margin-top:20px">${icon('info')}这是浏览器本地演示。操作数据只保存在当前浏览器，不会跨设备同步；清除浏览器数据会丢失修改。</p>`,`<button class="btn btn-primary" type="button" data-action="close-dialog">知道了</button>`);
}
function searchDialog(){
  openDialog('搜索任务',`<div class="field"><label for="search-input">任务标题、计划或编号</label><input id="search-input" type="search" autocomplete="off" placeholder="输入关键词"></div><div class="search-results" id="search-results"></div>`,`<button class="btn btn-secondary" type="button" data-action="close-dialog">关闭</button>`);
  updateSearchResults('');setTimeout(()=>document.getElementById('search-input')?.focus(),0);
}
function updateSearchResults(query){
  const container=document.getElementById('search-results');if(!container)return;
  const q=query.trim().toLowerCase();
  const items=state.tasks.filter(t=>!q||[t.title,t.plan,t.id].join(' ').toLowerCase().includes(q));
  container.innerHTML=items.length?items.map(t=>`<button class="search-result" type="button" data-action="open-task" data-id="${h(t.id)}"><span><strong>${h(t.title)}</strong><br><span class="small muted">${h(t.plan||'未分类')}</span></span><span class="badge">${h(t.id)}</span></button>`).join(''):'<p class="empty-state">没有匹配的任务。</p>';
}
function accountDialog(){
  openDialog('本地演示数据',`<p class="body-small">你的操作只保存在当前浏览器的 localStorage 中，不会跨设备同步，也没有服务器账号。</p><p class="small muted" style="margin-top:12px">清除浏览器数据或重置演示会丢失本地修改。</p>`,`<button class="btn btn-soft" type="button" data-action="reset-demo">${icon('reset')}重置演示</button><button class="btn btn-primary" type="button" data-action="close-dialog">完成</button>`);
}
function planNameDialog(){
  openDialog('命名为计划',`<p class="body-small muted" style="margin-bottom:16px">将为已选择的 ${state.selected.length} 项任务建立计划，实例仍分别保留。</p><form id="plan-name-form" data-form="plan-name"><div class="field"><label for="plan-name">计划名称</label><input id="plan-name" name="name" required value="${h(state.planName)}"></div><div class="field"><label for="plan-purpose-new">当前目的</label><textarea id="plan-purpose-new" name="purpose" required>${h(state.planPurpose)}</textarea></div></form>`,`<button class="btn btn-secondary" type="button" data-action="close-dialog">取消</button><button class="btn btn-primary" type="submit" form="plan-name-form">建立计划</button>`);
}
function dateRangeDialog(){
  openDialog('复盘时间范围',`<form id="range-form" data-form="date-range"><div class="field"><label for="range-select">统计范围</label><select id="range-select" name="range"><option>11月23日 — 11月29日</option><option>11月16日 — 11月22日</option><option>11月1日 — 11月30日</option></select><span class="field-help">测量只改变观察窗口，不改写原始执行记录。</span></div></form>`,`<button class="btn btn-secondary" type="button" data-action="close-dialog">取消</button><button class="btn btn-primary" type="submit" form="range-form">应用范围</button>`);
}
function requireSelection(){
  if(state.selected.length>=2)return true;
  toast('请先选择至少两项任务');return false;
}

const actions={
  'open-nav':openNav,'close-nav':closeNav,'close-dialog':closeDialog,
  'help':helpDialog,'search':searchDialog,'account':accountDialog,
  'compare':()=>go('compare'),'class':()=>go('class'),'plan':()=>go('plan'),
  'open-task':btn=>{state.selectedTask=btn.dataset.id;save();closeDialog();go('detail');},
  'start-task':btn=>{const next=task(btn.dataset.id);const current=activeTask();if(current&&current.id!==next.id)current.status='paused';next.status='active';state.currentTask=next.id;next.started='今天 '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});next.elapsed=next.elapsed||0;save();toast(current&&current.id!==next.id?'已暂停原任务，开始这次任务':'已开始执行');go('now');},
  'toggle-pause':btn=>{const t=task(btn.dataset.id);t.status=t.status==='active'?'paused':'active';save();toast(t.status==='active'?'已恢复执行':'已暂停，时间段已保留');render();},
  'complete-task':btn=>{const t=task(btn.dataset.id);t.status='done';t.completed='今天 '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});save();render();resultDialog(t.id);},
  'edit-result':btn=>resultDialog(btn.dataset.id),
  'unknown-result':btn=>{const t=task(btn.dataset.id);t.result='';t.unknown=true;t.observed='保持未知';save();closeDialog();render();toast('结果保持未知，没有生成目的结论');},
  'add-time':btn=>timeDialog(btn.dataset.id),
  'edit-spec':specDialog,'edit-purpose':purposeDialog,'edit-interpretation':interpretationDialog,
  'confirm-class':()=>{task('R1').className='产品使用复盘';task('R2').className='产品使用复盘';save();toast('已形成类任务，R1 与 R2 历史保持不变');go('class');},
  'create-instance':()=>{const t={id:uid(),title:'产品使用复盘',plan:'未分类',goal:state.spec.goalHint,status:'next',elapsed:0,estimate:'尚未开始',result:'',observed:'',evidence:'',className:'产品使用复盘',segments:[]};state.tasks.push(t);state.selectedTask=t.id;save();toast(`已创建新实例 ${t.id}，既有实例未变`);go('now');},
  'candidate-later':()=>{state.candidateDismissed=true;save();render();toast('已稍后处理，候选没有变成系统结论');},
  'reject-interpretation':()=>{state.interpretationRejected=true;save();render();toast('候选解释已否决');},
  'restore-interpretation':()=>{state.interpretationRejected=false;save();render();toast('已恢复为待判断候选');},
  'scroll-to':btn=>document.getElementById(btn.dataset.target)?.scrollIntoView({behavior:'smooth',block:'start'}),
  'combine':()=>{if(requireSelection()){state.combination=[...state.selected];save();toast('已组成组合，实例历史仍分别保留');render();}},
  'sequence':()=>{if(requireSelection()){state.sequence=[...state.selected];save();toast('已按列表选择顺序建立先后关系');}},
  'name-plan':()=>{if(requireSelection())planNameDialog();},
  'date-range':dateRangeDialog,
  'reset-demo':()=>openDialog('重置演示数据','<p class="body-small">这会清除当前浏览器里的任务修改、规约和计划编辑，并恢复到初始演示状态。</p>',`<button class="btn btn-secondary" type="button" data-action="close-dialog">取消</button><button class="btn btn-primary" type="button" data-action="confirm-reset">确认重置</button>`),
  'confirm-reset':()=>{localStorage.removeItem(STORAGE_KEY);state=structuredClone(seed);closeDialog();save();go('now');toast('已恢复初始演示数据');}
};

document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-action]');
  if(btn){const fn=actions[btn.dataset.action];if(fn)fn(btn);}
  if(e.target.closest('.nav-item[href]'))closeNav();
});
document.addEventListener('change',e=>{
  if(e.target.matches('[data-select-task]')){
    const id=e.target.dataset.selectTask;
    state.selected=state.selected||[];
    state.selected=e.target.checked?[...new Set([...state.selected,id])]:state.selected.filter(x=>x!==id);
    save();render();
  }
});
document.addEventListener('input',e=>{if(e.target.id==='search-input')updateSearchResults(e.target.value);});
document.addEventListener('submit',e=>{
  const form=e.target.closest('form[data-form]');if(!form)return;
  e.preventDefault();const data=new FormData(form);const kind=form.dataset.form;
  if(kind==='capture'){
    const title=String(data.get('title')).trim();if(!title)return;
    const t={id:uid(),title,plan:'未分类',goal:'',status:'next',elapsed:0,estimate:'尚未开始',result:'',observed:'',evidence:'',className:'',segments:[]};
    state.tasks.push(t);state.selectedTask=t.id;save();render();toast('已记录，无需先分类');form.reset();
  }
  if(kind==='result'){
    const t=task(form.dataset.id);t.result=String(data.get('result')).trim();t.observed=String(data.get('observed')).trim()||'已记录';t.evidence=String(data.get('evidence')).trim();t.unknown=false;save();closeDialog();render();toast('实际结果已记录，未自动生成目的结论');
  }
  if(kind==='add-time'){
    const t=task(form.dataset.id);const start=String(data.get('start')),end=String(data.get('end'));
    const [sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number);const duration=(eh*60+em)-(sh*60+sm);
    if(duration<=0){toast('结束时间需要晚于开始时间');return;}
    t.segments.push({time:`${start} — ${end}`,label:String(data.get('label')).trim(),duration});t.elapsed+=duration*60;save();closeDialog();render();toast('已补记原始执行段');
  }
  if(kind==='spec'){
    state.spec.goalHint=String(data.get('goalHint')).trim();state.spec.attrs=String(data.get('attrs')).split(/[，,]/).map(s=>s.trim()).filter(Boolean);save();closeDialog();render();toast('默认规约已更新，既有实例未变');
  }
  if(kind==='purpose'){state.planPurpose=String(data.get('purpose')).trim();save();closeDialog();render();toast('当前目的已更新');}
  if(kind==='interpretation'){state.interpretation=String(data.get('interpretation')).trim();state.interpretationRejected=false;save();closeDialog();render();toast('已修订，仍保持候选状态');}
  if(kind==='plan-name'){state.planName=String(data.get('name')).trim();state.planPurpose=String(data.get('purpose')).trim();state.selected=[];save();closeDialog();go('plan');toast('计划已建立，实例历史未合并');}
  if(kind==='date-range'){state.dateRange=String(data.get('range'));save();closeDialog();render();toast('已应用复盘时间范围');}
});
window.addEventListener('hashchange',render);
let saveCounter=0;
setInterval(()=>{
  const t=state.tasks.find(x=>x.status==='active');if(!t)return;
  t.elapsed++;saveCounter++;
  document.querySelectorAll(`[data-timer-id="${CSS.escape(t.id)}"]`).forEach(el=>el.textContent=fmt(t.elapsed));
  if(saveCounter>=30){save();saveCounter=0;}
},1000);
if(!location.hash)history.replaceState(null,'','#now');
hydrateIcons(document);
render();
