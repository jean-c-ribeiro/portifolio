import test from 'node:test';
import assert from 'node:assert/strict';
import * as geometry from '../src/agent-geometry.js';
import {typingStops} from '../src/motion-math.js';

const task={kind:'text',agent:2,r:{left:100,top:200,width:120,height:44},local:{left:100,top:200,width:120,height:44,matrix:{a:1,b:0,c:0,d:1,e:0,f:0},originX:0,originY:0},glyphs:[{x1:0,x2:9,y1:0,y2:16},{x1:9,x2:20,y1:0,y2:16},{x1:0,x2:7,y1:22,y2:38}],typing:typingStops(['A','B','C'])};

test('every drag pointer stays on the growing selection corner',()=>{
  for(let p=.001;p<.34;p+=.001){const state=geometry.taskAction(task,p,70);assert.equal(state.pointer.x,state.box.left+state.box.width);assert.equal(state.pointer.y,state.box.top+state.box.height);}
});
test('typing pointer and rendered caret use the same measured point on every line',()=>{
  for(let p=.46;p<=1;p+=.001){const s=geometry.taskAction(task,p,70);assert.equal(s.pointer.x,s.caret.x);assert.equal(s.pointer.y,s.caret.y+s.caret.height/2);}
});
test('an inclined greeting maps its caret into screen space without rotating its clipping coordinates',()=>{
  const inclined={...task,local:{...task.local,matrix:{a:0,b:1,c:-1,d:0,e:0,f:0}}};
  const state=geometry.taskAction(inclined,1,70);
  assert.equal(state.pointer.x,100-30);
  assert.equal(state.pointer.y,200+7-70);
  assert.equal(state.pointer.rotation,90);
  assert.ok(state.clip.includes('6.666666666666667%'));
});
test('media pointer tracks the edge that is actually being revealed',()=>{
  const media={...task,kind:'media'};
  for(let p=.46;p<=1;p+=.001){const s=geometry.taskAction(media,p,70);assert.equal(s.pointer.x,220);assert.equal(s.pointer.y,130+44*s.fill);}
});
test('background-only agents finish the drag at its corner instead of moving through the content',()=>{
  const rect={...task,kind:'rect'};
  for(const p of [.34,.46,.7,1]){const s=geometry.taskAction(rect,p,70);assert.equal(s.pointer.x,220);assert.equal(s.pointer.y,174);}
});
test('all stages join without a position jump, including rotated typing',()=>{
  for(const kind of ['text','media','rect'])for(const boundary of [.34,.46]){
    const before=geometry.taskAction({...task,kind},boundary-1e-8,70).pointer;
    const after=geometry.taskAction({...task,kind},boundary+1e-8,70).pointer;
    assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<.001);
  }
});
