# Prontuario Unificado MDM

Aplicacao React/Vite para cadastro de assistidos, triagem, censo social e atendimentos das areas da acao Medicos do Mundo.

## Desenvolvimento

```sh
npm install
npm run dev
```

Antes de publicar uma alteracao:

```sh
npm run lint
npm run build
npm audit
```

## Firestore

Os dados do prontuario exigem autenticacao. O arquivo `firestore.rules` bloqueia cadastro publico de administradores, impede alteracao de perfil pelo proprio usuario e limita leitura/escrita das colecoes clinicas a usuarios autenticados.

Publique as regras no projeto Firebase antes de usar a aplicacao em producao:

```sh
firebase deploy --only firestore:rules
```

Administradores devem ser promovidos fora do cadastro publico, por um administrador existente ou pelo console/processo controlado do Firebase.
