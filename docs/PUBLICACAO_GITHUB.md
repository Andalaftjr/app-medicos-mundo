# Publicacao no GitHub

Este repositorio foi preparado para publicacao com documentacao academica, diagramas e evidencias sanitizadas.

## Itens que NAO devem ser publicados

Os seguintes itens foram adicionados ao `.gitignore` por conterem dados sensiveis ou locais:

- `*firebase-adminsdk*.json`
- `.env`
- `.env.*`
- `backups/`
- `qa-artifacts/`
- `.firebase/`
- `node_modules/`
- `dist/`

## Publicacao rapida pela interface do GitHub

1. Acesse [https://github.com/new](https://github.com/new).
2. Crie um repositorio chamado `app-medicos-mundo`.
3. Escolha publico se os professores forem acessar por link sem login.
4. Nao marque para criar README, `.gitignore` ou licenca, pois o projeto ja possui esses arquivos.
5. Copie a URL do repositorio.
6. No terminal, dentro da pasta do projeto, execute:

```bash
git remote add origin git@github.com:Andalaftjr/app-medicos-mundo.git
git branch -M main
git push -u origin main
```

## Publicacao pelo GitHub Desktop

1. Abra o GitHub Desktop.
2. Escolha `File > Add local repository`.
3. Selecione a pasta `app-medicos`.
4. Clique em `Publish repository`.
5. Nome sugerido: `app-medicos-mundo`.
6. Desmarque arquivos sensiveis caso aparecam na lista.
7. Publique o repositorio.

## Link recomendado para enviar aos professores

Apos publicar, envie o link do repositorio, o link do sistema em producao e destaque estes arquivos:

- Repositorio: `https://github.com/Andalaftjr/app-medicos-mundo`
- Sistema publicado: `https://app-medicos.vercel.app/`

- `README.md`
- `docs/RELATORIO_ATIVIDADE_EXTENSIONISTA.md`
- `docs/DIAGRAMAS.md`
- `docs/EVIDENCIAS.md`

## Vercel Speed Insights

O codigo do projeto ja inclui:

- dependencia `@vercel/speed-insights`;
- componente `<SpeedInsights />` no arquivo `src/main.jsx`;
- dependencia `@vercel/analytics`;
- componente `<Analytics />` no arquivo `src/main.jsx`.

Como o projeto usa React/Vite, a importacao correta e `@vercel/speed-insights/react`, nao `@vercel/speed-insights/next`.

No painel da Vercel, abra o projeto `app-medicos`, acesse **Speed Insights** no menu lateral e clique em **Enable**. Apos o proximo deploy, a Vercel passara a expor as rotas internas de medicao e os dados aparecerao no dashboard depois que houver visitas reais ao site.
