-- Xerox Service Hub — execute no SQL Editor do Supabase
create extension if not exists "pgcrypto";
create type public.perfil_acesso as enum ('Administrador','Supervisor','Analista','Operador');
create type public.tipo_movimentacao as enum ('entrada','retirada');
create type public.status_cadastro as enum ('pendente','aprovado','rejeitado');
create type public.unidade as enum ('SP','BH','PE','DF','JB','ION','EG');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null, email text not null unique,
  perfil public.perfil_acesso not null default 'Operador',
  status public.status_cadastro not null default 'pendente',
  created_at timestamptz not null default now()
);

-- Catálogo compartilhado entre unidades: o mesmo produto (referência) pode
-- ter estoque em várias unidades ao mesmo tempo, cada uma com sua própria
-- quantidade — ver tabela public.estoque.
create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  referencia_produto text not null unique,
  nome_produto text not null, descricao text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.estoque (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  unidade public.unidade not null,
  quantidade_atual integer not null default 0 check (quantidade_atual >= 0),
  estoque_minimo integer not null default 0 check (estoque_minimo >= 0),
  updated_at timestamptz not null default now(),
  unique (produto_id, unidade)
);
create index estoque_unidade_idx on public.estoque(unidade);

create table public.movimentacoes (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete restrict,
  usuario_id uuid not null references public.users(id) on delete restrict,
  unidade public.unidade not null,
  tipo_movimentacao public.tipo_movimentacao not null,
  quantidade integer not null check (quantidade > 0),
  observacao text, data_movimentacao timestamptz not null default now()
);
create index movimentacoes_produto_idx on public.movimentacoes(produto_id);
create index movimentacoes_usuario_idx on public.movimentacoes(usuario_id);
create index movimentacoes_data_idx on public.movimentacoes(data_movimentacao desc);
create index movimentacoes_unidade_idx on public.movimentacoes(unidade);

-- Quais unidades cada Operador/Analista pode acessar e alterar. Administrador
-- e Supervisor não precisam de linhas aqui: têm acesso total (ver funções
-- is_admin_aprovado / is_unidade_permitida abaixo).
create table public.usuarios_unidades (
  usuario_id uuid not null references public.users(id) on delete cascade,
  unidade public.unidade not null,
  primary key (usuario_id, unidade)
);

-- Pedido avulso fora do catálogo de produtos (não gera movimentação nem
-- mexe no estoque) — ex.: uma compra pontual do mês que não é item de
-- estoque regular.
create table public.pedidos_extras (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.users(id) on delete restrict,
  unidade public.unidade not null,
  descricao text not null,
  quantidade integer not null check (quantidade > 0),
  observacao text,
  atendido boolean not null default false,
  created_at timestamptz not null default now()
);
create index pedidos_extras_unidade_idx on public.pedidos_extras(unidade);

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path='' as $$ begin new.updated_at=now(); return new; end; $$;
create trigger produtos_updated_at before update on public.produtos for each row execute function public.set_updated_at();
create trigger estoque_updated_at before update on public.estoque for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.users(id,nome,email,perfil) values(new.id,coalesce(new.raw_user_meta_data->>'nome',split_part(new.email,'@',1)),new.email,coalesce((new.raw_user_meta_data->>'perfil')::public.perfil_acesso,'Operador'));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace view public.estoque_detalhado with (security_invoker=true) as
select e.id,e.produto_id,e.unidade,e.quantidade_atual,e.estoque_minimo,e.updated_at,p.referencia_produto,p.nome_produto,p.descricao
from public.estoque e join public.produtos p on p.id=e.produto_id;

create or replace view public.movimentacoes_detalhadas with (security_invoker=true) as
select m.id,m.produto_id,m.usuario_id,m.unidade,m.tipo_movimentacao,m.quantidade,coalesce(m.observacao,'') observacao,m.data_movimentacao,p.nome_produto produto_nome,p.referencia_produto produto_referencia,u.nome usuario_nome
from public.movimentacoes m join public.produtos p on p.id=m.produto_id join public.users u on u.id=m.usuario_id;

-- Perfis já com as unidades vinculadas (array vazio = Administrador/Supervisor
-- com acesso total, ou usuário ainda sem unidade definida). security_invoker
-- faz este LEFT JOIN respeitar a RLS de usuarios_unidades: um usuário comum
-- só enxerga o próprio vínculo; Administrador/Supervisor enxergam todos.
create or replace view public.usuarios_com_unidades with (security_invoker=true) as
select u.id,u.nome,u.email,u.perfil,u.status,
  coalesce(array_agg(uu.unidade order by uu.unidade) filter (where uu.unidade is not null), '{}') as unidades
from public.users u left join public.usuarios_unidades uu on uu.usuario_id=u.id
group by u.id,u.nome,u.email,u.perfil,u.status;

create or replace view public.pedidos_extras_detalhados with (security_invoker=true) as
select pe.id,pe.usuario_id,pe.unidade,pe.descricao,pe.quantidade,coalesce(pe.observacao,'') observacao,pe.atendido,pe.created_at,u.nome usuario_nome
from public.pedidos_extras pe join public.users u on u.id=pe.usuario_id;

-- Funções security definer: consultam public.users/usuarios_unidades como o
-- dono das tabelas (que ignora RLS), evitando a recursão infinita que
-- ocorreria se uma policy fizesse subquery direto na própria tabela.
create or replace function public.is_status_aprovado() returns boolean
language sql security definer set search_path='' stable as $$
  select exists(select 1 from public.users where id=auth.uid() and status='aprovado');
$$;
create or replace function public.is_admin_aprovado() returns boolean
language sql security definer set search_path='' stable as $$
  select exists(select 1 from public.users where id=auth.uid() and perfil in('Administrador','Supervisor') and status='aprovado');
$$;
create or replace function public.is_gestor_aprovado() returns boolean
language sql security definer set search_path='' stable as $$
  select exists(select 1 from public.users where id=auth.uid() and perfil in('Administrador','Supervisor','Analista') and status='aprovado');
$$;
-- Enxerga/movimenta a unidade: Administrador e Supervisor têm acesso total;
-- os demais precisam estar vinculados àquela unidade em usuarios_unidades.
create or replace function public.is_unidade_permitida(p_unidade public.unidade) returns boolean
language sql security definer set search_path='' stable as $$
  select public.is_admin_aprovado() or exists(
    select 1 from public.usuarios_unidades uu join public.users u on u.id=uu.usuario_id
    where uu.usuario_id=auth.uid() and uu.unidade=p_unidade and u.status='aprovado'
  );
$$;
-- Pode administrar (criar/editar/excluir) o estoque daquela unidade:
-- Administrador/Supervisor sempre; Analista só nas unidades vinculadas.
create or replace function public.is_gestor_unidade(p_unidade public.unidade) returns boolean
language sql security definer set search_path='' stable as $$
  select public.is_admin_aprovado() or exists(
    select 1 from public.usuarios_unidades uu join public.users u on u.id=uu.usuario_id
    where uu.usuario_id=auth.uid() and uu.unidade=p_unidade and u.perfil='Analista' and u.status='aprovado'
  );
$$;

create or replace function public.registrar_movimentacao(p_produto_id uuid,p_unidade public.unidade,p_tipo public.tipo_movimentacao,p_quantidade integer,p_observacao text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_atual integer; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Usuário não autenticado'; end if;
  if not exists(select 1 from public.users where id=auth.uid() and status='aprovado') then raise exception 'Cadastro ainda não aprovado pelo administrador'; end if;
  if not public.is_unidade_permitida(p_unidade) then raise exception 'Você não tem acesso a esta unidade'; end if;
  if p_quantidade<=0 then raise exception 'Quantidade inválida'; end if;
  select quantidade_atual into v_atual from public.estoque where produto_id=p_produto_id and unidade=p_unidade for update;
  if not found then raise exception 'Produto não encontrado nesta unidade'; end if;
  if p_tipo='retirada' and p_quantidade>v_atual then raise exception 'Estoque insuficiente'; end if;
  update public.estoque set quantidade_atual=case when p_tipo='entrada' then quantidade_atual+p_quantidade else quantidade_atual-p_quantidade end where produto_id=p_produto_id and unidade=p_unidade;
  insert into public.movimentacoes(produto_id,usuario_id,unidade,tipo_movimentacao,quantidade,observacao) values(p_produto_id,auth.uid(),p_unidade,p_tipo,p_quantidade,nullif(trim(p_observacao),'')) returning id into v_id;
  return v_id;
end; $$;

alter table public.users enable row level security;
alter table public.produtos enable row level security;
alter table public.estoque enable row level security;
alter table public.movimentacoes enable row level security;
alter table public.usuarios_unidades enable row level security;
alter table public.pedidos_extras enable row level security;

create policy "Usuário consulta próprio perfil" on public.users for select to authenticated using(id=auth.uid());
create policy "Equipe aprovada consulta perfis" on public.users for select to authenticated using(public.is_status_aprovado());
create policy "Admin aprova ou recusa cadastros" on public.users for update to authenticated using(public.is_admin_aprovado()) with check(public.is_admin_aprovado());

create policy "Consulta vínculo de unidade" on public.usuarios_unidades for select to authenticated using(usuario_id=auth.uid() or public.is_admin_aprovado());
create policy "Admin gerencia vínculo de unidade" on public.usuarios_unidades for all to authenticated using(public.is_admin_aprovado()) with check(public.is_admin_aprovado());

create policy "Equipe consulta produtos" on public.produtos for select to authenticated using(public.is_status_aprovado());
create policy "Gestores administram catálogo de produtos" on public.produtos for all to authenticated using(public.is_gestor_aprovado()) with check(public.is_gestor_aprovado());

create policy "Equipe consulta estoque da sua unidade" on public.estoque for select to authenticated using(public.is_unidade_permitida(unidade));
create policy "Gestores administram estoque da unidade" on public.estoque for all to authenticated using(public.is_gestor_unidade(unidade)) with check(public.is_gestor_unidade(unidade));

create policy "Equipe consulta movimentações da sua unidade" on public.movimentacoes for select to authenticated using(public.is_unidade_permitida(unidade));
create policy "Usuário registra própria movimentação" on public.movimentacoes for insert to authenticated with check(usuario_id=auth.uid() and public.is_status_aprovado() and public.is_unidade_permitida(unidade));

create policy "Equipe consulta pedidos extras da sua unidade" on public.pedidos_extras for select to authenticated using(public.is_unidade_permitida(unidade));
create policy "Usuário registra pedido extra" on public.pedidos_extras for insert to authenticated with check(usuario_id=auth.uid() and public.is_status_aprovado() and public.is_unidade_permitida(unidade));
create policy "Admin marca pedido extra como atendido" on public.pedidos_extras for update to authenticated using(public.is_admin_aprovado()) with check(public.is_admin_aprovado());

grant select, update on public.users to authenticated;
grant select, insert, update, delete on public.usuarios_unidades to authenticated;
grant select, insert, update, delete on public.produtos to authenticated;
grant select, insert, update, delete on public.estoque to authenticated;
grant select, insert on public.movimentacoes to authenticated;
grant select, insert, update on public.pedidos_extras to authenticated;
grant select on public.movimentacoes_detalhadas, public.estoque_detalhado, public.usuarios_com_unidades, public.pedidos_extras_detalhados to authenticated;
grant execute on function public.is_status_aprovado(),public.is_admin_aprovado(),public.is_gestor_aprovado(),public.is_unidade_permitida(public.unidade),public.is_gestor_unidade(public.unidade) to authenticated;
grant execute on function public.registrar_movimentacao(uuid,public.unidade,public.tipo_movimentacao,integer,text) to authenticated;

-- Todo novo cadastro nasce com status 'pendente' e sem nenhuma unidade
-- vinculada. Depois de criar o primeiro usuário pelo app (tela de cadastro)
-- ou pelo Supabase Auth, promova-o a Administrador aprovado rodando
-- manualmente (Administrador não precisa de vínculo de unidade):
-- update public.users set perfil='Administrador', status='aprovado' where email='seu-email@empresa.com.br';
