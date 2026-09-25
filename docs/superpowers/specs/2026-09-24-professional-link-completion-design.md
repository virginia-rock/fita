# Fita — conclusão do vínculo profissional e painel de acompanhamento

## Objetivo

Concluir a área profissional existente para que um personal com assinatura
ativa possa acompanhar alunas que possuem conta Fita, com autorização
explícita, sem transferir a propriedade dos dados. A aluna continua dona do
histórico e pode acompanhar tudo que o personal registra; enquanto o vínculo
está ativo, ela não cria entradas próprias. O desligamento devolve as
permissões normais sem apagar os dados dela.

## Escopo

Esta entrega endurece e completa os planos Personal, Personal Pro e Studio,
o convite de aluna, a autorização de dados, o painel profissional e o fluxo de
desvinculação. Não inclui agenda, treino, dieta, chat, pagamentos de alunos,
equipes, unidades, white-label ou aluno sem conta.

## Princípios

- Toda aluna possui uma conta Fita autenticada; não há perfil de aluno sem
  conta.
- Dados e arquivos pertencem à aluna. O personal recebe autorização limitada,
  nunca uma cópia deles.
- O backend é a fonte de verdade para autorização, capacidade e visibilidade.
- Um vínculo ativo concede à aluna visualização do acompanhamento profissional
  mesmo se o plano individual dela for Free.
- O encerramento do vínculo não altera a assinatura individual da aluna.

## Modelo de vínculo

Os convites são criados pelo personal para um e-mail. A aluna autenticada com
esse mesmo e-mail vê uma pendência no Painel geral e pode aceitar ou recusar.
Ao aceitar, ela decide se compartilha os registros anteriores ao vínculo.

`fita_professional_links` representa o relacionamento aceito e terá estados
`active`, `unlink_requested` e `ended`, além de:

- `share_prior_history boolean`;
- `unlink_requested_at timestamptz`;
- `unlink_due_at timestamptz`;
- `unlink_remove_professional_access boolean`;
- campos de encerramento, ator e motivo (`accepted` ou `timeout`).

As invitations suportam também o estado `declined`. Convites pendentes e
vínculos ativos contam para a capacidade do plano. O banco faz essa verificação
de modo transacional para impedir extrapolação por operações concorrentes.

## Dados e autorização

O histórico existente continua em nome da aluna. Avaliações criadas por um
personal recebem metadados de autoria e de vínculo: `professional_user_id`,
`link_id`, data e origem. Esse metadado permite ao servidor retornar:

- à aluna: todo o próprio histórico;
- ao personal: todo o histórico, se `share_prior_history` for verdadeiro;
- ao personal sem essa autorização: somente avaliações que ele criou naquele
  vínculo.

Para vínculos que já existiam antes desta migration, `share_prior_history`
será preenchido como verdadeiro, preservando o acesso atual.

Avaliações incluem data, peso, medidas corporais configuradas, composição
corporal, observações e autoria. Fotos pertencem a uma avaliação e ficam em
bucket privado. Só RPCs/Edge Functions autorizadas emitem URLs temporárias.

## Experiência da aluna

Enquanto o vínculo está ativo, o Painel geral continua com esse nome e mostra
o personal vinculado. A aluna acompanha suas avaliações, fotos, gráficos e
relatórios, mas não vê `Nova entrada` ou `Cronologia`; as rotas também negam
acesso diretamente.

Ela pode abrir `Solicitar desvinculação`. O modal explica o efeito, permite
cancelar ou enviar e oferece a opção de remover o acesso do personal às medidas
e avaliações quando o vínculo acabar. Ao enviar, a aluna vê confirmação, o
vínculo vira `unlink_requested` e a ação vira `Cancelar solicitação de
desvínculo`. Cancelar restaura o vínculo ativo.

O pedido não muda o acesso imediatamente. Ele se torna efetivo quando o
personal o aceita ou ao completar 72 horas. Se a opção de remoção foi marcada,
o personal deixa de receber medidas, avaliações e fotos; os dados continuam
intactos para a aluna. Em qualquer encerramento, ela volta às permissões do seu
plano individual, incluindo as abas e criação de registros do Free quando não
possuir Pro.

## Experiência do personal

O painel profissional deixa de usar um plano demonstrativo fixo e deriva
capacidades do entitlement Stripe real. A carteira oferece busca, paginação,
filtros por atividade e pendência, arquivamento administrativo e indicadores
de alunos sem atualização.

Uma pendência de desvinculação aparece ao lado da aluna. O personal abre o
pedido e tem apenas a ação `Aceitar desvinculação`; não há recusa. Depois de
aceitar, perde imediatamente a leitura e escrita da conta daquela aluna e
mantém somente metadados administrativos mínimos do relacionamento (por
exemplo, nome, e-mail e datas).

Personal, Personal Pro e Studio compartilham carteira, perfil e avaliações.
Personal Pro e Studio adicionam dashboard consolidado, filtros avançados e
relatórios por aluna. Studio só altera a capacidade nesta versão.

## Assinatura e capacidade

O papel de personal não é permanente: decorre de entitlement Stripe ativo para
`professional_personal`, `professional_personal_pro` ou
`professional_studio`.

- Plano ativo: pode convidar, registrar avaliações, anexar fotos e usar as
  capacidades correspondentes.
- Plano inativo, cancelado ou inadimplente: mantém os vínculos e a carteira em
  leitura, mas o backend bloqueia convites, avaliações, fotos e relatórios
  pagos.
- Upgrade libera a nova capacidade após confirmação de webhook.
- Downgrade é bloqueado enquanto vínculos ativos e convites pendentes excedem
  o limite do plano de destino; o personal deve encerrar vínculos ou revogar
  convites antes.

Os limites são 10 para Personal, 30 para Personal Pro e 100 para Studio.

## Relatórios

Personal Pro e Studio geram um relatório por aluna com dados básicos,
comparação entre a avaliação atual e anterior, variações, gráficos, fotos
opcionais e observações. A primeira entrega mantém HTML com layout de impressão
para salvar como PDF; geração de PDF no servidor é evolução posterior.

## Segurança, automação e operação

Convite, resposta, leitura profissional, avaliação, fotos, relatório,
solicitação/cancelamento/aceite de desvínculo passam por RPCs ou Edge Functions
autenticadas. O servidor valida identidade, vínculo, plano, capacidade, autoria
e visibilidade; o cliente nunca determina acesso.

Um job agendado idempotente encerra solicitações de desvinculação ao atingir 72
horas e grava o motivo `timeout`. O sistema audita convite, resposta,
compartilhamento, pedido, cancelamento, aceite, prazo e autoria de avaliação.
Não cria cópias extras de medidas.

O deploy inclui migrations, bucket privado e políticas, função/job agendado,
secrets necessários, observabilidade de falhas do job e roteiro de validação
com uma conta de personal e uma conta de aluna.

## Critérios de aceite

- A aluna precisa aceitar explicitamente o convite antes de existir vínculo.
- Ela pode autorizar ou negar acesso ao histórico anterior, e o servidor filtra
  a leitura profissional conforme essa escolha.
- Vínculo ativo bloqueia criação de entradas pela aluna e libera somente
  visualização do acompanhamento.
- Personal sem entitlement ativo não cria convites, avaliações, fotos ou
  relatórios pagos, mas seus vínculos continuam ativos e legíveis.
- Limites incluem vínculos ativos e convites pendentes e não podem ser
  excedidos concorrentemente.
- Pedido de desvínculo permanece pendente até aceite ou 72 horas; pode ser
  cancelado pela aluna antes disso.
- Ao fim do vínculo, o personal perde escrita e a aluna recupera permissões do
  plano individual sem perder dados.
- Fotos não são públicas e só usuários autorizados recebem URLs temporárias.
- Testes abrangem autorização, concorrência, transições Stripe, timeout,
  compartilhamento de histórico, cancelamento e regressões de acesso.
