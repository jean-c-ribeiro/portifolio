import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleKeys,agentCountAt,constructionPhase } from '../src/replica-engine.js';
test('agent counts follow the observed recording anchors',()=>{
  for(const [frame,count] of [[3,18],[5,19],[12,23],[18,24],[28,24],[35,28],[45,29],[52,30]])assert.equal(agentCountAt(frame),count);
});
test('a source box is drawn before its content can be inserted',()=>{
  for(let f=2;f<5;f+=.001){const state=constructionPhase(f,2,3);if(state.fill>0)assert.equal(state.drawn,1);}
});
test('timeline interpolation and reverse sampling preserve the same camera position',()=>{
  const keys=[[1,0],[5,0],[12,700],[21,1500],[56,5000]];
  const frames=[1,3,6,9,16,25,50,56];
  assert.deepEqual(frames.map(f=>sampleKeys(keys,f)),[...frames].reverse().map(f=>sampleKeys(keys,f)).reverse());
  assert.equal(sampleKeys(keys,0),0);assert.equal(sampleKeys(keys,100),5000);
});
