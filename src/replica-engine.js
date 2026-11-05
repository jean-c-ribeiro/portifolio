// Independent implementation from visual observations. No Swarm Rebuild source is included.
import { agentColor,travelPoint,sampleCamera,typingStops,settleFrame } from './motion-math.js';
import {taskAction} from './agent-geometry.js';
import {contactPlan,parkPoint} from './contact-motion.js';
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const lerp = (a, b, t) => a + (b - a) * t;
export function measureStageWidth(overlay) {
  // goLive hides this layer. Measure it before restoring that hidden state.
  const display=overlay.style.display;
  overlay.style.display='';
  try { return overlay.getBoundingClientRect().width; }
  finally { overlay.style.display=display; }
}
export function sampleKeys(keys, frame) {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (frame <= keys[i][0]) {
    const [a, va] = keys[i - 1], [b, vb] = keys[i];
    return lerp(va, vb, (frame - a) / (b - a));
  }
  return keys.at(-1)[1];
}
export const agentCountAt = frame => Math.floor(sampleKeys([[1,18],[3,18],[5,19],[12,23],[18,24],[28,24],[35,28],[45,29],[52,30],[56,30]], frame));
export function constructionPhase(frame, start, duration) {
  const t = clamp((frame - start) / duration);
  return { t, drawn: smooth(t / .34), fill: clamp((t - .46) / .44), active: t > 0 && t < 1, finished: t >= 1 };
}
const blockText = 'h1,h2,h3,h4,p,a,button,label,.hero-title,.handwriting,.hero-role,.hero-location,.hero-scroll,.edition,.eyebrow,.award-total,.project-category,.project-number,.project-type,.award-year,.award-index,.education-row,.experience-date,.experience-place,.skill-tags>span,.reel-screen-title,.reel-screen-top,.recognition-list-head';

export function mountReplica({ root, overlay, cursors, report, forceFrame = null, finished = false }) {
  let disposed = false, request, currentFrame = forceFrame || 1, targetFrame=currentFrame, lastTick=0, world = 0, live = finished;
  const nodes = [...root.querySelectorAll('*')];
  const original = new Map(nodes.map(el => [el, { visibility: el.style.visibility, clipPath: el.style.clipPath, transform: el.style.transform, pointerEvents: el.style.pointerEvents }]));
  const bounds = new Map(nodes.map(el => [el, el.getBoundingClientRect()]));
  const sections = [...root.querySelectorAll('main>section')];
  const totalHeight = root.scrollHeight;
  const maxWorld = Math.max(0, totalHeight - innerHeight);
  const vh = innerHeight;
  const viewportWidth=measureStageWidth(overlay);
  const sectionY = (id, fallback = 0) => {
    const section=root.querySelector(id);
    return (section?.querySelector('h2')||section)?.getBoundingClientRect().top ?? fallback;
  };
  const camera = [[1,0],[5,0],[6,vh*.38],[9,sectionY('#portfolio')-vh*.55],[10,sectionY('#portfolio')-240],[11,sectionY('#portfolio')-140],[12,sectionY('#portfolio')-90],[14,sectionY('#portfolio')+120],[17,sectionY('#awards')-vh*.78],[18,sectionY('#awards')-vh*.6],[21,sectionY('#awards')-vh*.25],[24,sectionY('.breakdown')-vh*.85],[28,sectionY('.breakdown')-vh*.2],[30,sectionY('#about')-vh*.7],[31,sectionY('#about')-vh*.55],[33,sectionY('#about')-vh*.39],[35,sectionY('#about')-vh*.26],[38,sectionY('#about')-66],[39,sectionY('#about')+vh*.16],[40,sectionY('#experience')-vh*.85],[41,sectionY('#experience')-vh*.67],[43,sectionY('#experience')-vh*.45],[45,sectionY('#experience')+80],[47,sectionY('#contact')-vh*.9],[49,sectionY('#contact')-vh*.74],[51,sectionY('#contact')-vh*.58],[53,maxWorld],[56,maxWorld]].map(([f,y]) => [f,clamp(y,0,maxWorld)]);
  // The source is a sampled recording. These anchors correspond to observed section entrances.
  for (let i = 1; i < camera.length; i++) camera[i][1] = Math.max(camera[i-1][1],camera[i][1]);
  // Follow the form in a separate pass, rather than rushing to the footer.
  const form=root.querySelector('#project-request'),message=root.querySelector('#lead-message'),submit=root.querySelector('#contact-form button[type="submit"]');
  if(form&&message&&submit){
    const contactCamera=[[49,form.getBoundingClientRect().top-vh*.18],[50.8,root.querySelector('#lead-company').getBoundingClientRect().top-vh*.34],[52.4,message.getBoundingClientRect().top-vh*.3],[54,submit.getBoundingClientRect().top-vh*.72],[55,maxWorld],[56,maxWorld]];
    camera.splice(camera.findIndex(([f])=>f>=49),camera.length,...contactCamera.map(([f,y])=>[f,clamp(y,0,maxWorld)]));
    for(let i=1;i<camera.length;i++)camera[i][1]=Math.max(camera[i-1][1],camera[i][1]);
  }
  const windows = [[1.8,4.5],[7.5,14.5],[16,21.5],[23.5,27],[29.5,36.5],[39,44.8],[47,51.3]];
  const candidates = new Set();
  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (textWalker.nextNode()) {
    const node = textWalker.currentNode;
    if (!node.textContent.trim() || node.parentElement.closest('svg,style,script,option,.image-fallback')) continue;
    let el = node.parentElement.closest(blockText) || node.parentElement;
    el=node.parentElement.closest('.lead-label-text')||el;
    // A badge inside an image button must not swallow the image's independent insertion task.
    if(el.querySelector('img,svg'))el=node.parentElement;
    if (el !== root) candidates.add(el);
  }
  root.querySelectorAll('img,svg').forEach(el => candidates.add(el));
  root.querySelectorAll('#contact-form input:not([type="hidden"]),#contact-form select,#contact-form textarea').forEach(el=>candidates.add(el));
  const contentNodes = [...candidates].filter(el => ![...candidates].some(parent => parent !== el && parent.contains(el)));
  const tasks = [];
  function add(el, kind) {
    const r = bounds.get(el), css = getComputedStyle(el);
    if (!r || r.width < 1 || r.height < 1 || css.display === 'none' || el.closest('.skip-link,.reading-progress')) return;
    const section = el.closest('main>section');
    const idx = sections.indexOf(section);
    const interval = idx >= 0 ? windows[idx] : el.closest('header') ? [1.4,3.8] : [52,54];
    const s = section ? bounds.get(section) : {top:0,height:Math.max(1,vh)};
    const local = clamp((r.top - s.top) / Math.max(1,s.height));
    let desired = lerp(interval[0],interval[1],local) + (r.left / innerWidth) * .22;
    const chars = (el.textContent || '').trim().length;
    let duration = kind === 'media' ? 1.65 : kind === 'rect' ? 1.1 : clamp(.8 + chars / 95,.9,2.1);
    if(el.matches('.hero-intro h1,.hero-intro .handwriting')){desired=1.85;duration=.9;}
    if(el.matches('.hero-role')){desired=2.05;duration=.85;}
    if(el.matches('.hero-description')){desired=2.2;duration=1.1;}
    if(el.matches('.hero-intro .primary-link')){desired=2.2;duration=1.15;}
    if(el.matches('.hero-portrait img')){desired=2.35;duration=1.35;}
    if(el.closest('header')&&kind!=='rect'){desired=3.05+(r.left/innerWidth)*.55;duration=.85;}
    const project=el.closest('.project-card');
    if(project){const index=[...root.querySelectorAll('.project-card')].indexOf(project);desired=(kind==='media'?8.8:10.3)+index*.65;duration=kind==='media'?1.55:.85;}
    if(el.matches('#portfolio h2,#portfolio .eyebrow')){desired=6.1;duration=.8;}
    if(el.matches('.brand-logo img')){const index=[...root.querySelectorAll('.brand-logo img')].indexOf(el);desired=13.5+index*.12;duration=1.1;}
    let contact;
    const controls=['lead-name','lead-email','lead-company','lead-type','lead-message'];
    const fieldIndex=controls.indexOf(el.matches('.lead-label-text')?el.closest('label').querySelector('input,select,textarea')?.id:el.id);
    if(fieldIndex>=0)contact=contactPlan(fieldIndex,el.matches('.lead-label-text')?'label':'field');
    else if(el.matches('.lead-heading h3'))contact=contactPlan(0,'heading');
    else if(el.matches('.lead-heading p'))contact=contactPlan(0,'intro');
    else if(el.matches('#contact-form button'))contact=contactPlan(0,'submit');
    else if(el.matches('#contact-form .form-note'))contact=contactPlan(0,'note');
    if(contact){desired=contact.start;duration=contact.duration;}
    desired=Math.max(2.15,desired);
    tasks.push({ el,kind,r,contact,desired,duration,start:desired,end:desired+duration,agent:0,header:!!el.closest('header'),font:parseFloat(css.fontSize),line:parseFloat(css.lineHeight)||parseFloat(css.fontSize)*1.4,descendants:[...el.querySelectorAll('*')] });
  }
  for (const el of contentNodes) add(el, el.matches('img,svg,input,select,textarea') ? 'media' : 'text');
  const contentSet = new Set(contentNodes);
  for (const el of nodes) {
    if (contentSet.has(el) || el.closest('svg') || ['IMG','PATH','INPUT'].includes(el.tagName)) continue;
    const c = getComputedStyle(el);
    const hasFill = c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== 'transparent';
    const hasLine = ['Top','Right','Bottom','Left'].some(side => parseFloat(c[`border${side}Width`]) > 0 && c[`border${side}Style`] !== 'none');
    if (hasFill || hasLine) add(el,'rect');
  }
  tasks.sort((a,b) => a.desired-b.desired || (a.kind==='rect'?-1:1));
  const segmenter=new Intl.Segmenter('pt-BR',{granularity:'grapheme'});
  tasks.forEach((task,index)=>task.id=String(index));
  for(const task of tasks.filter(t=>t.kind==='text')){
    const css=getComputedStyle(task.el),matrix=new DOMMatrix(css.transform==='none'?undefined:css.transform),origin=css.transformOrigin.split(' ').map(parseFloat);
    task.el.style.transform='none';
    const localRect=task.el.getBoundingClientRect();
    task.local={left:localRect.left,top:localRect.top,width:localRect.width,height:localRect.height,matrix:{a:matrix.a,b:matrix.b,c:matrix.c,d:matrix.d,e:matrix.e,f:matrix.f},originX:origin[0]||0,originY:origin[1]||0};
    const walker=document.createTreeWalker(task.el,NodeFilter.SHOW_TEXT),glyphs=[],characters=[];
    while(walker.nextNode()){
      const node=walker.currentNode;if(node.parentElement.closest('svg,style,script'))continue;
      for(const {segment,index} of segmenter.segment(node.textContent)){
        const range=document.createRange();range.setStart(node,index);range.setEnd(node,index+segment.length);
        const box=range.getClientRects()[0];
        if(box&&box.width>.1&&box.height>0){glyphs.push({x1:box.left-localRect.left,x2:box.right-localRect.left,y1:box.top-localRect.top,y2:box.bottom-localRect.top});characters.push(segment);}
      }
    }
    task.glyphs=glyphs;task.typing=typingStops(characters);
    task.el.style.transform=original.get(task.el).transform;
  }
  const free = Array(30).fill(1.2), jobs = Array.from({length:30},()=>[]);
  for (const task of tasks) {
    const active = agentCountAt(task.desired);
    let agent = 0;
    const cost=i=>{const previous=jobs[i].at(-1),distance=previous?Math.hypot(previous.r.left-task.r.left,previous.r.top-task.r.top):0;const preference=['text','media','rect'][i%3]===task.kind?0:.06;return Math.max(task.desired,free[i]+.16)+Math.min(.25,distance/(innerWidth+vh)*.2)+preference;};
    for (let i=1;i<active;i++) if (cost(i)<cost(agent)) agent=i;
    if(task.contact)agent=task.contact.agent;
    task.agent=agent;task.start=Math.max(task.desired,free[agent]+.16);task.end=Math.min(55,task.start+task.duration*(.94+(agent%7)*.02));
    if(task.end<=task.start)task.start=task.end-.2;
    free[agent]=task.end;jobs[agent].push(task);
  }
  const decorations = new Map();
  function deco(task) {
    if(decorations.has(task))return decorations.get(task);
    const selection=document.createElement('div');selection.className='trace-selection';
    selection.dataset.task=task.id;selection.dataset.agent=String(task.agent);selection.style.setProperty('--task-color',agentColor(task.agent));
    selection.innerHTML='<i></i><i></i><i></i><i></i><span></span><b></b>';
    overlay.append(selection);decorations.set(task,selection);return selection;
  }
  function restore() {
    for(const [el,style] of original) {el.style.visibility=style.visibility;el.style.clipPath=style.clipPath;el.style.transform=style.transform;el.style.pointerEvents=style.pointerEvents;}
    decorations.forEach(el=>el.remove());decorations.clear();
  }
  function openingPoint(agent,frame){const count=agentCountAt(frame),theta=agent/count*Math.PI*2+(frame-1)*1.8,rad=28+(agent%3)*9;return {x:viewportWidth/2+Math.cos(theta)*rad,y:vh/2+Math.sin(theta)*rad};}
  const taskPoint=(task,progress)=>taskAction(task,progress,world).pointer;
  function cursorPosition(agent,frame) {
    const color=agentColor(agent);
    if(frame<=1.5)return {...openingPoint(agent,frame),rotation:Math.sin(agent)*8,mode:'arrow',color};
    const work=jobs[agent];let prev=openingPoint(agent,1.5),previousEnd=1.5;
    for(const task of work) {
      const y=task.header?task.r.top:task.r.top-world,x=task.r.left;
      if(frame<task.start) {
        const arrival=Math.max(previousEnd,task.start-.9),target={x,y};
        const t=clamp((frame-arrival)/Math.max(.01,task.start-arrival));
        const p=travelPoint(prev,target,t,agent);
        const hovering=frame<arrival&&previousEnd>1.5;
        if(hovering){const breathe=smooth((frame-previousEnd)/.25)*smooth((arrival-frame)/.3);p.x+=Math.sin((frame-previousEnd)*2+agent)*3*breathe;p.y+=Math.sin((frame-previousEnd)*1.6)*3*breathe;}
        return {...p,rotation:Math.sin(t*Math.PI)*9,mode:'arrow',color,phase:hovering?'wait':'travel',opacity:hovering?.45:.85};
      }
      if(frame<=task.end) {
        const t=constructionPhase(frame,task.start,task.end-task.start).t;
        const action=taskAction(task,t,world);
        return {...action.pointer,color,task:task.id,phase:action.phase,opacity:1};
      }
      prev=taskPoint(task,1);previousEnd=task.end;
    }
    const u=clamp((frame-previousEnd)/.9),destination=parkPoint(agent,viewportWidth,vh);
    const p=travelPoint(prev,destination,u,agent);
    return {...p,rotation:destination.rotation*smooth(u),mode:'arrow',color,phase:u>=1?'park':'return',opacity:u>=1?.65:.9};
  }
  function renderParked(){
    for(let i=0;i<cursors.length;i++){
      const point=parkPoint(i,viewportWidth,vh),el=cursors[i];
      el.style.display='block';el.dataset.mode='arrow';el.dataset.phase='park';el.dataset.task='';el.style.color=agentColor(i);el.style.opacity='.65';
      el.style.transform=`translate(${point.x}px,${point.y}px) rotate(${point.rotation}deg)`;
    }
  }
  function render(frame) {
    if(disposed)return;
    currentFrame=clamp(frame,1,56);world=sampleCamera(camera,currentFrame);
    root.dataset.animationFrame=String(currentFrame);
    root.dataset.connectedLayers=String(nodes.filter(el=>el.isConnected).length);
    if(live) {root.style.transform='';root.style.setProperty('--world-y','0px');renderParked();return;}
    root.style.transform=`translateY(${-world}px)`;root.style.setProperty('--world-y',`${world}px`);
    let done=0;
    for(const el of nodes)el.style.visibility='hidden';
    for(const task of tasks) {
      const state=taskAction(task,(currentFrame-task.start)/(task.end-task.start),world),style=original.get(task.el);
      task.el.style.clipPath=style.clipPath;task.el.style.transform=style.transform;
      if(state.finished)done++;
      if(state.fill>0) {
        task.el.style.visibility='visible';
        if(task.kind!=='rect') task.descendants.forEach(child=>child.style.visibility='visible');
        if(!state.finished && task.kind!=='rect') {
          task.el.style.clipPath=state.clip;
        }
      }
      let selected=decorations.get(task);
      if(!state.active){if(selected)selected.style.display='none';continue;}
      selected=selected||deco(task);selected.style.display='block';
      if(state.active) {
        const {box,caret:caretGeometry}=state;
        selected.dataset.phase=state.phase;
        Object.assign(selected.style,{left:`${box.left}px`,top:`${box.top}px`,width:`${box.width}px`,height:`${box.height}px`});
        selected.classList.toggle('trace-media',task.kind==='media'&&state.fill<1);
        selected.style.setProperty('--placeholder-opacity',String(.45*(1-state.fill)));
        const badge=selected.querySelector('span');badge.textContent=`${Math.round(task.r.width*state.drawn)} × ${Math.round(task.r.height*state.drawn)}`;
        const caret=selected.querySelector('b');caret.style.display=task.kind==='text'&&state.fill>0?'block':'none';
        const m=caretGeometry.matrix;
        Object.assign(caret.style,{left:`${caretGeometry.x-box.left-1}px`,top:`${caretGeometry.y-box.top-1}px`,height:`${caretGeometry.height}px`,transformOrigin:'0 0',transform:`matrix(${m.a},${m.b},${m.c},${m.d},0,0)`});
      }
    }
    for(let i=0;i<cursors.length;i++) {
      const el=cursors[i];el.style.display=i<agentCountAt(currentFrame)?'block':'none';
      const c=cursorPosition(i,currentFrame);
      el.dataset.mode=c.mode;el.style.color=c.color;el.style.transform=`translate(${c.x}px,${c.y}px) rotate(${c.rotation}deg)`;
      el.dataset.task=c.task||'';el.dataset.phase=c.phase||'orbit';el.style.opacity=String(c.opacity??1);
    }
    report({frame:currentFrame,done,total:tasks.length,agents:agentCountAt(currentFrame),world});
  }
  function tick(now){request=null;if(disposed||live)return;const next=settleFrame(currentFrame,targetFrame,lastTick?now-lastTick:16);lastTick=now;render(next);if(next!==targetFrame)request=requestAnimationFrame(tick);}
  const scrollFrame=()=>1+55*clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight));
  function update(){if(live||forceFrame)return;targetFrame=scrollFrame();if(!request){lastTick=0;request=requestAnimationFrame(tick);}}
  function goLive(){live=true;cancelAnimationFrame(request);request=null;restore();root.style.transform='';root.style.setProperty('--world-y','0px');overlay.style.display='none';renderParked();return world;}
  if(!finished){overlay.style.display='';nodes.forEach(el=>el.style.visibility='hidden');targetFrame=forceFrame||scrollFrame();render(targetFrame);addEventListener('scroll',update,{passive:true});}else {restore();renderParked();}
  return {render,goLive,frame:()=>currentFrame,destroy(){disposed=true;cancelAnimationFrame(request);removeEventListener('scroll',update);restore();root.style.transform='';root.style.setProperty('--world-y','0px');}};
}
