# E-mails de Autenticação - Médicos do Mundo Santos

O aplicativo já define o idioma das mensagens do Firebase como `pt-BR` e impede
acesso aos dados clínicos enquanto o e-mail não estiver confirmado.

O remetente, o assunto, o corpo do e-mail e o domínio do link são configurados
no Console do Firebase, em `Authentication > Templates`. O código frontend não
deve conter credenciais ou realizar envio institucional diretamente.

## Verificação de e-mail

**Assunto**

```text
[Médicos do Mundo Santos] Confirme seu e-mail de acesso
```

**Corpo sugerido**

```text
Olá,

Seu cadastro no Portal Voluntário Médicos do Mundo - Santos/Paquetá foi iniciado.

Para proteger as informações dos assistidos, confirme seu e-mail antes de
acessar o sistema:

<MANTER AQUI O LINK DE CONFIRMAÇÃO DO TEMPLATE FIREBASE>

Se você não realizou este cadastro, ignore esta mensagem.

Equipe Médicos do Mundo - Santos
```

## Recuperação de senha

**Assunto**

```text
[Médicos do Mundo Santos] Redefinição de senha do Portal Voluntário
```

**Corpo sugerido**

```text
Olá,

Recebemos uma solicitação para redefinir a senha do Portal Voluntário
Médicos do Mundo - Santos/Paquetá.

Crie uma nova senha segura pelo link:

<MANTER AQUI O LINK DE REDEFINIÇÃO DO TEMPLATE FIREBASE>

Se você não solicitou a alteração, ignore este e-mail e comunique a coordenação.

Equipe Médicos do Mundo - Santos
```

## Configuração recomendada

1. Ajustar os dois templates acima no Console e manter o placeholder de link
   que o Firebase apresenta no editor.
2. Configurar o nome da aplicação/marca como `Médicos do Mundo Santos`.
3. Antes da operação pública, configurar domínio institucional para o campo
   remetente e para os links de ação, validando os registros DNS solicitados.
4. Testar cadastro, verificação e recuperação com uma conta de homologação
   antes da ação de campo.
