import type { Metadata, Viewport } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://herramientas.totalsecuritysh.com"),
  title: "Buscador de catálogos SAT · Total Security SH",
  description: "Encuentra la clave de producto, servicio, unidad, uso CFDI o régimen fiscal correcta para facturar, entre más de 55 mil registros.",
};

export const viewport: Viewport = { themeColor: "#0b1424" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
