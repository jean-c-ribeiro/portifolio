# Portifolio — Jean Carlos / Logica Code

Portfólio em português com construção reversível controlada pela rolagem: agentes coloridos desenham caixas, inserem textos e revelam imagens.

## Desenvolvimento

Node.js 22 ou superior. Execute `npm ci`, `npm run dev`, `npm test` e `npm run build`.
O Vite gera os arquivos publicáveis em `dist/client`. Para o domínio `logicacode.com.br`, publique o conteúdo dessa pasta na raiz do GitHub Pages, preservando o arquivo `CNAME`.

O formulário prepara um rascunho de e-mail para revisão; ele não envia mensagens. As imagens de soluções são ilustrações conceituais, identificadas na página. O retrato foi fornecido pelo proprietário e ampliado para a composição aprovada.

## Referências e dependências

Estudo visual adaptado de https://portofoliorenando.pages.dev/ e dos frames fornecidos pelo proprietário. A animação dos agentes foi implementada independentemente; nenhum código da extensão Swarm Rebuild foi reutilizado. A estrutura visual e os estilos de referência não são apresentados como criação original exclusiva. A licença dos ícones Lucide está em `src/vendor/LUCIDE-LICENSE`. React, Vite e fontes mantêm suas licenças próprias.

O código-fonte está neste repositório. A publicação do domínio permanece em `jean-c-ribeiro/meu-site`, para preservar a configuração existente do GitHub Pages.
