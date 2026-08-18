-- ============================================================
-- Controle de Insumos — schema inicial
-- ============================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ------------------------------------------------------------
-- ESTABELECIMENTOS
-- ------------------------------------------------------------
create table estabelecimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  logo_url text,
  cor_primaria text,      -- hex, ex: '#0f766e'
  cor_secundaria text,    -- hex, ex: '#f0fdfa'
  created_at timestamptz not null default now(),
  unique (user_id)        -- 1 estabelecimento por dono, por enquanto
);

-- ------------------------------------------------------------
-- CATEGORIAS
-- ------------------------------------------------------------
create table categorias (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now(),
  unique (estabelecimento_id, nome)
);

-- ------------------------------------------------------------
-- INSUMOS
-- ------------------------------------------------------------
create table insumos (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references estabelecimentos(id) on delete cascade,
  categoria_id uuid not null references categorias(id) on delete restrict,
  nome text not null,
  quantidade numeric not null default 0 check (quantidade >= 0),
  unidade text not null check (unidade in ('un','kg','g','l','ml','pacote','caixa')),
  foto_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index insumos_estabelecimento_idx on insumos (estabelecimento_id);
create index insumos_categoria_idx on insumos (categoria_id);

-- updated_at automático
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger insumos_set_updated_at
  before update on insumos
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- Categoria padrão "Outros" pra todo estabelecimento novo
-- ------------------------------------------------------------
create or replace function criar_categoria_padrao()
returns trigger as $$
begin
  insert into categorias (estabelecimento_id, nome)
  values (new.id, 'Outros');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger estabelecimento_categoria_padrao
  after insert on estabelecimentos
  for each row execute function criar_categoria_padrao();

-- ------------------------------------------------------------
-- Ajuste atômico de quantidade (botões +/- do card de insumo)
-- ------------------------------------------------------------
create or replace function alterar_quantidade_insumo(insumo_id uuid, delta numeric)
returns insumos as $$
declare
  resultado insumos;
begin
  update insumos
  set quantidade = greatest(0, quantidade + delta)
  where id = insumo_id
  returning * into resultado;

  return resultado;
end;
$$ language plpgsql security invoker set search_path = public;

-- ============================================================
-- RLS
-- ============================================================
alter table estabelecimentos enable row level security;
alter table categorias enable row level security;
alter table insumos enable row level security;

-- ESTABELECIMENTOS: só o dono acessa
create policy "estabelecimento_select_own" on estabelecimentos
  for select using (user_id = auth.uid());
create policy "estabelecimento_insert_own" on estabelecimentos
  for insert with check (user_id = auth.uid());
create policy "estabelecimento_update_own" on estabelecimentos
  for update using (user_id = auth.uid());
create policy "estabelecimento_delete_own" on estabelecimentos
  for delete using (user_id = auth.uid());

-- CATEGORIAS: só quem é dono do estabelecimento dono da categoria
create policy "categorias_all_own" on categorias
  for all using (
    estabelecimento_id in (select id from estabelecimentos where user_id = auth.uid())
  ) with check (
    estabelecimento_id in (select id from estabelecimentos where user_id = auth.uid())
  );

-- INSUMOS: mesma lógica
create policy "insumos_all_own" on insumos
  for all using (
    estabelecimento_id in (select id from estabelecimentos where user_id = auth.uid())
  ) with check (
    estabelecimento_id in (select id from estabelecimentos where user_id = auth.uid())
  );

-- ============================================================
-- STORAGE — bucket único, organizado por estabelecimento
--   logos/{estabelecimento_id}/...
--   insumos/{estabelecimento_id}/...
-- ============================================================
insert into storage.buckets (id, name, public)
values ('establishment-assets', 'establishment-assets', true)
on conflict (id) do nothing;

-- leitura pública (logo e fotos de insumo aparecem sem precisar de signed URL)
create policy "assets_public_read" on storage.objects
  for select using (bucket_id = 'establishment-assets');

-- escrita (insert/update/delete) só pro dono do estabelecimento cuja pasta
-- bate com o 2º segmento do path: {logos|insumos}/{estabelecimento_id}/arquivo.ext
create policy "assets_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'establishment-assets'
    and (storage.foldername(name))[2] in (
      select id::text from estabelecimentos where user_id = auth.uid()
    )
  );

create policy "assets_update_own" on storage.objects
  for update using (
    bucket_id = 'establishment-assets'
    and (storage.foldername(name))[2] in (
      select id::text from estabelecimentos where user_id = auth.uid()
    )
  );

create policy "assets_delete_own" on storage.objects
  for delete using (
    bucket_id = 'establishment-assets'
    and (storage.foldername(name))[2] in (
      select id::text from estabelecimentos where user_id = auth.uid()
    )
  );
