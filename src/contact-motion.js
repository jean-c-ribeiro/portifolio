export function contactPlan(index,part) {
  if(part==='heading')return {start:48.55,duration:.75,agent:6};
  if(part==='intro')return {start:48.7,duration:.9,agent:7};
  if(part==='submit')return {start:54,duration:.65,agent:5};
  if(part==='note')return {start:54.15,duration:.7,agent:7};
  const starts=[49.3,49.5,50.45,50.65,51.85],duration=index===4?1.2:.85;
  return {start:starts[index]+(part==='label'?duration+.1:0),duration:part==='label'?.62:duration,agent:index};
}

export function parkPoint(agent,width,height) {
  const corner=agent%4,slot=Math.floor(agent/4),right=corner%2===1,bottom=corner>=2;
  return {x:right?width-6:6,y:bottom?height-30-slot*15:24+slot*15,rotation:right?180:0};
}
