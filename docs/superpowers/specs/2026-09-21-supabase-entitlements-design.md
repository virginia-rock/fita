# Entitlements Pro persistidos no Supabase

## Objetivo

Persistir o plano e o status de acesso de cada usuário no Supabase, para que uma conta Pro continue sendo reconhecida após novo login, troca de navegador ou limpeza do `localStorage`. A solução deve manter o checkout atualmente simulado isolado, permitindo substituí-lo futuramente por Stripe/webhooks sem alterar o fluxo de dados das medições.

## Causa atual

O checkout grava `plan`, `status` e `expiresAt` somente em `fita.demo-account` no `localStorage`. Ao entrar em outro contexto, `conta.tsx` não encontra esse objeto e cria um perfil local gratuito. A tabela `fita_data` armazena apenas as medições e não deve ser usada como fonte de autorização.

## Modelo de dados

Criar `public.fita_entitlements` com uma linha por usuário:

- `user_id uuid primary key references auth.users(id) on delete cascade`;
- `plan text not null` com `local`, `cloud_month` ou `subscription`;
- `status text not null` com `active`, `expired`, `canceled` ou `pending`;
- `expires_at timestamptz null`;
- `source text not null default 'demo'`, preparado para `stripe` no futuro;
- `updated_at timestamptz not null` atualizado por trigger.

A migração deve criar índices/constraints, habilitar RLS e permitir ao usuário autenticado apenas consultar sua própria linha. Escrita de entitlements deve ficar atrás de uma operação de servidor/RPC controlada, para que uma futura integração de pagamento não confie em valores enviados pelo navegador.

## Fluxo da aplicação

1. Após autenticação, carregar o entitlement pelo `auth.uid()`.
2. Considerar sincronização Pro somente quando o entitlement estiver `active` e o plano for `cloud_month` dentro do prazo ou `subscription` sem expiração.
3. Usar o entitlement remoto como fonte principal; o `localStorage` fica apenas como cache de sessão e fallback visual temporário.
4. No checkout simulado, chamar uma operação explicitamente marcada como `demo` para ativar/atualizar o entitlement do usuário e depois redirecionar para `/conta`.
5. No futuro, o webhook do provedor de pagamento escreverá na mesma tabela com `source = 'stripe'`; o frontend não precisará mudar.
6. Se a consulta falhar, mostrar um estado de erro de sincronização em vez de rebaixar silenciosamente o usuário para gratuito.

## Compatibilidade e migração

Usuários que ainda tenham um plano Pro válido no `localStorage` poderão fazer uma migração única para a tabela após autenticação, somente quando o identificador local corresponder ao usuário autenticado. O processo deve ser idempotente e não sobrescrever um entitlement remoto mais recente.

## Verificação

- usuário Pro permanece Pro após logout/login;
- usuário Pro permanece Pro em outro navegador depois da ativação;
- usuário gratuito continua somente no `localStorage`;
- expiração/cancelamento desativa sincronização sem apagar medições;
- RLS impede leitura de entitlement de outro usuário;
- `fita_data` continua contendo exclusivamente medições/recorrência;
- build e testes existentes passam.
