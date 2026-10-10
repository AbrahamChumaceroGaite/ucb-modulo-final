/**
 * Entregar un archivo generado en el navegador.
 *
 * ## Por qué existe
 *
 * Bajar un archivo desde JavaScript son seis líneas que hay que escribir en un
 * orden concreto, y la que más se olvida es la última: **revocar la URL del
 * blob**. Sin eso, cada descarga deja el archivo entero retenido en memoria
 * hasta que se recarga la página; con un reporte grande y diez descargas
 * seguidas, se nota.
 *
 * Está aquí y no en la feature porque el día que Productos quiera exportar su
 * inventario, la plomería es idéntica y lo que cambia son las filas.
 *
 * ## El BOM no es un adorno
 *
 * Excel abre un CSV en UTF-8 como si fuera de la codificación del sistema, así
 * que «Ñape» sale «Ã‘ape» salvo que el archivo empiece por el marcador de
 * orden de bytes. Quien cuadra caja abre el archivo con doble clic, no con un
 * asistente de importación.
 */
const BOM = '﻿';

export function descargarTexto(nombre: string, contenido: string, tipo: string): void {
  const url = URL.createObjectURL(new Blob([BOM + contenido], { type: `${tipo};charset=utf-8` }));

  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  // Sin añadirlo al documento, Firefox ignora el clic.
  document.body.append(enlace);
  enlace.click();
  enlace.remove();

  // Lo que se olvida siempre. El navegador no lo hace por su cuenta.
  URL.revokeObjectURL(url);
}

/**
 * Una fila de CSV, con sus comillas donde tocan.
 *
 * **Separador `;` y decimales con coma**, que es lo que Excel espera en
 * `es-BO`: con `,` de separador, un importe de «3,60» partiría la celda en
 * dos. Es la misma razón por la que el resto del proyecto formatea en esa
 * configuración regional — el archivo se abre con doble clic, no se parsea con
 * un script.
 *
 * Se entrecomilla lo que lleva separador, comillas o salto de línea, y las
 * comillas de dentro se duplican. Es el escapado de RFC 4180; sin él, un
 * cliente llamado «Pérez; Juan» corre una columna todas las de su fila.
 */
const SEPARADOR_CSV = ';';

export function filaCsv(campos: readonly (string | number)[]): string {
  return campos.map(celdaCsv).join(SEPARADOR_CSV);
}

function celdaCsv(valor: string | number): string {
  const texto = String(valor);
  if (!/[";\n\r]/.test(texto)) return texto;
  return `"${texto.replaceAll('"', '""')}"`;
}
