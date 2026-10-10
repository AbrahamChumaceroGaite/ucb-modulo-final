'use client';

import type { DateRange } from 'react-day-picker';
import { aFechaLocal, aTextoDeFecha } from '@/shared/lib/fecha-local';
import { DateRangePicker } from '../../primitives/fields/date-picker';

/**
 * El filtro de intervalo de fechas de un listado, en sus dos estados.
 *
 * ## Apagado, que es como está en tres de las cuatro pantallas
 *
 * Las tablas `persona`, `producto` y `receta` **sí** tienen `fec_c` y `fec_u`
 * —están en `databasev4.sql`—, pero ni `PersonaResponse` ni `ProductoResponse`
 * ni `RecetaResponse` las exponen. No hay fecha que leer ni fecha que mandar.
 *
 * Las alternativas eran tres y dos son peores:
 *
 * 1. **No pintarlo.** Nadie sabría que el dato está a un campo de distancia
 *    del DTO, y la regla 8.14 —nada de UI que no hace nada— apunta a botones
 *    que engañan, no a un control apagado que se explica.
 * 2. **Inventar la fecha en el mock.** Filtraría de maravilla hasta el día que
 *    se apagara `USAR_MOCKS`. Es exactamente la mentira del «tipo» de producto.
 * 3. **Enseñarlo apagado con el motivo a la vista.** Es esta.
 *
 * ## Encendido, que es como está en ventas
 *
 * `VentaResponse.fechaVenta` es el **único** campo de fecha que el backend
 * expone en todo el proyecto. Ahí este control funciona, y por eso existe en
 * dos estados en vez de dos componentes: el día que los otros DTO expongan su
 * fecha, se les pasan las tres props y ya está.
 *
 * ## Las fechas se manejan como texto `AAAA-MM-DD`
 *
 * La conversión a `Date` y de vuelta está en `shared/lib/fecha-local.ts`, que
 * explica por qué nunca se pasa por UTC. Vivía aquí hasta que el formulario de
 * evaluación de lotes la necesitó también.
 */
const MOTIVO = 'El backend todavía no devuelve la fecha de alta';

/** El intervalo tal como viaja a la URL. No se exporta: solo lo usa la prop
    de abajo, y exportarlo lo dejaba como resto —lo cazó `audit-muertos`. */
type RangoDeFechas = { desde: string | null; hasta: string | null };

export function FiltroDeFecha({
  que,
  desde,
  hasta,
  onCambiar,
}: {
  /** De qué se filtraría la fecha, para el mensaje de cuando está apagado. */
  que: string;
  /** `AAAA-MM-DD`. Si falta `onCambiar`, el control sale apagado. */
  desde?: string;
  hasta?: string;
  onCambiar?: (rango: RangoDeFechas) => void;
}) {
  const encendido = typeof onCambiar === 'function';

  return (
    /* `shrink-0` y `whitespace-nowrap` no son adorno: esto vive dentro de la
       fila que se desplaza, donde nada debe partirse. Sin ellos, el navegador
       encogía este hueco hasta su mínimo y la frase caía en una columna de
       ocho renglones que estiraba la barra entera. */
    <span className="flex shrink-0 items-center gap-2 whitespace-nowrap">
      <DateRangePicker
        valor={encendido ? aRango(desde, hasta) : undefined}
        onCambiar={(rango) =>
          onCambiar?.({ desde: aTextoDeFecha(rango?.from), hasta: aTextoDeFecha(rango?.to) })
        }
        {...(encendido ? {} : { deshabilitado: true, motivo: `${MOTIVO} de ${que}` })}
      />

      {/* La explicación solo cabe con mucho ancho, y solo tiene sentido cuando
          el control está apagado. Por debajo basta el `title` del propio
          control, que dice lo mismo y no ocupa. */}
      {!encendido && (
        <span className="hidden whitespace-nowrap text-[0.6875rem] text-on-surface-variant xl:inline">
          {MOTIVO}
        </span>
      )}
    </span>
  );
}

function aRango(desde: string | undefined, hasta: string | undefined): DateRange | undefined {
  const from = aFechaLocal(desde);
  const to = aFechaLocal(hasta);

  // `DateRange` exige `from`. Un intervalo con solo «hasta» no existe para el
  // calendario, así que se le da el mismo día como inicio: enseña el mes
  // correcto y el filtro sigue acotando solo por «hasta», que es lo que hay
  // en la URL.
  if (!from && !to) return undefined;
  if (!from) return { from: to as Date, to };
  return { from, ...(to ? { to } : {}) };
}
