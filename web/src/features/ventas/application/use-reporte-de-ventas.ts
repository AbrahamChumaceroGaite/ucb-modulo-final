'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { descargarTexto } from '@/shared/lib/descargar';
import { mensajeDe } from '@/shared/api/api-error';
import { LIMITE_POR_DEFECTO } from '@/shared/api/paginated';
import { ventaApi } from '../infrastructure/venta.api';
import { filtrarVentas, type FiltrosDeVenta } from '../domain/venta.filtros';
import { aCsv, nombreDelReporte, type ResolverNombre } from '../domain/venta.reporte';
import type { Venta } from '../domain/venta.schema';

/**
 * Descargar el libro de ventas como CSV.
 *
 * ## Por qué esto tarda de verdad
 *
 * Porque **no exporta la página que se está viendo: recorre todas**. La
 * pantalla filtra sobre la página cargada —`ObtenerVentasRequest` solo acepta
 * `skip`, `limit` y `search`—, así que un reporte de lo visible sería un
 * reporte de diez filas. Aquí se piden las páginas una tras otra y se aplica
 * **el mismo filtro** al total.
 *
 * Eso hace que el reporte sea más completo que la pantalla, y que la espera
 * sea real: con varios cientos de ventas son varias peticiones. Por eso el
 * botón se queda ocupado y hay un aviso — no es decoración, es el tiempo que
 * tarda.
 *
 * Si el trabajo fuera instantáneo, poner un retardo para que se vea el aviso
 * sería teatro. No hace falta: el trabajo existe.
 *
 * ## Por qué no es `useMutation`
 *
 * Porque no muta nada ni tiene caché que invalidar. `useAccionSobreColeccion`
 * es para escribir en una colección; esto lee muchas páginas y produce un
 * archivo. Meterlo ahí obligaría a inventar una invalidación vacía.
 *
 * ## Cómo se evitan las descargas repetidas
 *
 * `preparando` cierra la puerta en la primera línea de la función, antes de
 * cualquier `await`. El botón además queda deshabilitado —`cargando` lo hace—,
 * pero eso solo tapa el clic: alguien con el teclado, o un doble clic muy
 * rápido antes del primer render, entraría igual. La guardia de verdad es
 * esta, y por eso está aquí y no en el componente.
 */
const PAGINAS_MAXIMAS = 200;

export function useReporteDeVentas({
  filtros,
  busqueda,
  nombreDelCliente,
}: {
  filtros: FiltrosDeVenta;
  busqueda: string;
  nombreDelCliente: ResolverNombre;
}) {
  const [preparando, setPreparando] = useState(false);

  const descargar = async () => {
    if (preparando) return;
    setPreparando(true);

    const aviso = toast.loading('Preparando el reporte…');

    try {
      const todas = await traerTodas(busqueda);
      const filas = filtrarVentas(todas, filtros);

      if (filas.length === 0) {
        toast.error('No hay ventas que exportar con estos filtros', { id: aviso });
        return;
      }

      descargarTexto(nombreDelReporte(new Date()), aCsv(filas, nombreDelCliente), 'text/csv');
      toast.success(`Reporte listo: ${filas.length} venta${filas.length === 1 ? '' : 's'}`, {
        id: aviso,
      });
    } catch (error) {
      // El mismo traductor de errores que usa el resto de la aplicación: quien
      // lee el aviso no tiene por qué ver un `TypeError`.
      toast.error(mensajeDe(error), { id: aviso });
    } finally {
      setPreparando(false);
    }
  };

  return { preparando, descargar };
}

/**
 * Todas las páginas, una tras otra.
 *
 * En serie y no en paralelo: no se sabe cuántas hay hasta que responde la
 * primera, y disparar cien peticiones a la vez contra el servidor de una
 * cafetería no ayuda a nadie.
 *
 * El tope de páginas es una red de seguridad, no un límite de producto: si el
 * servidor devolviera siempre `hasMore: true` —un fallo suyo—, esto giraría
 * para siempre y el navegador se quedaría sin memoria. Con él, el reporte sale
 * incompleto y se nota; sin él, no sale nada y nadie sabe por qué.
 */
async function traerTodas(busqueda: string): Promise<Venta[]> {
  const todas: Venta[] = [];
  let skip = 0;

  for (let pagina = 0; pagina < PAGINAS_MAXIMAS; pagina += 1) {
    const respuesta = await ventaApi.listar({
      skip,
      limit: LIMITE_POR_DEFECTO,
      ...(busqueda ? { search: busqueda } : {}),
    });

    todas.push(...respuesta.data);
    if (!respuesta.hasMore || respuesta.data.length === 0) break;
    skip += respuesta.limit;
  }

  return todas;
}
