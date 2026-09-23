# Conta do aluno e vínculo profissional

## Problema

O painel profissional não deve criar alunos fictícios dentro da conta do
personal. Cada aluno deve possuir uma conta Fita individual, ser o proprietário
dos próprios dados e manter a continuidade desses dados ao deixar um personal.

## Decisão

O aluno usa a conta individual Free/Pro normalmente. Um vínculo temporário dá ao
profissional permissão para registrar e consultar avaliações. Enquanto o vínculo
está ativo, o aluno pode consultar a própria evolução, mas não pode editar
medidas, avaliações ou fotos. Ao encerrar o vínculo, o aluno mantém todos os
dados e recupera a edição; continua no plano individual que já possuía.

O profissional nunca recebe propriedade nem acesso direto à tabela de dados do
aluno. Operações profissionais passam por RPCs server-side que validam o vínculo
ativo e o limite do plano.

## Regras de produto

1. Uma conta individual pode existir sem profissional, com edição normal.
2. Um aluno pode ter no máximo um vínculo profissional ativo no MVP.
3. O profissional pode ler e escrever avaliações enquanto o vínculo está ativo.
4. O aluno pode ler seus dados enquanto vinculado, mas a interface e a API
   bloqueiam edições do aluno.
5. Encerrar o vínculo não remove dados, entitlement, conta ou histórico.
6. Depois do encerramento, o aluno volta a editar e usar o plano individual.
7. O profissional perde imediatamente o acesso após revogação/encerramento.
8. Sincronização em nuvem pertence ao plano individual do aluno; o plano
   profissional paga a gestão, não transforma o aluno em usuário Pro.
9. Relatórios pertencem aos recursos Personal Pro e Studio.

## Modelo de dados

Criar `fita_professional_links`:

- `id uuid primary key`;
- `professional_user_id uuid references auth.users`;
- `student_user_id uuid references auth.users`;
- `status text` em `pending`, `active`, `ended`, `revoked`;
- `can_student_edit boolean not null default false`;
- `invited_at`, `accepted_at`, `ended_at`, `created_at`.

Criar `fita_professional_invitations` para convites pendentes, com profissional,
e-mail do aluno, token armazenado de forma não reversível, expiração e status.

Adicionar constraints para impedir auto-vínculo, duplicidade de vínculo ativo e
aceitação de convite expirado. Não duplicar `fita_data`: os registros continuam
pertencendo ao `student_user_id`.

## API autorizada

As RPCs ou Edge Functions devem expor operações equivalentes a:

- `create_professional_invitation(email)`;
- `accept_professional_invitation(token)`;
- `list_professional_students()`;
- `get_professional_student_workspace(link_id)`;
- `add_professional_evaluation(link_id, entry)`;
- `end_professional_link(link_id)`;
- `leave_professional_link(link_id)`.

Cada operação valida `auth.uid()`, status do vínculo, pertencimento do
profissional/aluno e limite do entitlement profissional. O aluno nunca recebe
um `fita_data` de outro usuário por uma consulta direta.

## Interface

O profissional usa `/profissional` para convites, carteira, avaliações,
gráficos e relatórios. O aluno continua em `/app` e ganha a aba `Meu Personal`
quando possui vínculo ativo. Essa aba é somente leitura durante o vínculo e
mostra profissional, última avaliação, evolução, fotos e relatórios disponíveis.

## Fora de escopo

- múltiplos profissionais por aluno;
- equipes, unidades e permissões internas de Studio;
- chat, agenda, dieta ou prescrição;
- venda de assinatura para o aluno pelo personal;
- exclusão automática de dados ao terminar vínculo;
- edição colaborativa simultânea.

## Verificação

- aluno sem vínculo edita normalmente;
- aluno vinculado não consegue editar pela UI nem pela API;
- personal consegue registrar avaliação somente no vínculo ativo;
- encerramento preserva dados e reativa edição do aluno;
- personal deixa de ler o aluno após encerramento;
- plano individual do aluno não muda ao entrar/sair do vínculo;
- limite profissional é validado no backend;
- RLS impede acesso cruzado;
- relatórios aparecem somente para Personal Pro/Studio.
