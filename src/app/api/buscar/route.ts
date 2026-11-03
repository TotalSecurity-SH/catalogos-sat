import type { NextRequest } from "next/server";
import { esCatalogo, expandirConsulta, type Registro } from "@/lib/catalogos";

export const maxDuration = 10;

const json = (body: unknown, status = 200, cache = false) =>
  Response.json(body, {
    status,
    headers: cache ? { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } : {},
  });

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 120);
  const catalogo = request.nextUrl.searchParams.get("catalogo");
  if (q.length < 2) return json({ ok: false, mensaje: "Escribe al menos 2 caracteres." }, 400);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return json({ ok: false, mensaje: "La base de datos no está configurada." }, 503);

  const consulta = /^[a-z0-9]+$/i.test(q) && /\d/.test(q) ? q : expandirConsulta(q);

  try {
    const res = await fetch(`${url}/rest/v1/rpc/buscar_catalogo`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ consulta, filtro_catalogo: esCatalogo(catalogo) ? catalogo : null, limite: 40 }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(String(res.status));
    const resultados = (await res.json()) as Registro[];
    return json({ ok: true, resultados }, 200, true);
  } catch {
    return json({ ok: false, mensaje: "No pudimos consultar el catálogo. Intenta de nuevo en unos segundos." }, 502);
  }
}
