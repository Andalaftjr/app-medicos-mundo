# Prontuario Unificado MDM

Ferramenta web responsiva desenvolvida para apoiar a Medicos do Mundo em acoes humanitarias realizadas em Santos-SP e Itanhaem-SP.

O projeto foi produzido como parte da disciplina **Atividade Extensionista II: Tecnologia Aplicada a Inclusao Digital - Projeto**, do curso **CST em Analise e Desenvolvimento de Sistemas**.

## Status de aplicacao

O sistema foi desenvolvido, aplicado e utilizado inicialmente nas acoes da Medicos do Mundo em Santos-SP. A partir do uso em campo e da satisfacao relatada pelos voluntarios com a organizacao do fluxo, a ferramenta foi expandida para Itanhaem-SP, onde tambem ja foi utilizada. No momento, o projeto encontra-se em fase de entrega final das versoes documentadas, com o sistema funcional, evidencias anonimizadas e documentacao academica preparada para avaliacao.

Versao publicada: [https://app-medicos.vercel.app/](https://app-medicos.vercel.app/)

## Objetivo

Organizar o fluxo de acolhimento, cadastro, triagem, censo social, fila de espera, atendimentos multiprofissionais, dashboards e exportacao de dados durante acoes presenciais da Medicos do Mundo.

## Locais de aplicacao

- Santos-SP: regiao do Centro POP, bairro Paqueta.
- Itanhaem-SP: regiao de Belas Artes.

O sistema foi modelado para separar indicadores e prontuarios por **local da acao**, mantendo a possibilidade de expansao para outras cidades.

## Principais funcionalidades

- Cadastro de assistidos.
- Triagem com sinais vitais, prioridade, atencao especial e encaminhamentos.
- Censo social e historico clinico-social.
- Atendimentos por especialidade.
- Fila de espera e atendimento extra.
- Dashboards gerais e por area.
- Exportacao em Excel por data ou geral.
- Login por perfil operacional.
- Controle de permissoes para voluntarios, academicos, profissionais, coordenacao e administracao.
- Regras de seguranca e cuidados de LGPD.

## Tecnologias utilizadas

| Camada | Tecnologias |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Icones | Lucide React |
| Backend | Firebase Authentication, Cloud Firestore, Cloud Functions |
| Seguranca | Firestore Security Rules, validacao de e-mail, RBAC |
| Exportacao | write-excel-file |
| Publicacao e metricas | Vercel, Vercel Analytics, Vercel Speed Insights |
| Qualidade | ESLint, build Vite |

## Evidencias visuais

As imagens abaixo foram anonimizadas para evitar exposicao de dados pessoais, em conformidade com a LGPD.

### Dashboard operacional

![Dashboard operacional](docs/evidencias/dashboard-operacional-sanitizado.png)

### Indicadores operacionais

![Indicadores operacionais](docs/evidencias/indicadores-operacionais-sanitizado.png)

### Fluxo de assistidos

![Fluxo de assistidos](docs/evidencias/fluxo-assistidos-sanitizado.png)

### Ficha do assistido

![Ficha do assistido](docs/evidencias/ficha-assistido-sanitizado.png)

### Triagem

![Triagem sanitizada](docs/evidencias/triagem-sanitizada.png)

### Priorizacao e atencao inclusiva

![Priorizacao e atencao inclusiva](docs/evidencias/triagem-prioridade-sanitizada.png)

### Censo social

![Censo social sanitizado](docs/evidencias/censo-social-sanitizado.png)

### Uso de substancias no censo

![Uso de substancias](docs/evidencias/censo-substancias-sanitizado.png)

## Documentacao academica

- [Relatorio da Atividade Extensionista](docs/RELATORIO_ATIVIDADE_EXTENSIONISTA.md)
- [Diagramas do Projeto](docs/DIAGRAMAS.md)
- [Evidencias de Desenvolvimento e Aplicacao](docs/EVIDENCIAS.md)
- [Orientacao para Publicacao no GitHub](docs/PUBLICACAO_GITHUB.md)

## Como executar localmente

```bash
npm install
npm run dev
```

Para validar antes de publicar:

```bash
npm run lint
npm run build
```

## Vercel Speed Insights

O projeto ja possui os pacotes `@vercel/analytics` e `@vercel/speed-insights` instalados e os componentes globais configurados em `src/main.jsx`.

Para concluir a coleta de metricas, habilite o recurso no painel da Vercel do projeto `app-medicos`. Depois do proximo deploy, a Vercel passara a inserir as rotas de medicao e o script de performance da aplicacao.

## Configuracao Firebase

Crie um arquivo `.env` a partir de `.env.example` e preencha as variaveis do projeto Firebase.

```bash
cp .env.example .env
```

As regras do Firestore e Storage estao nos arquivos:

- `firestore.rules`
- `storage.rules`

As Cloud Functions estao em:

- `functions/index.js`

## Seguranca e LGPD

O repositorio nao deve conter:

- credenciais Firebase Admin SDK;
- backups com dados reais;
- prints com nomes, CPF, RG ou informacoes clinicas identificaveis;
- arquivos `.env`.

Esses itens estao protegidos no `.gitignore`.

## Status

Projeto funcional, documentado e preparado para publicacao no GitHub com evidencias anonimizadas.
