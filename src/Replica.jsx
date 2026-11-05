import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import pointer from './vendor/mouse-pointer-2.js';
import closeIcon from './vendor/x.js';
import { mountReplica } from './replica-engine.js';
import { solutions, normalizeSearch } from './portfolio-content.js';
import {bindContactForm} from './contact-form.js';
import portfolioMarkup from './portfolio.html?raw';

function Icon({ nodes=pointer }) { return createElement('svg',{viewBox:'0 0 24 24',fill:'currentColor',stroke:'currentColor',strokeWidth:1,'aria-hidden':true},nodes.map(([tag,attrs],i)=>createElement(tag,{...attrs,key:i}))); }
function prepareLiveInteractions(root,onProject) {
  const menu=root.querySelector('.menu-toggle');
  let mobileMenu;
  let category='all',query='';
  function filterProjects(){
    let visible=0;
    root.querySelectorAll('.project-card').forEach(card=>{const match=(category==='all'||card.dataset.category===category)&&normalizeSearch(card.textContent+' '+(card.querySelector('img')?.alt||'')).includes(normalizeSearch(query));card.hidden=!match;if(match)visible++;});
    const empty=root.querySelector('.portfolio-empty');if(empty)empty.hidden=visible>0;
  }
  function click(event) {
    const button=event.target.closest('button');
    if(button===menu) {
      const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));
      mobileMenu?.remove();
      if(open){mobileMenu=document.createElement('nav');mobileMenu.id='mobile-menu';mobileMenu.className='replica-mobile-menu';mobileMenu.innerHTML=root.querySelector('.desktop-nav').innerHTML;root.querySelector('header').append(mobileMenu);}
    }
    if(event.target.closest('#mobile-menu a')){mobileMenu?.remove();menu?.setAttribute('aria-expanded','false');}
    if(button?.closest('.experience-row')) {
      const row=button.closest('.experience-row'),open=!row.classList.contains('is-open');row.classList.toggle('is-open',open);button.setAttribute('aria-expanded',String(open));const panel=row.querySelector('p');if(panel)panel.hidden=!open;
    }
    if(button?.closest('.filters')){
      category=button.dataset.category;root.querySelectorAll('.filters button').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});filterProjects();
    }
    const project=event.target.closest('[data-project]');if(project)onProject(Number(project.dataset.project));
    if(button?.classList.contains('brand-all')){const rail=root.querySelector('.brand-rail');rail?.classList.toggle('replica-brands-expanded');}
  }
  function input(event) {
    if(event.target.matches('input[type="range"]')){const val=event.target.value;const comparison=event.target.closest('.comparison-stage');if(comparison)comparison.style.setProperty('--cut',`${val}%`);event.target.setAttribute('aria-valuetext',`${val}% solid`);}
    if(event.target.matches('input[type="search"]')){query=event.target.value;filterProjects();}
  }
  const cleanupContact=bindContactForm(root.querySelector('#contact-form'));
  root.addEventListener('click',click);root.addEventListener('input',input);
  return()=>{root.removeEventListener('click',click);root.removeEventListener('input',input);cleanupContact();mobileMenu?.remove();};
}

function SolutionDialog({index,onClose}) {
  const dialog=useRef(null),solution=solutions[index];
  useEffect(()=>{const node=dialog.current;node.showModal();const close=()=>onClose();node.addEventListener('close',close);return()=>node.removeEventListener('close',close);},[onClose]);
  return <dialog ref={dialog} className="solution-dialog" aria-labelledby="solution-dialog-title" onClick={e=>{if(e.target===e.currentTarget)e.currentTarget.close();}}><button className="solution-dialog-close" onClick={()=>dialog.current.close()}>Fechar</button><img src={solution.image} alt={`Imagem conceitual: ${solution.title}`}/><div className="solution-dialog-copy"><p className="eyebrow">POSSIBILIDADE DE APLICAÇÃO</p><h2 id="solution-dialog-title">{solution.title}</h2><p>{solution.description}</p><ul>{solution.items.map(item=><li key={item}>{item}</li>)}</ul><p className="concept-note">Imagem ilustrativa, não representa uma entrega a cliente. Recursos e escopo são definidos na proposta.</p><a className="primary-link" href={`mailto:contato@logicacode.com.br?subject=${encodeURIComponent(solution.title)}`}>Conversar sobre esta solução</a></div></dialog>;
}

export function Replica() {
  const html=portfolioMarkup,error='';
  const [status,setStatus]=useState({frame:1,agents:18,done:0,total:0});
  const [live,setLive]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches||new URLSearchParams(location.search).get('view')==='complete');
  const [tour,setTour]=useState(false),[speed,setSpeed]=useState(1),[ready,setReady]=useState(false);
  const [layoutVersion,setLayoutVersion]=useState(0);
  const [selected,setSelected]=useState(null);
  const source=useRef(null),overlay=useRef(null),cursorLayer=useRef(null),engine=useRef(null),readyTimer=useRef(null);
  const forced=Number(new URLSearchParams(location.search).get('frame'))||null;
  // Preserve the exact DOM nodes being animated when the toolbar updates its counters.
  const sourceNode=useMemo(()=><div ref={source} className="reference-document" dangerouslySetInnerHTML={{__html:html}} />,[html]);
  useEffect(()=>{
    if(!html)return;let stop=false,cleanup,initialized=false;
    const root=source.current;
    function initialize(){
      if(stop||initialized)return;initialized=true;setReady(true);cleanup=prepareLiveInteractions(root,setSelected);
      engine.current=mountReplica({root,overlay:overlay.current,cursors:[...cursorLayer.current.children],report:setStatus,forceFrame:forced,finished:live});
    }
    Promise.allSettled([document.fonts.ready,...[...root.querySelectorAll('img')].map(img=>{img.loading='eager';return img.decode().catch(()=>{});})]).then(initialize);
    // Resource failures must not leave the preview permanently behind a loading screen.
    readyTimer.current=setTimeout(initialize,3500);
    return()=>{stop=true;clearTimeout(readyTimer.current);cleanup?.();engine.current?.destroy();engine.current=null;};
  },[html,live,forced,layoutVersion]);
  useEffect(()=>{let pending;function resize(){clearTimeout(pending);pending=setTimeout(()=>setLayoutVersion(v=>v+1),150);}addEventListener('resize',resize);document.fonts.addEventListener('loadingdone',resize);return()=>{clearTimeout(pending);removeEventListener('resize',resize);document.fonts.removeEventListener('loadingdone',resize);};},[]);
  useEffect(()=>{if(!tour||live)return;let last,frame;function tick(now){if(last){window.scrollBy({top:(now-last)*.15*speed,behavior:'instant'});}last=now;if(scrollY+innerHeight>=document.documentElement.scrollHeight-2){setTour(false);return;}frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[tour,speed,live]);
  function finish(){setTour(false);const y=engine.current?.goLive()||0;setLive(true);requestAnimationFrame(()=>window.scrollTo({top:y,behavior:'instant'}));}
  useEffect(()=>{if(!live&&ready&&!forced&&status.frame>=55.98)finish();},[live,ready,forced,status.frame]);
  function replay(){
    setTour(false);setSelected(null);
    // Clear the completed frame before enabling the automatic-finish watcher again.
    setStatus(current=>({...current,frame:forced||1,done:0}));
    const root=source.current;
    root?.querySelectorAll('.project-card').forEach(card=>card.hidden=false);
    root?.querySelectorAll('.filters button').forEach(button=>{const active=button.dataset.category==='all';button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
    root?.querySelectorAll('input[type="search"]').forEach(input=>input.value='');
    root?.querySelectorAll('.portfolio-empty').forEach(empty=>empty.hidden=true);
    root?.querySelectorAll('.experience-row').forEach((row,i)=>{row.classList.toggle('is-open',i===0);row.querySelector('button')?.setAttribute('aria-expanded',String(i===0));const panel=row.querySelector('p');if(panel)panel.hidden=i!==0;});
    root?.querySelectorAll('details').forEach(details=>details.open=false);
    setLive(false);requestAnimationFrame(()=>{window.scrollTo({top:0,behavior:'instant'});engine.current?.render(forced||1);});
  }
  useEffect(()=>{function key(e){if(e.key==='Escape'&&!live)finish();}addEventListener('keydown',key);return()=>removeEventListener('keydown',key);},[live]);
  return <>
    <div className={`replica-shell ${live?'replica-live':''} ${ready?'replica-ready':''}`} inert={!live} aria-hidden={!live}>
      {sourceNode}
    </div>
    {!live&&<div className="replica-scroll-space" aria-hidden="true" style={forced?{height:'100vh'}:undefined} />}
    {!live&&<><div className="trace-ruler-x" aria-hidden="true">{Array.from({length:40},(_,i)=><span key={i} style={{left:i*50}}>{i*50}</span>)}</div><div className="trace-ruler-y" aria-hidden="true">{Array.from({length:30},(_,i)=><span key={i} style={{top:i*50}}>{i*50}</span>)}</div></>}
    <div ref={overlay} className="trace-overlay" aria-hidden="true" />
    {!live&&ready&&status.frame<1.9&&<div className="trace-initial-mark display" aria-hidden="true"><span>J</span><small>Role para construir</small></div>}
    <div ref={cursorLayer} className="trace-cursors" aria-hidden="true">{Array.from({length:30},(_,i)=><div key={i} className="trace-cursor"><Icon /><span className="trace-cross"/><span className="trace-ibeam"/></div>)}</div>
    {!ready&&!error&&<div className="replica-loading"><span className="display">J</span><small>Preparando a construção…</small></div>}
    {error&&<div role="alert" className="replica-error">{error}<button onClick={()=>location.reload()}>Tentar novamente</button></div>}
    <div className="trace-toolbar" role="region" aria-label="Controles da reconstrução" data-frame={status.frame.toFixed(2)}>
      {forced&&<label className="trace-frame-picker">Frame <input type="number" aria-label="Frame de referência" min="1" max="56" step="0.05" value={Number(status.frame.toFixed(2))} onChange={e=>{const f=Number(e.target.value);if(f>=1&&f<=56)engine.current?.render(f);}}/></label>}
      {!live&&<><div className="trace-avatars" aria-hidden="true">{['#a7e6e7','#c7c4f1','#edcbd3','#eee2af','#b6e5ce'].map(c=><i key={c} style={{background:c}}/>)}</div><span className="trace-count">{status.agents} agentes</span><span className="trace-layer-count">{status.done} / {status.total} etapas</span><div className="trace-mini-progress"><i style={{width:`${(status.frame-1)/55*100}%`}}/></div><button className={tour?'trace-tour active':'trace-tour'} onClick={()=>setTour(!tour)}>{tour?'Apresentando':'Apresentar'}</button><button onClick={()=>setSpeed(speed===3?1:speed+1)} aria-label="Velocidade da apresentação">{speed}×</button></>}
      <button disabled={live&&matchMedia('(prefers-reduced-motion: reduce)').matches} onClick={live?replay:finish}>{live?'Rever construção':'Ver site pronto'}</button>
      {!live&&<button className="trace-close" onClick={finish} aria-label="Encerrar reconstrução"><Icon nodes={closeIcon}/></button>}
    </div>
    {selected!==null&&<SolutionDialog index={selected} onClose={()=>setSelected(null)}/>}
  </>;
}
