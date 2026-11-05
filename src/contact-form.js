export const contactEndpoint='https://formspree.io/f/meaoaayd';

export async function sendLead(data,{request=fetch,signal}={}) {
  const response=await request(contactEndpoint,{method:'POST',body:data,headers:{Accept:'application/json'},signal});
  if(!response.ok)throw new Error('Não foi possível confirmar o envio.');
  return response;
}

export function bindContactForm(form,{request=fetch,createData=node=>new FormData(node)}={}) {
  const button=form.querySelector('button[type="submit"]'),status=form.querySelector('[role="status"]');
  let sending=false,controller,disposed=false;
  async function submit(event) {
    event.preventDefault();
    if(sending||disposed||!form.reportValidity())return;
    const data=createData(form);
    if(data.get('_gotcha'))return;
    sending=true;controller=new AbortController();
    button.disabled=true;button.setAttribute('aria-busy','true');button.textContent='Enviando…';
    status.dataset.state='pending';status.textContent='Enviando sua solicitação…';
    const timer=setTimeout(()=>controller.abort(),20000);
    try {
      await sendLead(data,{request,signal:controller.signal});
      if(disposed)return;
      form.reset();status.dataset.state='success';
      status.textContent='Solicitação enviada! Vou responder pelo e-mail que você informou.';
    } catch {
      if(disposed)return;
      status.dataset.state='error';
      status.textContent='Não foi possível confirmar o envio. Seus dados foram mantidos. Tente novamente ou escreva para contato@logicacode.com.br.';
    } finally {
      clearTimeout(timer);sending=false;button.disabled=false;button.removeAttribute('aria-busy');button.textContent='Enviar solicitação';
    }
  }
  form.addEventListener('submit',submit);
  return()=>{disposed=true;controller?.abort();form.removeEventListener('submit',submit);};
}
