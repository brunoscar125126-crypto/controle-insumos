# Controle de Insumos

App de controle de estoque de insumos pra restaurantes/lojas com operação de
delivery. Next.js (App Router) + Supabase (auth, Postgres, storage).

## Setup

1. **Crie um projeto no Supabase** (supabase.com) e rode a migração:
   - Pelo dashboard: SQL Editor → cole o conteúdo de `supabase/migrations/0001_init.sql` → Run.
   - Ou via CLI: `supabase link --project-ref <ref>` e `supabase db push`.

2. **Ative o provider Google** em Authentication → Providers → Google
   (precisa de um OAuth Client ID/Secret do Google Cloud Console — Authorized
   redirect URI: `https://<seu-projeto>.supabase.co/auth/v1/callback`).

3. **Variáveis de ambiente**: copie `.env.local.example` pra `.env.local` e
   preencha com a URL e a anon key do seu projeto Supabase (Project Settings
   → API).

4. **Instale as dependências e rode**:

   ```bash
   npm install
   npm run dev
   ```

   App em `http://localhost:3000`.

## Fluxo

1. Login com Google (`/login`).
2. Primeiro acesso → `/onboarding`: nome do estabelecimento + logo. A cor
   primária/secundária é extraída do logo automaticamente (client-side,
   `lib/theme/extractPalette.ts`) e salva no estabelecimento.
3. `/insumos`: tela principal de controle de estoque, com o tema (cores)
   do estabelecimento já aplicado.

## Estrutura

- `app/` — rotas (App Router): login, callback OAuth, onboarding e a área
  logada `(app)/insumos`.
- `components/` — UI, separada por domínio (`insumos/`, `onboarding/`).
- `lib/supabase/` — clients Supabase (browser, server, middleware).
- `lib/theme/` — extração de paleta do logo e aplicação como CSS vars.
- `supabase/migrations/` — schema, RLS e triggers (categoria "Outros"
  automática, ajuste atômico de quantidade).
