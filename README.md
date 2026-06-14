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

- [Diagramas do Projeto](docs/DIAGRAMAS.md)
- [Evidencias de Desenvolvimento e Aplicacao](docs/EVIDENCIAS.md)

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

## Vercel Analytics e Speed Insights

O projeto ja possui os pacotes `@vercel/analytics` e `@vercel/speed-insights` instalados e os componentes globais configurados em `src/main.jsx`.

Como esta aplicacao usa React com Vite, as importacoes corretas sao:

- `@vercel/analytics/react` para Web Analytics;
- `@vercel/speed-insights/react` para Speed Insights.

No painel atual da Vercel, a tela de Analytics pode aparecer como **Get Started**. Isso significa que a Vercel ainda nao detectou um deploy contendo o pacote e o componente.

Fluxo correto:

1. Mantenha o framework selecionado como React/Vite ou use as instrucoes de React, nao as de Next.js.
2. Publique estes commits no GitHub.
3. Aguarde o redeploy da Vercel ou acione um novo deploy pelo painel.
4. Acesse `https://app-medicos.vercel.app/` algumas vezes apos o deploy.
5. Volte em **Analytics** e **Speed Insights**. Os paineis passam a mostrar dados quando a Vercel detectar os scripts e houver visitas reais.

A Vercel podera expor rotas internas como `/_vercel/insights/*` e `/_vercel/speed-insights/*` depois do deploy.

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
