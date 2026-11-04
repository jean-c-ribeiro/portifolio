import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSearch,projectEmail } from '../src/portfolio-content.js';

test('Portuguese solutions can be found without typing accents',()=>{
  assert.ok(normalizeSearch('Robótica e automação').includes(normalizeSearch('AUTOMACAO')));
});

test('email draft keeps user punctuation and line breaks inside the message',()=>{
  const name='Teste & revisão',type='Site? ou software',message='Pedidos & estoque\nPrazo: a definir?';
  const draft=new URL(projectEmail({name,type,message}));
  assert.equal(draft.pathname,'contato@logicacode.com.br');
  assert.equal(draft.searchParams.get('subject'),'Projeto: '+type);
  assert.ok(draft.searchParams.get('body').includes(message));
  assert.ok(draft.searchParams.get('body').includes(name));
  assert.deepEqual([...draft.searchParams.keys()],['subject','body']);
});
