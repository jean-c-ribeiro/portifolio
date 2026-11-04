import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/replica-engine.js';

test('replay measures the full stage even when the completed view hid its overlay',()=>{
  const overlay={style:{display:'none'},getBoundingClientRect(){return {width:this.style.display==='none'?0:1200};}};
  assert.equal(engine.measureStageWidth(overlay),1200);
  assert.equal(overlay.style.display,'none');
  overlay.style.display='';
  assert.equal(engine.measureStageWidth(overlay),1200);
  assert.equal(overlay.style.display,'');
});
