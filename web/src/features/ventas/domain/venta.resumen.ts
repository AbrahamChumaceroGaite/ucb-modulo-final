import type { Venta } from './venta.schema';

/**
 * Las cifras que alimentan los gráficos de ventas.
 *
 * ## Por qué está en el dominio
 *
 * Porque agrupar por día y decidir **qué entra en cada suma** son reglas de
 * negocio: una venta anulada no es dinero que entró, y eso vale igual para el
 * total de la pantalla, para el del reporte y para la altura de una barra. Si
 * cada uno lo decidiera por su cuenta, el gráfico y la suma de arriba dirían
 * cosas distintas sobre las mismas filas.
 *
 * Y porque así se prueba sin montar un `<ResponsiveContainer>`, que en jsdom
 * mide cero y no pinta nada.
 *
 * ## Sobre qué se calcula
 *
 * Sobre **lo que la pantalla tiene cargado y filtrado**, no sobre el histórico:
 * `ObtenerVentasRequest` solo acepta `skip`, `limit` y `search`. El gráfico
 * enseña lo mismo que la lista de debajo, ni más ni menos — y por eso la
 * sección lo dice en su subtítulo en vez de dar a entender que es un informe
 * del negocio.
 */
/** Un punto de una serie. No se exporta: fuera nadie lo nombra, solo lo recibe. */
type PuntoDeResumen = { etiqueta: string; valor: number };

/** El día de una venta, sin construir un `Date`: ver `venta.filtros.ts`. */
const diaDe = (fechaVenta: string) => fechaVenta.slice(0, 10);

/** «21/09», que es como se lee un eje. El año sobra cuando todo es del mismo. */
const comoEtiqueta = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

/**
 * Cuánto se vendió cada día, en orden cronológico.
 *
 * Las anuladas no suman, pero **su día sigue apareciendo** si tuvo otras
 * ventas. Un día que solo tuvo una venta anulada no aparece: no hubo ingreso,
 * y una barra a cero en mitad de la serie se lee como «ese día no vendimos»,
 * que es justo lo que pasó.
 */
export function ingresoPorDia(ventas: readonly Venta[]): PuntoDeResumen[] {
  const porDia = new Map<string, number>();

  for (const venta of ventas) {
    if (venta.borrado) continue;
    const dia = diaDe(venta.fechaVenta);
    porDia.set(dia, (porDia.get(dia) ?? 0) + venta.total);
  }

  return [...porDia.entries()]
    // `AAAA-MM-DD` ordena igual como texto que como fecha.
    .sort(([uno], [otro]) => uno.localeCompare(otro))
    .map(([dia, valor]) => ({ etiqueta: comoEtiqueta(dia), valor }));
}

/**
 * Cuántas ventas hay en cada estado.
 *
 * Aquí **sí** cuentan las anuladas: la pregunta es «cómo quedaron las ventas»,
 * y dejarlas fuera escondería precisamente lo que se quiere ver.
 */
export function ventasPorEstado(ventas: readonly Venta[]): PuntoDeResumen[] {
  const porEstado = new Map<string, number>();

  for (const venta of ventas) {
    const nombre = venta.estadoVenta?.nombre ?? 'Sin estado';
    porEstado.set(nombre, (porEstado.get(nombre) ?? 0) + 1);
  }

  return [...porEstado.entries()]
    .sort(([, uno], [, otro]) => otro - uno)
    .map(([etiqueta, valor]) => ({ etiqueta, valor }));
}

/**
 * Lo que más se llevó, por importe.
 *
 * Por **importe** y no por unidades: tres cafés de 0,50 no pesan lo mismo en
 * la caja que un desayuno de 15, y quien mira este gráfico está decidiendo qué
 * reponer o qué promocionar.
 *
 * Usa `detalle.subtotal`, que ya trae el descuento aplicado y lo calculó el
 * servidor. Las líneas dadas de baja y las ventas anuladas no cuentan.
 */
export function ingresoPorProducto(
  ventas: readonly Venta[],
  nombreDelProducto: (id: string) => string,
  cuantos = 5,
): PuntoDeResumen[] {
  const porProducto = new Map<string, number>();

  for (const venta of ventas) {
    if (venta.borrado) continue;

    for (const linea of venta.detalles) {
      if (linea.borrado) continue;
      const clave = linea.idProducto;
      porProducto.set(clave, (porProducto.get(clave) ?? 0) + linea.subtotal);
    }
  }

  return [...porProducto.entries()]
    .sort(([, uno], [, otro]) => otro - uno)
    .slice(0, cuantos)
    .map(([id, valor]) => ({ etiqueta: nombreDelProducto(id), valor }));
}
