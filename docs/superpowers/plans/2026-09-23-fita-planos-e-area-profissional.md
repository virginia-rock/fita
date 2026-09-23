Fita — Plano de Implantação de Pricing e Área Profissional
Objetivo
Implementar a nova estrutura comercial do Fita com foco em dois públicos:

1. usuários individuais;
2. profissionais e negócios que acompanham clientes/alunos.
   Este documento cobre apenas:

- reescrita do hero da landing;
- nova estrutura de preços;
- definição da matriz Free vs Pro;
- criação dos planos Fita Personal, Fita Personal Pro e Fita Studio;
- requisitos do painel profissional necessário para suportar esses planos.

1. Reescrever o hero da landing
   Objetivo
   Reposicionar o Fita em torno de transformação corporal, e não apenas de registro de medidas.
   Direção da mensagem
   A landing deve comunicar que o Fita ajuda o usuário a enxergar mudanças que a balança sozinha não mostra.
   Mensagem principal sugerida
   Acompanhe sua transformação além do peso.

Mensagem de apoio sugerida
Registre medidas, peso, composição corporal e evolução visual em um só lugar. Veja como seu corpo muda ao longo do tempo, mesmo quando a balança não conta toda a história.

CTA principal
Começar grátis

CTA secundário
Ver planos

Resultado esperado
O hero deve deixar claro que o valor principal do Fita é acompanhar evolução corporal, e não simplesmente armazenar dados. 2. Alterar o pricing para usuários individuais
A comparação principal da landing deve apresentar somente dois planos:
Fita Free
R$ 0
Voltado para quem deseja acompanhar a própria evolução sem sincronização em nuvem.
Fita Pro
R$ 14,90/mês
ou
R$ 119,90/ano
O plano anual equivale a aproximadamente R$ 9,99/mês.
Alterações necessárias

- remover o plano avulso de R$ 29,90 da comparação principal;
- adicionar opção mensal e anual no Fita Pro;
- destacar visualmente o plano anual como melhor custo-benefício;
- manter o Free como porta de entrada do produto.

3. Definir a matriz Free vs Pro
   A divisão entre Free e Pro deve ficar documentada e refletida no produto e na landing.
   Recurso Free Pro
   Cadastro de medidas corporais Sim Sim
   Peso Sim Sim
   Composição corporal Sim Sim
   Histórico básico Sim Sim
   Gráficos básicos Sim Sim
   Armazenamento local Sim Sim
   Exportação dos dados Sim Sim
   Sincronização na nuvem Não Sim
   Backup automático Não Sim
   Acesso em múltiplos dispositivos Não Sim
   Fotos de evolução Limitado/local Sim
   Comparação antes/depois Não Sim
   Gráficos avançados Não Sim
   Evolução por período Não Sim
   Relatórios Não Sim
   Recursos premium futuros Não Sim

Regra principal
O Free deve continuar sendo útil.
O Pro não deve parecer apenas uma cobrança por armazenamento. Ele deve representar uma experiência mais completa de acompanhamento de evolução. 4. Criar linha de planos profissionais
Além dos planos individuais, o Fita deve ganhar uma linha voltada a profissionais e negócios.
Fita Personal
R$ 39,90/mês
Até 10 alunos.
Público

- personal trainers;
- treinadores independentes;
- profissionais com pequena carteira de clientes.
  Recursos
- cadastro de alunos;
- medidas corporais;
- peso;
- composição corporal;
- fotos;
- histórico;
- gráficos;
- acompanhamento individual.
  Fita Personal Pro
  R$ 69,90/mês
  Até 30 alunos.
  Público
- personal trainers com carteira maior;
- nutricionistas;
- consultores fitness;
- profissionais que fazem acompanhamento recorrente.
  Recursos
  Tudo do Fita Personal, mais:
- relatórios;
- dashboard consolidado;
- visão geral dos alunos;
- indicadores de evolução;
- filtros e busca;
- acompanhamento facilitado de múltiplos alunos.
  Fita Studio
  R$ 149/mês
  Até 100 alunos/clientes.
  Público
- academias;
- studios;
- clínicas;
- nutricionistas com equipe;
- consultorias;
- centros de treinamento;
- pequenos negócios de acompanhamento corporal.
  Recursos
  Tudo do Fita Personal Pro, com limite ampliado para até 100 clientes.
  A arquitetura deve permitir futuramente:
- múltiplos profissionais;
- permissões;
- equipes;
- unidades;
- branding personalizado.
  Esses recursos não precisam fazer parte da primeira versão.

5. Criar painel profissional
   Para suportar os planos Personal, Personal Pro e Studio será necessário desenvolver uma nova área do sistema.
   Objetivo
   Permitir que um profissional gerencie e acompanhe vários alunos sem misturar essa experiência com o painel individual do Fita.
   5.1 Dashboard
   Página inicial do profissional.
   Exibir

- quantidade de alunos ativos;
- limite do plano;
- últimas avaliações;
- alunos adicionados recentemente;
- alunos sem atualização recente;
- atalhos para cadastrar aluno;
- atalhos para registrar avaliação.
  Exemplo
  18 de 30 alunos utilizados

5.2 Gestão de alunos
Criar uma tela com listagem de todos os alunos vinculados ao profissional.
Informações

- nome;
- foto;
- última avaliação;
- peso atual;
- última alteração registrada;
- status.
  Ações
- visualizar;
- editar;
- adicionar avaliação;
- abrir histórico;
- arquivar aluno.
  Recursos necessários
- busca;
- filtros;
- paginação;
- ordenação.
  5.3 Cadastro de aluno
  O profissional deve conseguir cadastrar um aluno diretamente.
  Dados mínimos
- nome;
- e-mail opcional;
- telefone opcional;
- data de nascimento opcional;
- sexo utilizado para referência visual;
- observações.
  Regra importante
  O aluno não deve ser obrigado a criar uma conta imediatamente.
  O sistema deve permitir dois cenários:

1. aluno gerenciado apenas pelo profissional;
2. aluno convidado para acessar o próprio histórico.
   5.4 Perfil do aluno
   Cada aluno deve possuir uma página própria.
   Conteúdo

- resumo atual;
- peso;
- medidas;
- composição corporal;
- fotos;
- histórico;
- gráficos;
- avaliações anteriores;
- observações do profissional.
  Ações
- nova avaliação;
- editar dados;
- anexar fotos;
- gerar relatório;
- convidar aluno;
- arquivar.
  5.5 Avaliações
  O profissional deve conseguir criar avaliações periódicas.
  Cada avaliação deve possuir:
- data;
- peso;
- medidas corporais;
- composição corporal;
- fotos;
- observações.
  O histórico deve permitir comparar avaliações anteriores.
  5.6 Fotos de evolução
  Permitir upload de fotos vinculadas a uma avaliação.
  Sugestão inicial
- frente;
- lado;
- costas.
  As imagens devem ficar vinculadas ao aluno e à data da avaliação.
  5.7 Gráficos
  Exibir evolução de:
- peso;
- cintura;
- abdômen;
- tórax;
- braço;
- quadril;
- coxa;
- panturrilha;
- gordura corporal;
- demais medidas cadastradas.
  Permitir seleção de período.
  5.8 Relatórios
  Disponível a partir do Fita Personal Pro.
  Relatório por aluno
  Deve conter:
- dados básicos;
- avaliação atual;
- comparação com avaliação anterior;
- variação das principais medidas;
- gráficos;
- fotos opcionais;
- observações.
  Inicialmente pode ser gerado em PDF.

6. Estrutura de permissões
   Criar pelo menos dois tipos de conta:
   Usuário individual
   Utiliza:

- Free;
- Pro.
  Profissional
  Utiliza:
- Personal;
- Personal Pro;
- Studio.
  A aplicação deve identificar o tipo de conta após o login e direcionar para o painel correspondente.

7. Controle de limites
   O backend deve validar o número máximo de alunos conforme o plano.
   Plano Limite
   Fita Personal 10
   Fita Personal Pro 30
   Fita Studio 100

Ao atingir o limite:

- impedir novo cadastro;
- informar o limite atual;
- oferecer upgrade.
  A validação deve existir no backend e não somente na interface.

8. Página de pricing
   A landing deve separar os preços em dois grupos.
   Para você
   Free
   R$ 0
Pro
R$ 14,90/mês
   ou
   R$ 119,90/ano
Para profissionais
Personal
R$ 39,90/mês
   Até 10 alunos
   Personal Pro
   R$ 69,90/mês
Até 30 alunos
Studio
R$ 149/mês
   Até 100 alunos
9. Fluxo de aquisição profissional
   A landing deve possuir um CTA específico:
   Sou profissional

Esse CTA deve levar diretamente para a seção de planos profissionais.
Também pode existir uma página específica futuramente:
/profissionais
Mensagem sugerida
Acompanhe a evolução dos seus alunos em um só lugar.

Medidas, peso, composição corporal, fotos, histórico e relatórios organizados para facilitar o acompanhamento de cada cliente.

10. Ordem de implantação
    Fase 1 — Landing e pricing
    Implementar primeiro:
1. reescrever hero;
1. alterar Free/Pro;
1. adicionar mensal e anual;
1. remover R$ 29,90 da comparação principal;
1. criar seção para profissionais;
1. exibir Personal, Personal Pro e Studio.
   Fase 2 — Base de contas profissionais
   Implementar:
1. tipo de conta profissional;
1. planos;
1. limites de alunos;
1. relacionamento profissional → aluno;
1. controle de assinatura.
   Fase 3 — Painel profissional MVP
   Implementar:
1. dashboard;
1. lista de alunos;
1. cadastro de aluno;
1. perfil do aluno;
1. avaliações;
1. medidas;
1. histórico;
1. gráficos;
1. fotos.
   Ao concluir esta fase já é possível vender o Fita Personal.
   Fase 4 — Personal Pro
   Implementar:
1. relatórios;
1. dashboard consolidado;
1. indicadores de evolução;
1. filtros avançados;
1. visão geral dos alunos.
   Fase 5 — Studio
   Inicialmente o Studio pode utilizar a mesma estrutura do Personal Pro alterando apenas o limite para 100 alunos.
   Não é necessário criar gestão de equipe na primeira versão.
   Apenas preparar a arquitetura para permitir isso futuramente.
1. Escopo do MVP profissional
   Para evitar crescimento excessivo do escopo, o primeiro MVP profissional deve possuir somente:

- login profissional;
- assinatura;
- limite de alunos;
- dashboard simples;
- cadastro de alunos;
- perfil do aluno;
- avaliações;
- medidas;
- peso;
- composição corporal;
- fotos;
- histórico;
- gráficos.
  Não implementar inicialmente
- agenda;
- treinos;
- dieta;
- chat;
- pagamentos do aluno;
- CRM;
- prescrição;
- prontuário clínico;
- múltiplos profissionais;
- múltiplas unidades;
- white-label.
  O objetivo é manter o Fita focado em acompanhamento de evolução corporal.

12. Estrutura comercial final
    Individual
    Free
    R$ 0
Pro
R$ 14,90/mês
    R$ 119,90/ano
Profissional
Personal
R$ 39,90/mês
    Até 10 alunos
    Personal Pro
    R$ 69,90/mês
Até 30 alunos
Studio
R$ 149/mês
    Até 100 alunos
    Resultado esperado
    Após essa implantação, o Fita passa a ter dois produtos claramente definidos:
    Fita para pessoas
    Acompanhe sua transformação corporal.

Fita para profissionais
Acompanhe a evolução dos seus alunos em um só lugar.

Isso permite monetizar tanto usuários individuais quanto profissionais, mantendo o produto centralizado no mesmo problema: registrar, visualizar e acompanhar evolução corporal ao longo do tempo.
