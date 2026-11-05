import test from 'node:test';
import assert from 'node:assert/strict';
import * as motion from '../src/contact-motion.js';

test('contact agents build each field before returning to write its label',()=>{
  for(let i=0;i<5;i++){
    const field=motion.contactPlan(i,'field'),label=motion.contactPlan(i,'label');
    assert.equal(field.agent,label.agent);
    assert.ok(label.start>=field.start+field.duration);
    assert.ok(label.start+label.duration<motion.contactPlan(0,'submit').start);
  }
  assert.ok(motion.contactPlan(0,'field').start<motion.contactPlan(1,'field').start);
  assert.ok(motion.contactPlan(3,'field').start<motion.contactPlan(4,'field').start);
});

test('all thirty parked pointers fit into edge gutters on mobile and desktop',()=>{
  for(const width of [320,390,710,1280,1920])for(const height of [568,720,900]){
    const points=Array.from({length:30},(_,i)=>motion.parkPoint(i,width,height));
    assert.equal(new Set(points.map(p=>`${p.x},${p.y}`)).size,30);
    for(const p of points){assert.ok(p.x<20||p.x>width-20);assert.ok(p.y>=20&&p.y<=height-20);}
  }
});

test('the last operation has time to retreat before the final frame',()=>{
  const note=motion.contactPlan(0,'note');
  assert.ok(note.start+note.duration+.9<56);
});
