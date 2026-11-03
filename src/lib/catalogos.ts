export const CATALOGOS = {
  clave_prod_serv: "Productos y servicios",
  clave_unidad: "Unidades",
  uso_cfdi: "Uso del CFDI",
  regimen_fiscal: "Régimen fiscal",
  forma_pago: "Forma de pago",
  metodo_pago: "Método de pago",
  objeto_imp: "Objeto de impuesto",
} as const;

export type Catalogo = keyof typeof CATALOGOS;

/** Qué campo del CFDI se llena con cada catálogo, con un ejemplo. */
export const AYUDA: Record<Catalogo | "", string> = {
  "": "Busca en todos los catálogos. Elige uno para ver en qué parte de la factura se usa.",
  clave_prod_serv: "Va en cada concepto de la factura: describe qué vendes. Ej. 43211503 = computadoras portátiles.",
  clave_unidad: "Va en cada concepto: cómo se mide lo que vendes. Ej. H87 = pieza, E48 = unidad de servicio.",
  uso_cfdi: "Lo indica tu cliente: para qué usará la factura. Ej. G03 = gastos en general, S01 = sin efectos fiscales.",
  regimen_fiscal: "Régimen del emisor y del receptor, tal como aparece en su constancia fiscal. Ej. 626 = RESICO.",
  forma_pago: "Cómo se pagó. Ej. 03 = transferencia, 04 = tarjeta de crédito, 99 = por definir (pago en parcialidades).",
  metodo_pago: "PUE si ya se pagó completo al facturar; PPD si se paga después o en parcialidades (requiere complemento de pago).",
  objeto_imp: "Indica si el concepto causa impuestos. Ej. 02 = sí objeto de impuesto (lleva IVA).",
};

export interface Registro {
  catalogo: Catalogo;
  clave: string;
  descripcion: string;
  relevancia: number;
}

export const esCatalogo = (v: string | null): v is Catalogo => !!v && v in CATALOGOS;

// El catálogo del SAT usa términos formales; estos sinónimos ayudan a encontrar lo que la gente escribe.
const SINONIMOS: Record<string, string> = {
  laptop: "computador portatil notebook",
  laptops: "computador portatil notebook",
  compu: "computador",
  computadora: "computador",
  celular: "telefono movil",
  celulares: "telefonos moviles",
  software: "software",
  app: "aplicacion software",
  pagina: "sitio web",
  web: "sitio web internet",
  consultoria: "consultoria asesoramiento",
  hosting: "alojamiento sitio web",
  nube: "computacion en la nube",
  gasolina: "gasolina combustible",
  comida: "alimentos comidas",
};

export function expandirConsulta(q: string): string {
  const palabras = q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/\s+/);
  const extra = palabras.map((p) => SINONIMOS[p]).filter(Boolean);
  return extra.length ? `${q} ${extra.join(" ")}` : q;
}
