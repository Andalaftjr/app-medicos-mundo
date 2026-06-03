# Evidencias de Desenvolvimento e Aplicacao

As evidencias abaixo demonstram que o sistema foi desenvolvido, testado e preparado para uso nas acoes da Medicos do Mundo em Santos-SP e Itanhaem-SP.

> Observacao LGPD: as imagens foram sanitizadas antes de entrar no repositorio. Nomes, documentos e identificacoes de usuarios/assistidos foram ocultados.

## 1. Dashboard operacional

O dashboard consolida indicadores por local da acao, permitindo leitura rapida de assistidos cadastrados, atendimentos, triagens, censos sociais e distribuicao por area.

![Dashboard operacional](evidencias/dashboard-operacional-sanitizado.png)

## 2. Tela de triagem

A triagem registra queixa principal, uso de medicacao, sinais vitais, prioridade, sinais de atencao e encaminhamento para areas de atendimento.

![Triagem sanitizada](evidencias/triagem-sanitizada.png)

## 3. Censo social

O censo social registra situacao de moradia, rede de apoio, trabalho, uso de substancias, saude sexual/reprodutiva, antecedentes clinicos, saude mental, seguranca alimentar e pets.

![Censo social sanitizado](evidencias/censo-social-sanitizado.png)

## 4. Evidencias tecnicas no repositorio

- Codigo React em `src/App.jsx` e componentes auxiliares em `src/components/`.
- Configuracao Firebase em `firebase.json`, `firestore.rules`, `storage.rules` e `functions/index.js`.
- Exportacao de planilhas via biblioteca `write-excel-file`.
- Controle de acesso por perfil nas regras do Firestore e nas Cloud Functions.
- Build de producao validado com `npm run build`.
- Qualidade estatica validada com `npm run lint`.

## 5. Evidencias operacionais

Durante o desenvolvimento foram utilizados cadastros, triagens, atendimentos simulados e registros reais de validacao para testar:

- assistidos com informacoes completas;
- assistidos com informacoes parciais;
- situacoes criticas ou de atencao especial;
- atendimento extra;
- fila de espera;
- dashboards por area;
- exportacao geral e por data;
- perfis de voluntario, academico, profissional, coordenacao e administracao.

As evidencias com dados pessoais nao foram publicadas no GitHub por seguranca e adequacao a LGPD.
