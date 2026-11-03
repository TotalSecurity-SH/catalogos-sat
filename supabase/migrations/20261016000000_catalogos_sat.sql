-- Buscador de catálogos SAT (Anexo 20, CFDI 4.0)
-- Búsqueda de texto completo en español sin acentos, con respaldo por similitud (trigramas)
-- y coincidencia exacta o por prefijo de clave.

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- unaccent() no es IMMUTABLE; este envoltorio permite usarlo en índices y columnas generadas.
create or replace function public.sin_acentos(texto text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, lower(texto))
$$;

create table if not exists public.catalogo_sat (
  catalogo    text not null check (catalogo in (
                'clave_prod_serv', 'clave_unidad', 'uso_cfdi', 'regimen_fiscal',
                'forma_pago', 'metodo_pago', 'objeto_imp')),
  clave       text not null,
  descripcion text not null,
  busqueda    tsvector generated always as (
                to_tsvector('spanish', public.sin_acentos(descripcion))) stored,
  primary key (catalogo, clave)
);

comment on table public.catalogo_sat is 'Catálogos del Anexo 20 del SAT para CFDI 4.0';

create index if not exists catalogo_sat_busqueda_idx on public.catalogo_sat using gin (busqueda);
create index if not exists catalogo_sat_trgm_idx on public.catalogo_sat
  using gin (public.sin_acentos(descripcion) extensions.gin_trgm_ops);
create index if not exists catalogo_sat_clave_idx on public.catalogo_sat (clave text_pattern_ops);

-- Solo lectura pública: la API no permite modificar los catálogos.
alter table public.catalogo_sat enable row level security;

drop policy if exists "Lectura pública" on public.catalogo_sat;
create policy "Lectura pública" on public.catalogo_sat for select to anon, authenticated using (true);

-- Supabase ya no expone tablas nuevas a la API automáticamente: el acceso de lectura se concede explícito.
grant usage on schema public to anon, authenticated;
grant usage on schema extensions to anon, authenticated;
grant select on public.catalogo_sat to anon, authenticated;

create or replace function public.buscar_catalogo(
  consulta text,
  filtro_catalogo text default null,
  limite int default 30
)
returns table (catalogo text, clave text, descripcion text, relevancia real)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select trim(consulta) as texto,
           public.sin_acentos(trim(consulta)) as normal,
           websearch_to_tsquery('spanish', public.sin_acentos(trim(consulta))) as tsq,
           -- Variante con OR: encuentra registros que contienen solo algunas de las palabras
           nullif(replace(plainto_tsquery('spanish', public.sin_acentos(trim(consulta)))::text, '&', '|'), '')::tsquery as tsq_alguna
  ),
  candidatos as (
    -- 1) La clave coincide exacta o empieza igual (ej. "43231" o "E48")
    select c.catalogo, c.clave, c.descripcion,
           case when c.clave = upper(q.texto) then 3.0 else 2.0 end::real as relevancia
      from public.catalogo_sat c, q
     where c.clave like replace(replace(upper(q.texto), '%', '\%'), '_', '\_') || '%'
    union all
    -- 2) Texto completo en español (raíces: "computadora" encuentra "computadoras")
    select c.catalogo, c.clave, c.descripcion,
           (1.0 + ts_rank(c.busqueda, q.tsq))::real
      from public.catalogo_sat c, q
     where c.busqueda @@ q.tsq
    union all
    -- 2b) Alguna de las palabras: más palabras en común, mayor relevancia
    select c.catalogo, c.clave, c.descripcion,
           (0.5 + ts_rank_cd(c.busqueda, q.tsq_alguna, 1))::real
      from public.catalogo_sat c, q
     where q.tsq_alguna is not null and c.busqueda @@ q.tsq_alguna
    union all
    -- 3) Similitud para errores de dedo ("conputadora")
    select c.catalogo, c.clave, c.descripcion,
           extensions.similarity(public.sin_acentos(c.descripcion), q.normal)::real
      from public.catalogo_sat c, q
     where length(q.normal) >= 4
       and public.sin_acentos(c.descripcion) operator(extensions.%) q.normal
  )
  select cand.catalogo, cand.clave, cand.descripcion, max(cand.relevancia) as relevancia
    from candidatos cand
   where filtro_catalogo is null or cand.catalogo = filtro_catalogo
   group by cand.catalogo, cand.clave, cand.descripcion
   order by relevancia desc, cand.clave
   limit least(greatest(limite, 1), 100)
$$;

comment on function public.buscar_catalogo is 'Busca por clave, texto completo y similitud; devuelve los resultados ordenados por relevancia.';

grant execute on function public.sin_acentos(text) to anon, authenticated;
grant execute on function public.buscar_catalogo(text, text, int) to anon, authenticated;
