# Orientacao para publicacao no GitHub

Este documento orienta a publicacao segura do projeto no GitHub.

## Repositorio

Repositorio principal:

```text
git@github.com:Andalaftjr/app-medicos-mundo.git
```

URL publica esperada:

```text
https://github.com/Andalaftjr/app-medicos-mundo
```

## Arquivos que podem ser publicados

- Codigo-fonte em `src/`.
- Configuracoes publicas do Vite, Tailwind e Firebase.
- Regras de Firestore e Storage.
- Cloud Functions sem credenciais embutidas.
- README.
- Documentacao em `docs/`.
- Evidencias sanitizadas em `docs/evidencias/`.
- Documento final em Word e PDF.

## Arquivos que nao devem ser publicados

- `.env.local`.
- Credenciais Firebase Admin SDK.
- Backups do Firestore com dados reais.
- Prints sem anonimizacao.
- Logs locais de desenvolvimento.
- Dados de assistidos, voluntarios ou documentos pessoais.

## Checklist antes do push

```bash
git status --short
npm run lint
npm run build
```

Conferir tambem:

- se nao ha arquivo `firebase-adminsdk` versionado;
- se nao ha `.env.local` versionado;
- se as imagens publicadas estao anonimizadas;
- se o README abre corretamente no GitHub;
- se os links para Word, PDF, evidencias e diagramas funcionam.

## Publicacao

```bash
git add README.md docs ATIVIDADE_EXTENSIONISTA_II_TRABALHO_FINAL_LEANDRO_ANDALAFT.docx ATIVIDADE_EXTENSIONISTA_II_TRABALHO_FINAL_LEANDRO_ANDALAFT.pdf
git commit -m "docs: organize academic deliverables"
git push origin main
```

## Vercel

O projeto publicado na Vercel esta em:

```text
https://app-medicos.vercel.app/
```

Apos o push para a branch principal, a Vercel deve realizar novo deploy automaticamente se o repositorio estiver conectado ao projeto.
