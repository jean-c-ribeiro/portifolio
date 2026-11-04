// One geometry model for both the agent and the content it builds.
import {textSnapshot,travelPoint} from './motion-math.js';
const clamp=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};

export function screenPoint(task,point,world=0){
  const g=task.local||{left:task.r.left,top:task.r.top,width:task.r.width,height:task.r.height,matrix:{a:1,b:0,c:0,d:1,e:0,f:0},originX:0,originY:0};
  const m=g.matrix,x=point.x-g.originX,y=point.y-g.originY;
  return {x:g.left+g.originX+m.a*x+m.c*y+m.e,y:g.top+g.originY+m.b*x+m.d*y+m.f-(task.header?0:world)};
}

export function taskAction(task,progress,world=0){
  const t=clamp(progress),drawn=ease(t/.34),fill=clamp((t-.46)/.44),r=task.r;
  const top=r.top-(task.header?0:world);
  const box={left:r.left,top,width:r.width*drawn,height:r.height*drawn};
  const corner={x:r.left+r.width,y:top+r.height};
  const local=task.local||r;
  const text=task.kind==='text'?textSnapshot(task.glyphs||[],task.typing||[],fill,local.width,local.height):null;
  const measured=text?.caret||{x:0,y:0,height:task.line||16};
  const caretOrigin=screenPoint(task,measured,world);
  const textPointer=screenPoint(task,{x:measured.x,y:measured.y+measured.height/2},world);
  const matrix=task.local?.matrix||{a:1,b:0,c:0,d:1};
  const rotation=Math.atan2(matrix.b,matrix.a)*180/Math.PI;
  const caret={...caretOrigin,height:measured.height,matrix};
  let pointer,phase;
  if(t<.34){pointer={x:box.left+box.width,y:box.top+box.height,mode:'cross',rotation:0};phase='draw';}
  else if(task.kind==='rect'){pointer={...corner,mode:'arrow',rotation:0};phase='hold';}
  else {
    const insertion=task.kind==='text'?textPointer:{x:r.left+r.width,y:top+r.height*fill};
    if(t<.46){pointer={...travelPoint(corner,insertion,(t-.34)/.12,task.agent),mode:'arrow',rotation:0};phase='position';}
    else {pointer={...insertion,mode:task.kind==='text'?'text':'arrow',rotation:task.kind==='text'?rotation:0};phase=task.kind==='text'?'type':'reveal';}
  }
  return {t,drawn,fill,active:t>0&&t<1,finished:t>=1,box,caret,pointer,phase,clip:text?.clip||`inset(0 0 ${100-fill*100}% 0)`};
}
