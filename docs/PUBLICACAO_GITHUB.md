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

## Liberar push por chave SSH do repositorio

Se o terminal retornar `Permission denied (publickey)`, use a tela do proprio repositorio que aparece em `https://github.com/Andalaftjr/app-medicos-mundo/settings`.

No menu lateral do repositorio:

1. Acesse **Deploy keys**.
2. Clique em **Add deploy key**.
3. Em **Title**, use `Leandro - Projeto Medicos do Mundo`.
4. Em **Key**, cole a chave publica gerada localmente.
5. Marque **Allow write access**.
6. Clique em **Add key**.
7. Execute novamente `git push -u origin main`.

Chave publica gerada para este projeto:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEgmFUt5fFcn7s2GgqW49YmpBFzwq5UnsTotG+aOsRT2 andalaftjr@app-medicos-mundo
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

## Vercel Web Analytics e Speed Insights

O codigo do projeto ja inclui:

- dependencia `@vercel/analytics`;
- componente `<Analytics />` no arquivo `src/main.jsx`.
- dependencia `@vercel/speed-insights`;
- componente `<SpeedInsights />` no arquivo `src/main.jsx`;

Como o projeto usa React/Vite, as importacoes corretas sao:

- `@vercel/analytics/react` para Web Analytics;
- `@vercel/speed-insights/react` para Speed Insights.

Nao use os exemplos de Next.js com `/next` neste projeto.

No painel atual da Vercel, a tela de Analytics pode aparecer como **Get Started**, com as etapas de instalar pacote, adicionar componente e fazer deploy. Neste projeto, as duas primeiras etapas ja estao concluidas no codigo.

Fluxo correto:

1. Publique os commits no GitHub.
2. Aguarde o redeploy automatico da Vercel ou acione novo deploy pelo painel.
3. Acesse `https://app-medicos.vercel.app/` apos o deploy para gerar visitas.
4. Volte em **Analytics** e **Speed Insights**.

Apos o proximo deploy, a Vercel passara a expor rotas internas de medicao, como `/_vercel/insights/*` e `/_vercel/speed-insights/*`. Os dados aparecerao nos dashboards depois que houver visitas reais ao site.
