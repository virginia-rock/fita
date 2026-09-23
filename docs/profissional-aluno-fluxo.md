# Fluxo de aluno vinculado a um personal

## Regra de produto

O aluno usa uma conta normal do Fita. Enquanto existir um vínculo ativo com um personal, ele ganha a aba **Meu Personal**, pode consultar o acompanhamento e fica impedido de criar ou editar medidas. O personal registra as avaliações.

Ao encerrar o vínculo, o aluno mantém todo o histórico já salvo, volta a editar os próprios dados e continua no plano individual que já possuía. O vínculo não converte nem cancela a assinatura individual. Para continuar salvando dados na nuvem depois do período gratuito, o aluno precisa assinar um plano individual.

## Implementação

1. Aplicar a migration `supabase/migrations/20260923000002_create_professional_links.sql`.
2. Configurar as variáveis do Supabase normalmente; não coloque comandos `npx supabase secrets set` dentro do `.env.local`.
3. No painel profissional, criar um convite pelo e-mail do aluno.
4. O aluno aceita o token logado com o mesmo e-mail. A função SQL cria o vínculo ativo e impede dois personais ativos para a mesma conta.
5. O personal encerra o vínculo pelo RPC `end_professional_link`; o aluno pode sair pelo RPC `leave_professional_link`.

## Segurança e dados

As tabelas têm RLS habilitado. Os RPCs validam o usuário autenticado, o papel de cada lado, a expiração do convite e o estado ativo do vínculo. As avaliações são armazenadas no `fita_data` do aluno; o personal acessa esse workspace somente enquanto o vínculo está ativo.

## Relatórios

Personal Pro e Studio exibem a ação de gerar relatório. O download é um HTML imprimível, com opção do navegador de salvar como PDF. O plano Personal básico não recebe essa ação.

## Publicação

Depois de configurar os secrets reais, executar a migration e fazer o deploy das Edge Functions. Validar o fluxo com duas contas: convite, aceite, bloqueio de edição, registro pelo personal, saída do vínculo e retomada da edição pelo aluno.
