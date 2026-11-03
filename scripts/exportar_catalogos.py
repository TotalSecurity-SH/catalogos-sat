"""
Genera supabase/seed/catalogos.csv con los catálogos del Anexo 20 (CFDI 4.0).

Fuente: la base de catálogos que distribuye el paquete open source `satcfdi` (licencia MIT),
que a su vez se construye con los archivos oficiales publicados por el SAT.

Uso:
    pip install satcfdi
    python scripts/exportar_catalogos.py
"""

import csv
import pickle
import sqlite3
from importlib import resources
from pathlib import Path

CATALOGOS = {
    "C756_c_ClaveProdServ": "clave_prod_serv",
    "C756_c_ClaveUnidad": "clave_unidad",
    "C756_c_UsoCFDI": "uso_cfdi",
    "C756_c_RegimenFiscal": "regimen_fiscal",
    "C756_c_FormaPago": "forma_pago",
    "C756_c_MetodoPago": "metodo_pago",
    "C756_c_ObjetoImp": "objeto_imp",
}

SALIDA = Path(__file__).resolve().parent.parent / "supabase" / "seed" / "catalogos.csv"


def main() -> None:
    origen = resources.files("satcfdi") / "catalogs" / "catalogs.db"
    conexion = sqlite3.connect(str(origen))
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    total = 0
    with SALIDA.open("w", newline="", encoding="utf-8") as f:
        escritor = csv.writer(f)
        escritor.writerow(["catalogo", "clave", "descripcion"])
        for tabla, catalogo in CATALOGOS.items():
            for clave, descripcion in conexion.execute(f'SELECT key, value FROM "{tabla}"'):
                escritor.writerow([catalogo, pickle.loads(clave), pickle.loads(descripcion)])
                total += 1
    print(f"{total} registros escritos en {SALIDA}")


if __name__ == "__main__":
    main()
