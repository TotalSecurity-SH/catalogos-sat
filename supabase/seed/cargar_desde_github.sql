-- Carga los catálogos directamente desde el CSV público del repositorio.
-- Alternativa a scripts/cargar_datos.sh cuando no tienes psql: pégalo en el SQL Editor de Supabase
-- después de aplicar la migración.

create extension if not exists http with schema extensions;

truncate public.catalogo_sat;

insert into public.catalogo_sat (catalogo, clave, descripcion)
select m[1],
       m[2],
       -- Las descripciones con comas vienen entre comillas, con comillas internas duplicadas.
       case when m[3] like '"%"' then replace(substr(m[3], 2, length(m[3]) - 2), '""', '"') else m[3] end
from (
  select regexp_match(linea, '^([^,]+),([^,]+),(.*)$') as m
  from regexp_split_to_table(
         (select content
            from extensions.http_get('https://raw.githubusercontent.com/TotalSecurity-SH/catalogos-sat/main/supabase/seed/catalogos.csv')),
         E'\n') with ordinality as t(linea, n)
  where n > 1 and linea <> ''
) filas;

-- La extensión solo se necesita para la carga.
drop extension if exists http;

select count(*) as registros from public.catalogo_sat;
