"use client";

import { useEffect, useRef, useState } from "react";
import { AYUDA, CATALOGOS, type Catalogo, type Registro } from "@/lib/catalogos";
import { BASE_PATH } from "@/lib/site";

const EJEMPLOS = ["desarrollo de software", "laptop", "consultoría", "E48", "honorarios médicos", "transferencia"];

type Estado = { tipo: "inicio" } | { tipo: "cargando" } | { tipo: "listo"; resultados: Registro[] } | { tipo: "error"; mensaje: string };

function resaltar(texto: string, consulta: string) {
  const palabras = consulta
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/\s+/)
    .filter((p) => p.length > 2);
  if (!palabras.length) return texto;
  const normal = texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const marcas = new Array(texto.length).fill(false);
  for (const p of palabras) {
    const raiz = p.slice(0, Math.max(4, p.length - 2));
    let i = normal.indexOf(raiz);
    while (i >= 0) {
      for (let k = i; k < i + raiz.length; k++) marcas[k] = true;
      i = normal.indexOf(raiz, i + 1);
    }
  }
  const partes: { t: string; m: boolean }[] = [];
  for (let i = 0; i < texto.length; i++) {
    const ultimo = partes.at(-1);
    if (ultimo && ultimo.m === marcas[i]) ultimo.t += texto[i];
    else partes.push({ t: texto[i], m: marcas[i] });
  }
  return partes.map((p, i) => (p.m ? <mark key={i} className="rounded bg-teal/25 px-0.5 text-inherit">{p.t}</mark> : p.t));
}

function Clave({ clave }: { clave: string }) {
  const [copiada, setCopiada] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(clave);
          setCopiada(true);
          setTimeout(() => setCopiada(false), 1200);
        } catch {
          setCopiada(false);
        }
      }}
      title="Copiar clave"
      className="shrink-0 rounded-md border border-[var(--line)] px-2.5 py-1 font-mono text-sm font-semibold tabular-nums transition hover:border-teal"
    >
      {copiada ? "Copiada" : clave}
    </button>
  );
}

export default function Buscador() {
  const [consulta, setConsulta] = useState("desarrollo de software");
  const [catalogo, setCatalogo] = useState<Catalogo | "">("");
  const [estado, setEstado] = useState<Estado>({ tipo: "inicio" });
  const solicitud = useRef(0);

  useEffect(() => {
    const q = consulta.trim();
    if (q.length < 2) return;
    const id = ++solicitud.current;
    const t = setTimeout(async () => {
      setEstado({ tipo: "cargando" });
      try {
        const params = new URLSearchParams({ q });
        if (catalogo) params.set("catalogo", catalogo);
        const res = await fetch(`${BASE_PATH}/api/buscar?${params}`);
        const data = await res.json();
        if (id !== solicitud.current) return;
        setEstado(data.ok ? { tipo: "listo", resultados: data.resultados } : { tipo: "error", mensaje: data.mensaje });
      } catch {
        if (id === solicitud.current) setEstado({ tipo: "error", mensaje: "Sin conexión. Revisa tu internet." });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [consulta, catalogo]);

  const vacio = consulta.trim().length < 2;

  return (
    <main className="mx-auto -mt-16 w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
      <section className="card fade-up p-4 shadow-xl shadow-black/5" style={{ animationDelay: ".25s" }}>
        <label htmlFor="consulta" className="sr-only">
          Buscar en los catálogos del SAT
        </label>
        <div className="relative">
          <svg className="muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            id="consulta"
            type="search"
            autoComplete="off"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Busca por descripción o clave: “servicios de limpieza”, “43211503”, “H87”…"
            className="w-full rounded-xl border border-[var(--line)] bg-transparent py-3.5 pl-12 pr-4 text-base outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/25"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por catálogo">
          {([["", "Todos"], ...Object.entries(CATALOGOS)] as [Catalogo | "", string][]).map(([k, l]) => (
            <button
              key={k || "todos"}
              onClick={() => setCatalogo(k)}
              aria-pressed={catalogo === k}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                catalogo === k ? "border-teal bg-teal/15 text-teal-dark dark:text-teal" : "border-[var(--line)] hover:border-teal/60"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <p className="muted mt-3 flex gap-2 text-xs leading-relaxed sm:text-sm">
          <span className="text-teal-dark dark:text-teal" aria-hidden>ⓘ</span>
          {AYUDA[catalogo]}
        </p>
      </section>

      {!vacio && (
        <details className="card mt-4 px-5 py-3 text-sm">
          <summary className="cursor-pointer font-semibold">¿Para qué sirve este buscador?</summary>
          <p className="muted mt-2 leading-relaxed">
            Al emitir una factura CFDI 4.0, el SAT exige llenar varios campos con claves de sus catálogos. Son más de 55,000 y nadie se las sabe:
            escribe lo que vendes en palabras normales, copia la clave y pégala en tu sistema de facturación. Una clave equivocada puede hacer que tu
            cliente rechace la factura.
          </p>
        </details>
      )}

      <section className="mt-4" aria-live="polite">
        {vacio ? (
          <div className="card p-6">
            <p className="font-semibold">¿Para qué sirve?</p>
            <p className="muted mt-1.5 text-sm leading-relaxed">
              En cada factura CFDI 4.0, cada concepto debe llevar la <b>clave de producto o servicio</b> y la <b>clave de unidad</b> del catálogo del SAT,
              además del uso del CFDI, régimen fiscal, forma y método de pago. Son más de 55,000 claves: aquí las encuentras escribiendo lo que vendes en
              palabras normales, sin descargar el Excel del SAT. Una clave equivocada puede hacer que el cliente rechace la factura o que el SAT la observe.
            </p>
            <ul className="muted mt-3 grid gap-1 text-sm sm:grid-cols-2">
              <li><b className="text-[var(--text)]">Productos y servicios</b>: qué vendes (ej. 80111600, servicios de personal temporal).</li>
              <li><b className="text-[var(--text)]">Unidades</b>: cómo lo mides (E48 servicio, H87 pieza, KGM kilogramo).</li>
              <li><b className="text-[var(--text)]">Uso del CFDI</b>: para qué usará tu cliente la factura (G03 gastos en general).</li>
              <li><b className="text-[var(--text)]">Régimen, forma y método de pago</b>: datos fiscales del emisor, receptor y cobro.</li>
            </ul>
            <p className="mt-5 font-semibold">Prueba con:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {EJEMPLOS.map((e) => (
                <button key={e} onClick={() => setConsulta(e)} className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm hover:border-teal">
                  {e}
                </button>
              ))}
            </div>
          </div>
        ) : estado.tipo === "error" ? (
          <p className="card p-6 text-sm text-bad">{estado.mensaje}</p>
        ) : estado.tipo === "listo" && estado.resultados.length === 0 ? (
          <div className="card p-6 text-sm">
            <p className="font-semibold">Sin resultados para “{consulta}”.</p>
            <p className="muted mt-1">El catálogo usa términos formales: prueba con un sinónimo o una palabra más general.</p>
          </div>
        ) : (
          <div className={`card overflow-hidden transition ${estado.tipo === "cargando" ? "opacity-60" : ""}`}>
            <div className="muted flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5 text-xs">
              <span>{estado.tipo === "listo" ? `${estado.resultados.length} resultados` : "Buscando…"}</span>
              <span>Clic en la clave para copiarla</span>
            </div>
            <ul>
              {(estado.tipo === "listo" ? estado.resultados : []).map((r) => (
                <li key={`${r.catalogo}-${r.clave}`} className="flex items-start gap-3 border-b border-[var(--line)] px-4 py-3 last:border-0">
                  <Clave clave={r.clave} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{resaltar(r.descripcion, consulta)}</p>
                    <p className="muted mt-0.5 text-xs">{CATALOGOS[r.catalogo]}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <p className="muted mt-8 text-xs">
        Catálogos del Anexo 20 del SAT para CFDI 4.0: 52,514 productos y servicios, 2,419 unidades y los catálogos de uso, régimen, forma y método de pago.
      </p>
    </main>
  );
}
