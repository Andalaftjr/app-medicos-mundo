# Relatorio da Atividade Extensionista II

## Identificacao

**Curso:** CST em Analise e Desenvolvimento de Sistemas  
**Disciplina:** Atividade Extensionista II: Tecnologia Aplicada a Inclusao Digital - Projeto  
**Etapa:** Trabalho final  
**Aluno:** Leandro Andalaft dos Santos Junior  
**RU:** 4548358  

## Titulo

Desenvolvimento de uma ferramenta web responsiva para triagem, censo social, fila de atendimento e registro multiprofissional em acoes da Medicos do Mundo.

## Setor de aplicacao

O projeto foi aplicado na Medicos do Mundo em acoes humanitarias voltadas a populacao em situacao de vulnerabilidade social. O primeiro ciclo ocorreu em Santos-SP, especialmente na regiao do Centro POP/Paqueta, com posterior expansao para Itanhaem-SP, incluindo a localidade Belas Artes.

A instituicao atua com frente multiprofissional de cuidado, envolvendo cadastro, triagem, medicina, enfermagem/curativos, odontologia, farmacia, psicologia, fisioterapia, nutricao, vacinacao, biomedicina, veterinaria, podologia, justica de rua, acolhimento social, doacoes, apoio a mulher, emissao de documentos, beleza de rua e atendimento infantil/brinquedoteca.

## Objetivos de Desenvolvimento Sustentavel

- ODS 03 - Saude e bem-estar.
- ODS 10 - Reducao das desigualdades.
- ODS 17 - Parcerias e meios de implementacao.

## Problema identificado

Antes da solucao, os registros das acoes eram mais fragmentados e dependiam de combinacoes de formularios, anotacoes, planilhas, mensagens e consolidacoes posteriores. Em campo, isso dificultava:

- acompanhar o fluxo de assistidos em tempo real;
- identificar quem ja havia passado por triagem, censo ou atendimento;
- priorizar casos criticos, criancas, pessoas com deficiencia ou necessidades especificas;
- organizar dados por local da acao;
- gerar indicadores claros para coordenacao e parceiros;
- reduzir retrabalho entre voluntarios e profissionais.

## Objetivos do projeto

1. Mapear o fluxo atual de acolhimento, cadastro, triagem e atendimento.
2. Identificar gargalos de registro, consulta, fila e consolidacao de dados.
3. Definir requisitos funcionais para uso por voluntarios, academicos e profissionais.
4. Desenvolver uma ferramenta simples, responsiva e segura para uso em celular ou notebook.
5. Implantar um prototipo funcional com cadastro, triagem, censo, fila, atendimento, dashboard e exportacao.
6. Validar o sistema em Santos-SP e expandir para Itanhaem-SP.

## Metodologia

O projeto utilizou uma abordagem aplicada, iterativa e incremental. O desenvolvimento foi conduzido em ciclos de levantamento, prototipacao, validacao com usuarios, ajuste de interface, testes funcionais e refinamento de seguranca.

As etapas principais foram:

1. **Levantamento de requisitos:** analise do fluxo real de atendimento e comentarios da equipe multidisciplinar.
2. **Modelagem do processo:** organizacao do fluxo em cadastro, triagem, censo social, fila, atendimento por area, dashboard e exportacao.
3. **Prototipacao funcional:** desenvolvimento de telas responsivas para uso em celular durante a acao.
4. **Validacao em campo:** uso inicial em Santos-SP, com registros de assistidos, triagens e atendimentos.
5. **Ajustes por feedback:** melhoria de textos, campos obrigatorios, alertas, labels, prioridades, fila e dashboards.
6. **Expansao controlada:** inclusao de Itanhaem-SP como novo local de acao.
7. **Documentacao e evidencias:** producao de relatorio, diagramas, prints sanitizados e orientacao de publicacao no GitHub.

## Tecnologias utilizadas

| Camada | Tecnologias |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Interface | Lucide React, componentes responsivos, layout mobile-first |
| Backend | Firebase Authentication, Cloud Firestore, Cloud Functions |
| Seguranca | Firestore Security Rules, validacao de e-mail, RBAC, filtros por local da acao |
| Arquivos | Firebase Storage para imagens quando aplicavel |
| Exportacao | write-excel-file |
| Publicacao | Vercel |
| Metricas | Vercel Analytics e Vercel Speed Insights |
| Qualidade | ESLint, build Vite e testes manuais no navegador |

## Funcionalidades implementadas

- Login com perfis operacionais.
- Cadastro de assistidos com nome civil/social, documentos e dados essenciais.
- Selecao obrigatoria do local da acao.
- Separacao entre filial da equipe e local da acao.
- Triagem com queixa, medicacao, sinais vitais, IMC, prioridade e encaminhamentos.
- Censo social com moradia, rede de apoio, trabalho, uso de substancias, saude sexual/reprodutiva, antecedentes, saude mental, seguranca alimentar e pets.
- Fila de atendimento com estado do plantao.
- Atendimento extra para casos que precisam de cuidado sem aguardar fluxo completo.
- Prontuario com historico e visao por area.
- Modulos por especialidade.
- Dashboards gerais e por area.
- Exportacao por data e exportacao geral.
- Gestao de usuarios para administracao/coordenacao.
- Evidencias sanitizadas para publicacao academica.

## Resultados obtidos

O sistema foi aplicado inicialmente em Santos-SP e permitiu organizar melhor o fluxo de assistidos durante as acoes. A equipe passou a visualizar com mais clareza os registros de triagem, censo social, atendimentos e pendencias. Com base na aceitacao e utilidade observadas, o projeto foi expandido para Itanhaem-SP.

Entre os resultados observados:

- centralizacao das informacoes em uma ferramenta unica;
- reducao de retrabalho no registro dos atendimentos;
- melhor identificacao de assistidos que precisam de atencao;
- apoio a decisao por meio de dashboards;
- separacao dos dados por local da acao;
- exportacao estruturada para consolidacao posterior;
- fortalecimento da documentacao academica e tecnica do projeto.

## Consideracoes de LGPD e seguranca

O projeto evita publicacao de dados pessoais no repositorio. As evidencias usadas na documentacao foram sanitizadas, removendo nomes, documentos e informacoes identificaveis. O sistema possui autenticacao, perfis de acesso e regras de seguranca para reduzir exposicao indevida.

## Consideracoes finais

A atividade extensionista resultou em uma solucao funcional, aplicada e documentada, com impacto direto na organizacao operacional das acoes da Medicos do Mundo. O projeto demonstrou aderencia aos objetivos da disciplina ao transformar uma necessidade social real em uma ferramenta digital testada em contexto pratico.

O sistema encontra-se publicado na Vercel e documentado no GitHub, com evidencias anonimizadas, diagramas, instrucoes de execucao e entregaveis academicos em Word e PDF.
