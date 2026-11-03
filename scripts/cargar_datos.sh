#!/usr/bin/env bash
# Crea el esquema y carga los 55,019 registros en tu base de Supabase (se ejecuta una sola vez).
# Requiere psql y la variable DATABASE_URL (Supabase → Connect → Session pooler).
set -euo pipefail
cd "$(dirname "$0")/.."

: "${DATABASE_URL:?Define DATABASE_URL con la cadena de conexión de Supabase}"

echo "1/3 Aplicando migración…"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f supabase/migrations/20261016000000_catalogos_sat.sql

echo "2/3 Cargando catálogos…"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
truncate public.catalogo_sat;
\copy public.catalogo_sat (catalogo, clave, descripcion) from 'supabase/seed/catalogos.csv' with (format csv, header true)
SQL

echo "3/3 Verificando…"
psql "$DATABASE_URL" -At -c "select count(*) || ' registros cargados' from public.catalogo_sat"
psql "$DATABASE_URL" -At -c "select clave || ' · ' || descripcion from public.buscar_catalogo('computadora portatil', null, 3)"
