# Fita — landing page, planos e fluxos simulados

## Objetivo

Transformar a entrada atual do Fita em uma landing page simples e criar uma
experiência demonstrável de teste local, planos de apoio, login e conta. Esta
etapa não terá pagamentos reais, autenticação real ou armazenamento em nuvem.
O código deve deixar limites claros para uma futura integração com Stripe e
Supabase.

## Escopo desta etapa

Incluído:

- Landing page na rota `/`.
- Painel atual preservado na rota `/app`.
- Teste sem cadastro usando o armazenamento local já existente.
- Aviso persistente sobre a natureza local dos dados e o risco de limpar os
  dados do navegador.
- Exportação e importação disponíveis no fluxo local e nos fluxos simulados.
- Páginas visuais de criação de conta, login e conta do usuário.
- Simulação de checkout para os planos:
  - pagamento único de R$ 29,90, com um mês de armazenamento em nuvem;
  - assinatura de R$ 19,90/mês, válida enquanto estiver ativa.
- Área de conta com status simulado de pagamento/assinatura.

Fora do escopo:

- Integração com Stripe, Supabase ou qualquer provedor de pagamento.
- Envio de e-mail ou confirmação real de e-mail.
- Senhas reais, sessão segura, recuperação de senha ou autorização de API.
- Sincronização real dos dados do navegador com a nuvem.
- Cobrança, renovação, cancelamento ou expiração real.

## Rotas e fluxo

### `/`

Landing page com a proposta do Fita, explicação do teste local, aviso de
privacidade/armazenamento e dois caminhos principais:

- **Testar sem cadastro** → `/app`.
- **Apoiar o projeto** → seleção de plano e checkout simulado.

O link para o GitHub permanece disponível na landing e no shell do produto.

### `/app`

Painel existente, com a navegação e os recursos atuais. O usuário pode usar o
produto sem conta. O shell deve exibir o aviso de dados locais e manter os
controles de importar/exportar.

### `/entrar`

Formulário visual com e-mail e senha, além de um estado de demonstração para
login bem-sucedido ou inválido. Não deve sugerir que uma autenticação real foi
executada.

### `/criar-conta`

Formulário visual com e-mail, senha e repetição de senha. Após o envio, exibir
um estado de “confirmação enviada” simulado e uma ação para continuar para o
checkout ou voltar ao login.

### `/conta`

Área visual do usuário com:

- e-mail do perfil demo;
- plano atual;
- status do pagamento ou assinatura;
- data de expiração simulada para o pagamento único;
- ação de cancelar a assinatura simulada;
- acesso a importar/exportar.

Usuários não autenticados veem uma orientação para entrar ou criar conta.

## Planos e estado simulado

O domínio deve separar o plano da forma de cobrança:

```text
plan: local | cloud_month | subscription
status: anonymous | pending | active | expired | canceled
```

O pagamento único ativa `cloud_month` por 30 dias simulados. A assinatura
ativa `subscription` sem data de fim fixa, até ser cancelada na interface.

O estado demo pode ser salvo no `localStorage`, mas deve ser tratado como
estado de apresentação, nunca como autorização ou prova de pagamento. O
futuro adaptador de backend deverá substituir esse armazenamento por dados
confirmados pelo servidor.

## Componentes e limites técnicos

- Criar uma landing específica, sem misturar sua lógica com o painel.
- Extrair ou adaptar o shell atual para ser reutilizado por `/app` e `/conta`.
- Criar componentes compartilhados para cartão de plano, estado de acesso,
  aviso de armazenamento local e formulário de autenticação.
- Manter a geração do QR Pix atual apenas onde ela continuar fazendo sentido;
  o novo checkout simulado não deve insinuar que um pagamento foi confirmado.
- Usar componentes semânticos e acessíveis: links para navegação, botões para
  ações, labels associados aos campos, foco visível e estados de erro claros.
- Manter o layout responsivo, especialmente os cards de plano e os controles
  do cabeçalho em telas estreitas.

## Critérios de aceitação

- Abrir `/` mostra a landing page e não o painel diretamente.
- “Testar sem cadastro” abre o painel em `/app`.
- O usuário vê claramente que os dados locais podem ser perdidos ao limpar o
  navegador e encontra importar/exportar.
- Os dois planos exibem preços e benefícios corretos.
- O fluxo simulado de conta exige os campos definidos, mostra estados de
  confirmação e disponibiliza `/conta`.
- O pagamento simulado não afirma ter processado dinheiro real.
- A conta exibe corretamente os estados de pagamento único e assinatura.
- Rotas antigas do painel continuam funcionando com o novo prefixo `/app`.
- Build e verificação TypeScript passam.

## Decisões para a integração futura

- Stripe será responsável por Checkout, assinaturas, webhooks e estado de
  cobrança; o navegador nunca será a fonte de verdade do pagamento.
- Supabase será responsável por usuários, perfis, entitlement e dados em nuvem.
- O acesso à nuvem deverá ser autorizado pelo servidor com base em entitlement
  confirmado, não por uma flag enviada pelo cliente.
- A migração deverá preservar o modo local e exportação/importação mesmo para
  usuários sem plano pago.
