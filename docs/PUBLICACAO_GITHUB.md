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
git remote add origin https://github.com/SEU-USUARIO/app-medicos-mundo.git
git push -u origin feature/pep-architecture-v2
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

Apos publicar, envie o link do repositorio e destaque estes arquivos:

- `README.md`
- `docs/RELATORIO_ATIVIDADE_EXTENSIONISTA.md`
- `docs/DIAGRAMAS.md`
- `docs/EVIDENCIAS.md`
