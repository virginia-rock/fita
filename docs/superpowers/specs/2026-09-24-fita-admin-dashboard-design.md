# Fita — painel Admin e métricas de assinaturas

## Objetivo

Dar ao usuário `carlospessin@gmail.com` um painel administrativo persistente
para acompanhar a base de usuários e a distribuição de planos. O administrador
continua escolhendo e pagando planos pelo Checkout Stripe normal, usando um
cupom vitalício configurado no Stripe. Não haverá simulação, bypass de Stripe
ou entitlement administrativo especial.

## Princípios

- Stripe e o webhook continuam sendo a única fonte de verdade para acesso,
  plano, limites e cancelamento.
- O cupom não é armazenado nem validado pelo Fita; ele é inserido no Checkout
  Stripe, que já aceita códigos promocionais.
- O papel Admin é persistido no banco e não é decidido apenas pelo navegador.
- E-mails e métricas globais só podem ser retornados por funções server-side
  após validação do papel Admin.
- O painel usa o `AppShell` existente para preservar topo e menus do produto.

## Papel administrativo

Criar `public.fita_admin_access` com `user_id uuid primary key`, `role text`
com valor inicial `admin`, timestamps e RLS de leitura apenas do próprio
usuário. A migration inicial insere o usuário de `auth.users` cujo e-mail,
normalizado em minúsculas, é `carlospessin@gmail.com`.

Caso a conta ainda não exista no momento da migration, a documentação deve
incluir o SQL idempotente para conceder o papel depois do cadastro. Nenhum
outro usuário terá UI, RPC ou dados administrativos sem um registro nessa
tabela.

## Dados de assinatura

Adicionar `subscribed_at timestamptz` nullable a `fita_entitlements`. O RPC
de webhook deve preenchê-lo na primeira ativação Stripe e preservá-lo em
renovações, falhas e cancelamentos.

Para registros Stripe existentes sem histórico de ativação, `subscribed_at`
permanecerá nulo: o painel exibirá “Não registrado” em vez de inventar uma
data. Para contas Free, a data exibida será `auth.users.created_at`; a coluna
de expiração será “—”.

## API administrativa

Criar duas Edge Functions autenticadas:

- `get-admin-dashboard`: valida o papel em `fita_admin_access`, pagina os
  usuários de `auth.users` pelo Admin API, combina com `fita_entitlements` e
  retorna totais por plano, incluindo `free` para usuários sem entitlement
  ativo/pago.
- `get-admin-users`: valida o papel, aceita somente um filtro de plano
  permitido e cursor/página limitada, e retorna e-mail, plano exibido,
  status, `subscribed_at`, `current_period_end`/`expires_at` e criação da
  conta. Não aceita campos, filtros arbitrários ou IDs de usuários do cliente.

O total e a lista devem classificar como Free tanto usuários sem linha de
entitlement quanto entitlements `local`, expirados ou cancelados. Planos pagos
ativos e pendentes preservam seus identificadores existentes.

## Interface

Na página `/conta`, usuários com papel Admin recebem a aba/link “Admin”.
Ela abre `/admin`.

A rota `/admin` usa `AppShell` e possui um painel interno com menu lateral
esquerdo. Nesta etapa o menu contém somente “Dashboard”, mas sua estrutura
aceita futuras seções sem alterar o shell.

O conteúdo principal mostra cards clicáveis para:

- todos os usuários;
- Free;
- acesso mensal legado, assinatura legada, Pro mensal e Pro anual;
- Personal, Personal Pro e Studio.

Ao clicar em um card, o dashboard mostra uma tabela paginada no painel
principal com e-mail, plano, status, assinou em e expira/renova em. O card
selecionado é claramente indicado, e o estado de carregamento, vazio, erro e
foco por teclado são tratados. Não haverá planos Insider como categoria de
acesso: eles aparecem sob seu plano base; a informação Insider pode ser uma
badge futura, fora deste escopo.

## Segurança e falhas

- As Edge Functions exigem token Supabase e consultam `fita_admin_access` com
  service role antes de ler `auth.users`.
- Usuários não-admin recebem 403 e nenhuma métrica/lista parcial.
- Filtros de plano são validados em allowlist no servidor e a paginação tem
  limite máximo.
- O cliente não calcula totais a partir de dados próprios e não recebe dados
  globais antes da autorização.
- Se a busca falhar, o painel mostra mensagem segura e mantém a última lista
  válida em vez de exibir dados incorretos.

## Testes e verificação

- migration cria papel Admin, RLS e `subscribed_at`;
- classificação cobre usuário sem entitlement, local, ativo, pendente,
  cancelado e expirado;
- funções negam usuário não-admin e filtros inválidos;
- paginação não ultrapassa o limite e não retorna campos além do contrato;
- card e tabela respeitam carregamento, vazio, erro e seleção;
- aba Admin não aparece para usuário comum;
- webhook preserva `subscribed_at` após a primeira ativação;
- suíte existente, lint direcionado e build passam.
