# Diagramas do Projeto

Este documento apresenta os principais diagramas do sistema desenvolvido para a Medicos do Mundo em Santos-SP e Itanhaem-SP.

## Versoes em imagem

As imagens abaixo foram geradas para uso direto no documento final em Word/PDF.

![Diagrama de contexto](diagramas/diagrama-contexto.png)

![Fluxo operacional](diagramas/fluxo-operacional.png)

![Arquitetura e seguranca](diagramas/arquitetura-seguranca.png)

## 1. Diagrama de Contexto

```mermaid
flowchart LR
    Assistido["Assistido / Paciente"] --> Equipe["Equipe da acao"]
    Equipe --> App["Sistema web responsivo MDM"]
    Voluntario["Voluntario / Colaborador"] --> App
    Academico["Academico / Estudante"] --> App
    Profissional["Profissional formado"] --> App
    Coordenacao["Coordenacao"] --> App
    Administracao["Administracao"] --> App
    App --> Firebase["Firebase Auth + Firestore + Functions"]
    App --> Excel["Exportacao Excel"]
    Coordenacao --> Excel
    Administracao --> Excel
    Firebase --> Indicadores["Dashboards por local da acao"]
```

## 2. Fluxo Operacional da Acao

```mermaid
flowchart TD
    A["Abrir o app"] --> B["Login e confirmacao de e-mail"]
    B --> C["Selecionar local da acao: Santos, Itanhaem ou outra praca"]
    C --> D["Cadastrar ou localizar assistido"]
    D --> E["Registrar chegada/fila"]
    E --> F["Triagem e sinais vitais"]
    F --> G["Censo social e historico"]
    G --> H["Encaminhamento para areas"]
    H --> I["Atendimento por especialidade"]
    I --> J{"Atendimento finalizado?"}
    J -->|Sim| K["Assinar e concluir"]
    J -->|Nao| L["Submeter para validacao / manter pendente"]
    K --> M["Atualizar dashboards e historico"]
    L --> M
    M --> N["Exportacao por data ou geral pela coordenacao/admin"]
```

## 3. Perfis e Permissoes

```mermaid
flowchart TB
    Admin["Administrador"] --> U["Gerenciar usuarios"]
    Admin --> E["Exportar dashboards"]
    Admin --> A["Acessar todos os registros"]
    Coord["Coordenacao"] --> E
    Coord --> A
    Coord --> R["Revogar usuarios abaixo da coordenacao"]
    Prof["Profissional formado"] --> L["Ler historico"]
    Prof --> P["Prescrever / definir conduta"]
    Prof --> C["Assinar e concluir atendimento"]
    Acad["Academico"] --> L
    Acad --> S["Preencher evolucao da area"]
    Acad --> V["Submeter para validacao"]
    Vol["Voluntario / Colaborador"] --> L
    Vol --> O["Registrar comentarios e apoio operacional"]
    Vol --> N["Cadastrar assistido e direcionar fluxo quando permitido"]
```

## 4. Modelo Simplificado de Dados

```mermaid
erDiagram
    USERS ||--o{ ATENDIMENTOS : registra
    ASSISTIDOS ||--o{ TRIAGENS : possui
    ASSISTIDOS ||--o{ ANAMNESES : possui
    ASSISTIDOS ||--o{ ATENDIMENTOS : recebe
    ACTION_LOCATIONS ||--o{ ASSISTIDOS : localAcao
    ACTION_LOCATIONS ||--o{ TRIAGENS : localAcao
    ACTION_LOCATIONS ||--o{ ATENDIMENTOS : localAcao

    USERS {
      string uid
      string nome
      string role
      string profissao
      string filial
      string email
    }

    ASSISTIDOS {
      string id
      string nome
      string cpf
      string localAcao
      string status
      number chegadaAcaoEm
    }

    TRIAGENS {
      string id
      string assistidoId
      string localAcao
      string queixaPrincipal
      string prioridadeCuidado
      string encaminhamento
    }

    ANAMNESES {
      string id
      string assistidoId
      string localAcao
      string moradia
      string comorbidades
      string semComer
    }

    ATENDIMENTOS {
      string id
      string assistidoId
      string localAcao
      string area
      string status
      string plano
    }
```

## 5. Arquitetura Tecnica

```mermaid
flowchart LR
    Browser["Celular / Notebook"] --> React["React + Vite"]
    React --> UI["Componentes: Dashboard, Header, Foto, Formularios"]
    React --> Auth["Firebase Authentication"]
    React --> DB["Cloud Firestore"]
    React --> XLSX["write-excel-file"]
    DB --> Rules["Firestore Security Rules"]
    Functions["Cloud Functions"] --> DB
    AdminSDK["Firebase Admin SDK nas Functions"] --> Auth
    Auth --> Claims["Perfis e permissoes"]
    Rules --> Claims
```
