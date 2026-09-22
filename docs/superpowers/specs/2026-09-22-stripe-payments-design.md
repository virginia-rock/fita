# Integração Stripe para pagamentos do Fita.

## Objetivo

Substituir o checkout demonstrativo dos planos pagos por uma integração
preparada para Stripe, sem colocar chaves secretas ou valores de cobrança no
navegador. A solução deve suportar o pagamento único de R$ 29,90 (`cloud_month`)
e a assinatura recorrente de R$ 19,90/mês (`subscription`), mantendo o
Supabase como fonte de autorização do acesso Pro.

Esta etapa prepara o código, as migrations, as Edge Functions e as variáveis de
ambiente com placeholders. Nenhum pagamento real será ativado até que os
segredos, Price IDs e webhook sejam configurados no ambiente Stripe/Supabase.

## Decisões

- Usar Stripe Checkout hospedado, criado exclusivamente no servidor.
- Usar `mode=payment` para o preço único e `mode=subscription` para o preço
  recorrente.
- Usar BRL como moeda esperada pelos Prices cadastrados no Stripe, sem confiar
  em valores enviados pelo cliente.
- O cliente autenticado chama a Edge Function `create-checkout-session`; a
  função valida o JWT do Supabase, escolhe o Price ID pelo plano permitido e
  retorna apenas a URL da sessão.
- A Edge Function `stripe-webhook` valida a assinatura do Stripe e é a única
  responsável por conceder, renovar ou revogar entitlements.
- O redirect de sucesso é apenas informativo. O acesso não será liberado por
  query string, localStorage ou página de sucesso.
- Impostos, cupons, descontos e portal de cobrança ficam fora desta etapa e
  devem ser habilitados por uma decisão comercial/fiscal posterior.

## Fluxo de pagamento

1. O usuário autenticado seleciona um plano na landing page.
2. O frontend chama `create-checkout-session` com `plan` (`cloud_month` ou
   `subscription`) e o JWT atual.
3. A função valida o plano, associa `supabase_user_id` ao metadata da sessão e
   cria a Checkout Session com o Price ID correspondente.
4. O frontend redireciona o usuário para a URL hospedada pelo Stripe.
5. O Stripe envia `checkout.session.completed` ao webhook.
6. O webhook valida o evento, garante idempotência por `event.id` e atualiza
   `fita_entitlements` com `source = 'stripe'`.
7. Para pagamentos únicos, o entitlement fica `active` por 30 dias a partir
   da conclusão confirmada da sessão.
8. Para assinaturas, o entitlement permanece `active` enquanto a assinatura e
   as faturas estiverem válidas; o período atual é salvo para exibição e
   auditoria.

## Eventos Stripe

O webhook deve tratar, no mínimo:

- `checkout.session.completed`: ativa o plano inicial após a sessão concluída;
- `checkout.session.async_payment_succeeded`: ativa o pagamento único quando o
  método de pagamento for assíncrono;
- `checkout.session.async_payment_failed`: não concede acesso;
- `customer.subscription.updated`: sincroniza status e fim do período;
- `customer.subscription.deleted`: marca a assinatura como `canceled`;
- `invoice.paid`: renova o período e mantém a assinatura ativa;
- `invoice.payment_failed`: marca o acesso como `pending` ou `canceled`, de
  acordo com o estado confirmado da assinatura.

O webhook não deve confiar em dados de preço enviados pelo navegador. Ele deve
comparar `price.id` com os Price IDs configurados no ambiente e rejeitar planos
desconhecidos.

## Modelo de dados

Adicionar uma migration que preserve a tabela existente e acrescente:

- `stripe_customer_id` nullable;
- `stripe_subscription_id` nullable;
- `stripe_checkout_session_id` nullable;
- `stripe_price_id` nullable;
- `current_period_end` nullable;
- `last_stripe_event_id` nullable.

Criar também `public.fita_stripe_events` com `event_id` como chave primária,
tipo do evento e timestamp de processamento. O insert do evento deve ser
atômico; se o mesmo ID chegar novamente, o webhook responde com sucesso sem
reaplicar a mutação.

A escrita continua protegida: usuários autenticados mantêm apenas leitura do
próprio entitlement; as Edge Functions usam a credencial administrativa apenas
no ambiente servidor para sincronizar os dados derivados do Stripe.

## Variáveis de ambiente

### Frontend

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Nenhuma chave Stripe será prefixada com `VITE_`.

### Supabase Edge Functions

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_CLOUD_MONTH`
- `STRIPE_PRICE_SUBSCRIPTION`
- `PUBLIC_APP_URL`

Os valores serão documentados em `.env.example` apenas como placeholders. Os
segredos reais serão configurados com `supabase secrets set` ou pelo ambiente
de deploy, nunca versionados.

## Segurança e falhas

- O JWT do usuário é validado antes de criar uma sessão.
- O plano permitido é uma enumeração fechada; não aceitar Price ID do cliente.
- A assinatura `Stripe-Signature` é obrigatória no webhook.
- Eventos são idempotentes por `event.id`.
- A ausência, expiração ou falha de webhook não deve liberar acesso.
- Falha ao consultar o entitlement deve continuar aparecendo como erro de
  sincronização, não como plano gratuito.
- O redirect de cancelamento retorna ao checkout sem alterar o entitlement.
- Erros de Stripe não devem expor chaves, payloads completos ou dados internos
  ao usuário.

## Frontend e compatibilidade

Atualizar o checkout para mostrar estado de redirecionamento, erro recuperável
e retorno do Stripe. Remover a mensagem de “pagamento simulado” apenas quando a
integração estiver configurada; com placeholders ausentes, exibir uma mensagem
clara de configuração pendente em vez de tentar cobrar.

O modelo atual de `Entitlement` continua sendo usado pelo app. A diferença é
que o preenchimento passa a vir do webhook com `source = 'stripe'`, sem alterar
o fluxo de sincronização de medições.

## Verificação

- testes de validação de plano e seleção segura do Price ID;
- testes de idempotência do webhook;
- testes de mapeamento de eventos Stripe para `active`, `pending`, `expired` e
  `canceled`;
- testes de migration, RLS e constraints;
- teste de build e lint;
- teste local das Edge Functions com Stripe CLI usando chaves de teste;
- fluxo manual em modo test: criar sessão, concluir pagamento único, iniciar
  assinatura, simular renovação/falha/cancelamento e confirmar a linha em
  `fita_entitlements`.

## Fontes

- [Stripe Checkout Sessions](https://docs.stripe.com/api/checkout/sessions)
- [Stripe — Payments for existing customers](https://docs.stripe.com/payments/existing-customers?platform=web&ui=stripe-hosted)
- [Stripe Events API](https://docs.stripe.com/api/events)
