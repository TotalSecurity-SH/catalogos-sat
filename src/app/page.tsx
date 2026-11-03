import { ToolHero } from "@/components/ToolHero";
import Buscador from "@/components/Buscador";

export default function Page() {
  return (
    <>
      <ToolHero
        slug="catalogos-sat"
        title={
          <>
            Encuentra la <span className="text-teal">clave SAT</span> correcta para facturar
          </>
        }
        subtitle="Busca entre más de 55 mil claves de productos, servicios y unidades del CFDI 4.0, aunque escribas sin acentos o con errores."
        chips={["55,019 registros", "Búsqueda en español", "Tolera errores de dedo", "PostgreSQL · Supabase"]}
      />
      <Buscador />
    </>
  );
}
