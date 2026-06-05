# Como executar localmente

## Pre-requisitos

- Node.js compativel com o projeto.
- npm.
- Projeto Firebase configurado.
- Arquivo `.env` criado a partir de `.env.example`.

## Instalacao

```bash
npm install
```

## Variaveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Preencha as variaveis com os dados publicos do Firebase Web App.

## Executar em desenvolvimento

```bash
npm run dev
```

Acesse:

```text
http://127.0.0.1:5173/
```

## Validar antes de publicar

```bash
npm run lint
npm run build
```

## Publicacao

O projeto esta preparado para deploy na Vercel. Quando o repositorio GitHub estiver conectado ao projeto na Vercel, cada push na branch principal pode gerar uma nova versao publicada.

URL de producao:

```text
https://app-medicos.vercel.app/
```

## Observacoes de seguranca

Nao execute o app com credenciais administrativas dentro do frontend. Credenciais de Admin SDK devem permanecer fora do repositorio e ser usadas apenas em ambiente seguro, scripts locais controlados ou Cloud Functions.
