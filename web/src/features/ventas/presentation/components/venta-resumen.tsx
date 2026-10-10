'use client';

import { BarChart3 } from 'lucide-react';
import { ChartCard, EmptyState, SerieAnillo, SerieBarras } from '@/shared/ui/patterns';
import {
  ingresoPorDia,
  ingresoPorProducto,
  ventasPorEstado,
} from '../../domain/venta.resumen';
import type { Venta } from '../../domain/venta.schema';

/**
 * Los tres gráficos del libro de ventas.
 *
 * ## Qué enseñan exactamente, dicho sin adornos
 *
 * **Lo que hay cargado y filtrado en esta pantalla**, no el histórico del
 * negocio. `ObtenerVentasRequest` solo acepta `skip`, `limit` y `search`, así
 * que la pantalla trabaja sobre una página. El subtítulo de cada tarjeta lo
 * dice, y no es una nota al pie: un gráfico que parece un informe del año y
 * son diez filas es peor que no tener gráfico.
 *
 * El día que el backend acepte un rango de fechas, esto pasa a pedir su propia
 * consulta y los subtítulos cambian. Mientras tanto, se dice lo que es.
 *
 * ## Por qué no calcula nada
 *
 * Las tres series salen de `domain/venta.resumen.ts`. Si la agrupación viviera
 * aquí, la barra de un día podría no cuadrar con la suma que enseña la
 * pantalla encima de la lista — y las dos vienen de las mismas filas. Es la
 * misma regla que hace que `nivelDeStock` no viva dentro de una tarjeta.
 *
 * ## Por qué los gráficos no llevan sus propias acciones
 *
 * Porque no las necesitan: lo que acota ya está en la barra de filtros de
 * arriba, y duplicar ahí un selector de rango daría dos sitios donde cambiar
 * lo mismo.
 */
export function VentaResumen({
  ventas,
  nombreDelProducto,
}: {
  /** Las ya filtradas: el gráfico enseña lo mismo que la lista de abajo. */
  ventas: readonly Venta[];
  nombreDelProducto: (id: string) => string;
}) {
  const porDia = ingresoPorDia(ventas);
  const porEstado = ventasPorEstado(ventas);
  const porProducto = ingresoPorProducto(ventas, nombreDelProducto);

  if (ventas.length === 0) {
    return (
      <EmptyState
        icono={<BarChart3 className="size-5" />}
        titulo="Nada que resumir"
        mensaje="Cuando haya ventas que encajen con los filtros, aquí saldrán sus gráficos."
      />
    );
  }

  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(18rem,100%),1fr))]">
      <ChartCard
        titulo="Ingreso por día"
        detalle="De las ventas cargadas, sin contar las anuladas"
        alto={200}
      >
        <SerieBarras datos={porDia} />
      </ChartCard>

      <ChartCard titulo="Cómo quedaron" detalle="Número de ventas en cada estado" alto={200}>
        <SerieAnillo datos={porEstado} />
      </ChartCard>

      <ChartCard
        titulo="Lo que más deja"
        detalle="Por importe, no por unidades: cinco primeros"
        alto={200}
      >
        <SerieBarras datos={porProducto} />
      </ChartCard>
    </div>
  );
}
