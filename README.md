# Fita.

![Logo Fita](./public/logo.png)

## Acompanhe sua evolução corporal com clareza

O Fita. é um web app leve e privado para registrar medidas corporais, peso e composição corporal ao longo do tempo. Acompanhe suas mudanças em um painel objetivo, visualize tendências e crie uma rotina de medições sem depender de planilhas.

> Seus dados ficam armazenados no navegador. Você mantém o controle e pode exportar um backup sempre que quiser.

## O que você pode fazer

- Registrar medições por data, com observações opcionais.
- Acompanhar 18 indicadores de circunferência e composição corporal.
- Comparar cada valor com o registro anterior, com variação destacada no painel.
- Abrir a evolução de qualquer indicador em um gráfico histórico.
- Configurar uma rotina diária, semanal, quinzenal ou mensal.
- Visualizar no calendário os dias planejados e as medições já realizadas.
- Exportar os dados em JSON e restaurar um backup posteriormente.

## Indicadores acompanhados

### Medidas corporais

Pescoço, ombros, tórax, braço relaxado, braço contraído, antebraço, cintura, abdômen, quadril, coxa proximal, coxa medial e panturrilha.

### Composição corporal

Peso, gordura corporal, IMC, peso da gordura, massa muscular esquelética e gordura visceral.

O formulário inclui orientações rápidas para padronizar a medição, ajudando a manter comparações mais consistentes entre os registros.

## Privacidade e armazenamento

O Fita. adota uma abordagem local-first: o histórico é salvo no `localStorage` do navegador e não exige uma conta ou banco de dados externo para funcionar.

Para preservar seus dados ao trocar de dispositivo ou navegador:

1. Use **Exportar dados** no menu do aplicativo.
2. Guarde o arquivo `.json` em um local seguro.
3. Use **Importar dados** quando precisar restaurar o histórico.

## Stack

- React 19 + TypeScript
- Vite
- TanStack Router
- Tailwind CSS
- Recharts
- Bun ou npm

## Contribuindo

Contribuições são bem-vindas por meio de issues e pull requests. Consulte o
[guia de contribuição](./CONTRIBUTING.md) para o fluxo de desenvolvimento e
as diretrizes do projeto.

O Fita. é distribuído sob a [licença MIT](./LICENSE), que permite uso,
modificação e distribuição mantendo o aviso de autoria.

## Planos e demonstração

O projeto inclui uma landing page e fluxos visuais de conta, planos e checkout.
Nesta versão, pagamentos continuam simulados. Com o Supabase configurado,
autenticação e armazenamento das fichas e do histórico usam o backend; sem ele,
o projeto continua funcionando no modo local.

## Supabase

The Supabase integration is optional. Copy `.env.example` to `.env.local`, fill
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, and apply
`supabase/migrations/20260921000000_create_fita_data.sql` in the Supabase SQL
Editor (or through the Supabase CLI).

With Supabase configured, authentication and ficha/history data use the signed-in
user's Supabase session. Without it, the app keeps the local-only fallback.
The `fita_data` table uses RLS so each authenticated user can access only their
own row. Never expose a `service_role` or secret key in browser environment
variables.

## Desenvolvimento local

### Pré-requisitos

- Node.js 18+ e npm; ou Bun

### Instalação

```bash
git clone <url-do-repositorio>
cd fita
npm install
```

### Scripts disponíveis

```bash
npm run dev       # inicia o servidor de desenvolvimento
npm run build     # gera o build de produção
npm run preview   # pré-visualiza o build localmente
npm run lint      # executa o ESLint
npm run format    # formata os arquivos com Prettier
```

## Estrutura do produto

- `/` — painel geral com resumo, variações e destaque de evolução.
- `/nova` — formulário para registrar uma nova medição.
- `/medida/:id` — histórico detalhado e gráfico de um indicador.
- `/cronologia` — calendário e configuração da recorrência.
