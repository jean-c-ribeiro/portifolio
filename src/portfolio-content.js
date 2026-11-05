export const solutions = [
  { title:'Sites e experiências digitais', image:'/assets/project-web-commercial.webp', description:'Um site para apresentar sua empresa com clareza, funcionar em diferentes telas e facilitar o contato.', items:['Landing pages e sites institucionais','Navegação responsiva no computador e no celular','Formulários e integrações definidos no escopo'] },
  { title:'Software para empresas', image:'/assets/project-software.webp', description:'Um sistema começa pela rotina da sua empresa. Entendemos o processo antes de definir o que precisa ser construído.', items:['Organização de pedidos e informações','Painéis para acompanhar a operação','Integrações para reduzir tarefas manuais'] },
  { title:'Robótica e automação', image:'/assets/project-automation.webp', description:'Software e eletrônica podem trabalhar juntos para medir, acompanhar e controlar processos. O primeiro passo é avaliar a viabilidade.', items:['Protótipos com Arduino, ESP32 e Raspberry Pi','Leitura de sensores e controle de atuadores','Monitoramento e integração com software'] },
];
export const normalizeSearch=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function projectEmail({name,type,message}) {
  return `mailto:contato@logicacode.com.br?subject=${encodeURIComponent(`Projeto: ${type}`)}&body=${encodeURIComponent(`Olá, Jean!\n\nMeu nome é ${name}.\nTipo de projeto: ${type}\n\n${message}\n`)}`;
}
