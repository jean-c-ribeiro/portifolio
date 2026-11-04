// Deterministic calculations shared by the scroll construction engine and its regression tests.
const cap=value=>Math.max(0,Math.min(1,value));
const ease=value=>{const t=cap(value);return t*t*(3-2*t);};

export const agentColor=index=>`hsl(${Math.round((195+index*137.508)%360)} 68% ${[74,80,70][index%3]}%)`;

export function travelPoint(from,to,progress,seed=0){
  const t=ease(progress),dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)||1;
  const bend=Math.min(75,length*.16)*Math.sin(seed*2.4+.7);
  const control={x:(from.x+to.x)/2-dy/length*bend,y:(from.y+to.y)/2+dx/length*bend};
  return {x:(1-t)**2*from.x+2*(1-t)*t*control.x+t*t*to.x,y:(1-t)**2*from.y+2*(1-t)*t*control.y+t*t*to.y};
}

export function sampleCamera(keys,frame){
  if(frame<=keys[0][0])return keys[0][1];
  if(frame>=keys.at(-1)[0])return keys.at(-1)[1];
  const slope=i=>(keys[i+1][1]-keys[i][1])/(keys[i+1][0]-keys[i][0]);
  function tangent(i){
    if(i===0)return slope(0);
    if(i===keys.length-1)return slope(i-1);
    const a=slope(i-1),b=slope(i);if(a*b<=0)return 0;
    const previous=keys[i][0]-keys[i-1][0],next=keys[i+1][0]-keys[i][0];
    const w1=2*next+previous,w2=next+2*previous;
    return (w1+w2)/(w1/a+w2/b);
  }
  let i=0;while(frame>keys[i+1][0])i++;
  const [start,a]=keys[i],[end,b]=keys[i+1],h=end-start,t=(frame-start)/h;
  return (2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*h*tangent(i)+(-2*t**3+3*t*t)*b+(t**3-t*t)*h*tangent(i+1);
}

export function typingStops(characters){
  let total=0;
  return characters.map((character,index)=>{const previous=characters[index-1]||'';total+=1+(/[.!?]/.test(previous)?6:/[,;:]/.test(previous)?3:0);return total;});
}
export function typedCount(stops,progress){
  const budget=cap(progress)*(stops.at(-1)||0);let lo=0,hi=stops.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(stops[mid]<=budget)lo=mid+1;else hi=mid;}
  return lo;
}
export function textSnapshot(glyphs,stops,progress,width,height){
  const count=typedCount(stops,progress),glyph=glyphs[Math.max(0,count-1)]||{x1:0,x2:0,y1:0,y2:16};
  const caret={x:count?glyph.x2:glyph.x1,y:glyph.y1,height:Math.max(1,glyph.y2-glyph.y1)};
  if(!count)return {count,caret,clip:'inset(0 100% 0 0)'};
  const top=cap((glyph.y1-2)/height)*100,bottom=cap((glyph.y2+2)/height)*100,x=cap((glyph.x2+1)/width)*100;
  return {count,caret,clip:`polygon(0 0,100% 0,100% ${top}%,${x}% ${top}%,${x}% ${bottom}%,0 ${bottom}%)`};
}
export function settleFrame(current,target,elapsed){
  const next=current+(target-current)*(1-Math.exp(-Math.max(0,Math.min(50,elapsed))/70));
  return Math.abs(target-next)<.002?target:next;
}
