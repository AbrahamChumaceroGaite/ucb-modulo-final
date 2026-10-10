'use client';

import { Receipt, UserRound } from 'lucide-react';
import { Tag } from '@/shared/ui/primitives';
import { formatearCantidad, formatearFechaHora, formatearMoneda } from '@/shared/lib/format';
import { lineasVigentes, type Venta } from '../../domain/venta.schema';

/**
 * La ficha que se abre al pulsar una venta: el ticket.
 *
 * Va en el panel que **empuja**, igual que las otras tres: quien revisa una
 * venta suele querer comparar con la siguiente, y así la lista sigue ahí.
 *
 * ## El total no se recalcula
 *
 * Se pinta `venta.total`, el del servidor. Los subtotales de cada línea
 * también son los suyos (`detalle.subtotal`). Sumar aquí las líneas para
 * comprobar daría una segunda cifra que, si no cuadrara, habría que decidir
 * cuál enseñar — y la respuesta siempre sería «la del servidor», así que la
 * suma sobra.
 *
 * ## Los descuentos solo aparecen si los hay
 *
 * Una columna de ceros no informa de nada y le quita sitio a lo que sí
 * importa. Si ninguna línea tiene descuento, la columna no se pinta.
 */
export function VentaDetalle({
  venta,
  nombreDelCliente,
  nombreDelProducto,
}: {
  venta: Venta;
  /** Ya resuelto por la pantalla. La ficha no sale a buscar nada. */
  nombreDelCliente?: string;
  nombreDelProducto: (idProducto: string) => string;
}) {
  const lineas = lineasVigentes(venta);
  const hayDescuentos = lineas.some((linea) => linea.descuentoAplicado > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-on-surface">
          {formatearMoneda(venta.total)}
        </h3>
        {venta.estadoVenta && <Tag tono="secondary">{venta.estadoVenta.nombre}</Tag>}
        {venta.borrado && <Tag tono="neutral">Anulada</Tag>}
      </div>

      <div className="flex flex-col gap-1 text-xs text-on-surface-variant">
        <p className="flex items-center gap-2">
          <Receipt className="size-3.5" aria-hidden />
          {formatearFechaHora(venta.fechaVenta)}
        </p>
        <p className="flex items-center gap-2">
          <UserRound className="size-3.5" aria-hidden />
          {/* «Mostrador» y no un hueco: una venta sin cliente no es un dato
              que falte, es una venta sin cliente. */}
          {nombreDelCliente ?? 'Mostrador'}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h4 className="label-caps text-on-surface-variant">Qué se llevó</h4>

        <table className="w-full text-sm">
          <caption className="sr-only">Líneas de la venta</caption>
          <thead>
            <tr className="text-xs text-on-surface-variant">
              <th scope="col" className="pb-1 text-left font-medium">
                Producto
              </th>
              <th scope="col" className="pb-1 text-right font-medium">
                Cant.
              </th>
              {hayDescuentos && (
                <th scope="col" className="pb-1 text-right font-medium">
                  Dcto.
                </th>
              )}
              <th scope="col" className="pb-1 text-right font-medium">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((linea) => (
              <tr key={linea.id} className="border-t border-outline-variant/40">
                <td className="py-1 text-on-surface">
                  {nombreDelProducto(linea.idProducto)}
                  <span className="block text-xs text-on-surface-variant">
                    {formatearMoneda(linea.precioUnitario)} c/u
                  </span>
                </td>
                <td className="py-1 text-right tabular-nums text-on-surface-variant">
                  {formatearCantidad(linea.cantidad)}
                </td>
                {hayDescuentos && (
                  <td className="py-1 text-right tabular-nums text-on-surface-variant">
                    {linea.descuentoAplicado > 0
                      ? `−${formatearMoneda(linea.descuentoAplicado)}`
                      : '—'}
                  </td>
                )}
                <td className="py-1 text-right tabular-nums text-on-surface">
                  {formatearMoneda(linea.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-outline-variant">
              <th scope="row" colSpan={hayDescuentos ? 3 : 2} className="pt-2 text-left text-xs">
                Total
              </th>
              <td className="pt-2 text-right font-semibold tabular-nums text-on-surface">
                {formatearMoneda(venta.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
}
