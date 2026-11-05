import test from 'node:test';
import assert from 'node:assert/strict';
import {bindContactForm,contactEndpoint,sendLead} from '../src/contact-form.js';

test('leads use the existing form endpoint and retain the reply email and project details',async()=>{
  const data=new FormData();data.set('email','teste@example.com');data.set('mensagem','Pedidos & estoque\nPreciso de um site.');
  await sendLead(data,{request:async(url,options)=>{assert.equal(url,contactEndpoint);assert.equal(options.method,'POST');assert.equal(options.headers.Accept,'application/json');assert.equal(options.body.get('email'),'teste@example.com');assert.equal(options.body.get('mensagem'),'Pedidos & estoque\nPreciso de um site.');return {ok:true};}});
});

function fixture(request){
  const button={textContent:'Enviar solicitação',setAttribute(){},removeAttribute(){}},status={dataset:{}},listeners={};
  const form={resets:0,querySelector:selector=>selector.startsWith('button')?button:status,reportValidity:()=>true,reset(){this.resets++;},addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener:name=>delete listeners[name]};
  const dispose=bindContactForm(form,{request,createData:()=>new FormData()});
  return{form,button,status,dispose,submit:()=>listeners.submit({preventDefault(){}})};
}
test('a failed submission keeps the lead data and offers a retry',async()=>{
  const f=fixture(async()=>({ok:false,status:422}));await f.submit();assert.equal(f.form.resets,0);assert.equal(f.status.dataset.state,'error');assert.equal(f.button.disabled,false);f.dispose();
});
test('duplicate clicks send one request and reset only after success',async()=>{
  let resolve,calls=0;const f=fixture(()=>{calls++;return new Promise(done=>resolve=done);});
  const pending=f.submit();await f.submit();assert.equal(calls,1);assert.equal(f.button.disabled,true);assert.equal(f.form.resets,0);
  resolve({ok:true});await pending;assert.equal(f.form.resets,1);assert.equal(f.status.dataset.state,'success');f.dispose();
});
