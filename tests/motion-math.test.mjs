import test from 'node:test';
import assert from 'node:assert/strict';
import * as motion from '../src/motion-math.js';

test('cursor transfers join both work points without jumping at their boundaries',()=>{
  const from={x:90,y:300},to={x:800,y:150};
  assert.deepEqual(motion.travelPoint(from,to,0,4),from);
  assert.deepEqual(motion.travelPoint(from,to,1,4),to);
  const near=motion.travelPoint(from,to,.99999,4);
  assert.ok(Math.hypot(near.x-to.x,near.y-to.y)<.01);
  assert.notEqual(motion.travelPoint(from,to,.5,4).y,225);
});

test('camera passes every anchor without reversing or overshooting a section',()=>{
  const keys=[[1,0],[5,0],[9,700],[12,1100],[18,1800],[21,1800],[56,5000]];
  for(const [f,y] of keys)assert.equal(motion.sampleCamera(keys,f),y);
  let previous=0;
  for(let f=1;f<=56;f+=.01){const y=motion.sampleCamera(keys,f);assert.ok(y>=previous-1e-7&&y<=5000);previous=y;}
  const epsilon=.0001,k=12;
  const before=(motion.sampleCamera(keys,k)-motion.sampleCamera(keys,k-epsilon))/epsilon;
  const after=(motion.sampleCamera(keys,k+epsilon)-motion.sampleCamera(keys,k))/epsilon;
  assert.ok(Math.abs(before-after)<.05);
});

test('typing uses real glyph positions including the start of the next line',()=>{
  const glyphs=[{x1:0,x2:9,y1:0,y2:16},{x1:9,x2:20,y1:0,y2:16},{x1:0,x2:7,y1:22,y2:38}];
  const stops=motion.typingStops(['A','B','C']);
  const state=motion.textSnapshot(glyphs,stops,1,100,44);
  assert.equal(state.count,3);
  assert.deepEqual(state.caret,{x:7,y:22,height:16});
  assert.equal(motion.textSnapshot(glyphs,stops,0,100,44).count,0);
});

test('typing pauses after punctuation and never reveals half a character',()=>{
  const stops=motion.typingStops(['A','.', 'B']);
  assert.equal(motion.typedCount(stops,.3),2);
  assert.equal(motion.typedCount(stops,.7),2);
  assert.equal(motion.typedCount(stops,1),3);
});

test('wheel input settles smoothly and can reverse without an immediate scene jump',()=>{
  const first=motion.settleFrame(1,8,16);
  assert.ok(first>1&&first<4);
  assert.ok(motion.settleFrame(first,1,16)<first);
  let frame=1;for(let i=0;i<100;i++)frame=motion.settleFrame(frame,8,16);
  assert.equal(frame,8);
});

test('all 30 agents keep a distinct stable color',()=>{
  const colors=Array.from({length:30},(_,i)=>motion.agentColor(i));
  assert.equal(new Set(colors).size,30);
  assert.deepEqual(colors,Array.from({length:30},(_,i)=>motion.agentColor(i)));
});
