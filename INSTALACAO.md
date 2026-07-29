# Xerox Service Hub

## Instalação

1. Instale o Node.js 22 ou superior.
2. Execute `npm install`.
3. Copie `.env.example` para `.env.local`.
4. Preencha a URL e a chave pública `anon` do Supabase.
5. Execute `npm run dev`.

## Banco de dados

Abra o SQL Editor do Supabase e execute o arquivo:

`supabase/schema.sql`

O script cria as tabelas de usuários, produtos e movimentações, além das
políticas RLS e da função segura que registra entradas e retiradas sem permitir
estoque negativo.

## Produção

Execute `npm run build` para validar a aplicação antes da publicação.
