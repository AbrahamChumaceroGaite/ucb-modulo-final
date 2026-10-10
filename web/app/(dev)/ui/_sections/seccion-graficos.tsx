'use client';

import { ChartCard, SerieAnillo, SerieArea, SerieBarras } from '@/shared/ui/patterns';
import { Tag } from '@/shared/ui/primitives';
import { Muestra, Seccion } from '../_components/showcase';
import { POR_CATEGORIA, POR_FRANJA, VENTAS_SEMANA } from '../_data/graficos';

/**
 * Gráficos.
 *
 * Las series toman su color de los tokens del tema, así que cambian con el
 * interruptor de claro/oscuro sin tocar nada. Auditamos un proyecto cuyos
 * gráficos usaban variables CSS inexistentes —`--p-purple-500` con 46 usos— y
 * media paleta no pintaba.
 */
export function SeccionGraficos() {
  return (
    <Seccion
      id="graficos"
      titulo="Gráficos"
      descripcion="Rejilla horizontal tenue, sin líneas verticales y sin marcas en los ejes. Lo que importa es la forma de la serie."
    >
      <Muestra titulo="Series" nota="Cambia el tema con el botón de arriba: los colores siguen al sistema." className="block">
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartCard
            titulo="Ventas de la semana"
            detalle="En bolivianos, por día"
            acciones={<Tag tono="success">+12% vs. semana pasada</Tag>}
          >
            <SerieArea datos={VENTAS_SEMANA} id="ventas-semana" />
          </ChartCard>

          <ChartCard titulo="Pedidos por franja" detalle="Hoy, de 7 a 19">
            <SerieBarras datos={POR_FRANJA} />
          </ChartCard>
        </div>
      </Muestra>

      <Muestra titulo="Reparto" nota="El anillo sirve para pocas partes; con más de cinco deja de leerse." className="block">
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartCard titulo="Ventas por categoría" detalle="Hoy" alto={240}>
            <SerieAnillo datos={POR_CATEGORIA} />
          </ChartCard>

          <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
            <h3 className="text-sm font-semibold text-on-surface">Lo mismo, en cifras</h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Un anillo se lee de un vistazo; la tabla se lee con precisión. Conviene tener las dos.
            </p>

            <dl className="mt-4 flex flex-col gap-2.5">
              {POR_CATEGORIA.map((categoria, indice) => (
                <div key={categoria.etiqueta} className="flex items-center gap-2.5">
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${
                      ['bg-primary', 'bg-secondary', 'bg-success', 'bg-warning'][indice]
                    }`}
                    aria-hidden
                  />
                  <dt className="flex-1 text-xs text-on-surface">{categoria.etiqueta}</dt>
                  <dd data-tabular className="text-xs font-medium text-on-surface">
                    {categoria.valor} Bs
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Muestra>
    </Seccion>
  );
}
