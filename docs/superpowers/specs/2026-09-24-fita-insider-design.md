# Fita — programa Insider e checkout autenticado

## Objetivo

Permitir que administradores selecionem usuários já cadastrados para participar
do programa Insider. O usuário selecionado vê no painel da conta uma oferta
privada para o plano Pro mensal ou Personal, conclui um Checkout Stripe criado
pelo servidor, recebe 90 dias de teste e permanece com o preço Insider (30% de
desconto) enquanto a assinatura estiver ativa. Os planos Insider não aparecem
na landing page pública.

Ao cancelar a assinatura, o benefício Insider é encerrado e a conta volta a
ser apresentada como plano gratuito, sem sincronização em nuvem.

## Decisões

- O navegador não navega diretamente para um Payment Link público. Ele chama
  uma Edge Function autenticada, que cria uma Checkout Session para o usuário
  atual.
- Os dois preços recorrentes são configurados pelos secrets
  `FITA_PRO_MONTHLY_INSIDER` e `FITA_PERSONAL_INSIDER`. Seus valores são os
  Price IDs reais dos preços criados no Stripe.
- Os valores Insider devem ser preços recorrentes já configurados com 30% de
  desconto em relação ao preço público. O desconto é vitalício enquanto a
  assinatura permanecer ativa; não será aplicado como cupom temporário.
- O trial de 90 dias será aplicado pelo servidor na Checkout Session com
  `trial_period_days: 90`, garantindo o mesmo comportamento mesmo que o link
  original tenha outra configuração.
- O webhook é a fonte de verdade para ativação, renovação, falha de cobrança e
  cancelamento. O cliente nunca libera acesso apenas porque voltou do Stripe.
- A administração inicial será feita diretamente no banco por SQL; não será
  criada uma tela administrativa nesta etapa.

## Modelo de dados

Criar a tabela `public.fita_insider_access`:

- `user_id uuid primary key references auth.users(id) on delete cascade`;
- `offer text not null`, limitado a `pro_monthly` ou `personal`;
- `status text not null`, limitado a `eligible`, `active` ou `canceled`;
- `selected_at timestamptz not null default timezone('utc', now())`;
- `claimed_at timestamptz`;
- `trial_ends_at timestamptz`;
- `stripe_customer_id text`;
- `stripe_subscription_id text unique`;
- `created_at` e `updated_at` com defaults/triggers compatíveis com o projeto.

Adicionar em `public.fita_entitlements`:

- `insider_offer text` nullable, limitado a `pro_monthly` ou `personal`;
- `trial_ends_at timestamptz` nullable.

O registro de Insider controla elegibilidade e ciclo do benefício. O
entitlement continua controlando o acesso ao produto. O registro de preço
Stripe continua em `stripe_price_id`; nomes de secrets não são gravados no
banco.

RLS permitirá que usuários autenticados leiam apenas o próprio registro de
Insider. Escrita ficará restrita ao service role e às operações administrativas
diretas no banco.

Exemplos administrativos serão documentados:

```sql
insert into public.fita_insider_access (user_id, offer)
values ('UUID_DO_USUARIO', 'pro_monthly');

insert into public.fita_insider_access (user_id, offer)
values ('UUID_DO_USUARIO', 'personal');
```

## Checkout e webhook

Criar uma Edge Function `create-insider-checkout-session`:

1. exigir um Bearer token válido;
2. obter o usuário autenticado;
3. buscar a elegibilidade dele em `fita_insider_access` com service role;
4. rejeitar ausência de elegibilidade, status `canceled` ou oferta inválida;
5. resolver o secret conforme a oferta;
6. criar uma Checkout Session recorrente com `trial_period_days: 90`;
7. enviar metadados `supabase_user_id`, `plan` e `insider_offer` na sessão e na
   assinatura;
8. retornar somente a URL de Checkout do Stripe.

As ofertas serão mapeadas assim:

| Oferta | Plano base | Secret |
|---|---|---|
| `pro_monthly` | `subscription_monthly` | `FITA_PRO_MONTHLY_INSIDER` |
| `personal` | `professional_personal` | `FITA_PERSONAL_INSIDER` |

Estender o mapper compartilhado de Stripe para reconhecer os dois Price IDs e
retornar também `insider_offer`. Eventos de Checkout, assinatura e invoice
devem manter o vínculo pelo `supabase_user_id` e `insider_offer` nos metadados.
O RPC transacional que aplica eventos deve atualizar o entitlement e o
registro Insider na mesma transação:

- Checkout com `payment_status = paid` ou `no_payment_required`, ou assinatura
  em `trialing`/`active`: status Insider `active`, `claimed_at` e
  `trial_ends_at` preenchidos. O `trial_ends_at` deve vir do `trial_end` da
  assinatura enriquecida pelo webhook;
- invoice paga: manter Insider ativo;
- invoice falha: refletir o estado de cobrança existente;
- assinatura cancelada: status do entitlement `canceled`, status Insider
  `canceled` e encerramento do benefício.

## Conta e experiência do usuário

Carregar o registro Insider junto com o entitlement na área `/conta`.

Quando o usuário está elegível e ainda não iniciou o checkout, mostrar um card
privado com:

> Você foi selecionado para participar do Programa Insider.
>
> Seu período de teste começa após concluir a inscrição. Depois de 90 dias,
> você terá 30% de desconto vitalício na mensalidade. Ao cancelar, o benefício
> Insider será encerrado.

O CTA será “Participar do programa Insider” e chamará a Edge Function, sem
expor o Price ID ao navegador.

Quando ativo, o card de plano atual exibirá o plano base, a badge `INSIDER`,
“Teste até [data]” durante o trial e o preço/benefício recorrente depois dele.
Também exibirá “Cancelar assinatura”. O cancelamento usará um diálogo próprio
do app, chamará uma Edge Function autenticada que valida a posse da assinatura
e solicita o cancelamento ao Stripe. A confirmação final de estado continuará
dependendo do webhook.

Quando cancelado, o usuário verá o plano gratuito e uma mensagem explicando que
o benefício Insider foi encerrado. O CTA público de upgrade continuará levando
à seção de planos da home; a oferta Insider não reaparecerá automaticamente.

## Segurança e falhas

- Nunca aceitar `user_id`, `offer`, Price ID ou valor enviados pelo cliente
  como autoridade. A oferta deve vir da tabela do usuário autenticado.
- Nunca liberar acesso no retorno do Checkout sem confirmação do webhook.
- Rejeitar uma segunda inscrição se o registro estiver `active` ou `canceled`.
- Usar idempotência já existente para eventos Stripe.
- Se o webhook falhar, manter o acesso anterior e retornar erro 5xx para retry.
- O cancelamento deve exigir confirmação e validar que a assinatura pertence ao
  usuário autenticado.
- O banco não deve armazenar secrets; apenas Price IDs recebidos do Stripe e
  identificadores de assinatura/customer.

## Testes e verificação

- testar a seleção e leitura RLS de uma oferta Insider;
- testar o mapeamento de Price IDs Insider para planos base;
- testar que a Checkout Session usa trial de 90 dias e metadados corretos;
- testar que usuário não elegível não consegue criar sessão;
- testar ativação, renovação, falha e cancelamento via webhook;
- testar que o cancelamento encerra o benefício e retorna a conta ao Free;
- testar a renderização dos estados elegível, trial ativo, ativo, cancelado e
  sem oferta;
- rodar a suíte existente, lint direcionado e build.
