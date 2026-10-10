'use client';

import { useAccionSobreColeccion } from '@/shared/api/coleccion';
import { useSesionActual } from '@/shared/lib/sesion-actual';
import { ventaApi } from '../infrastructure/venta.api';
import { ventaKeys } from '../infrastructure/venta.keys';
import type { CrearVenta } from '../domain/venta.schema';
import { formatearMoneda } from '@/shared/lib/format';

/**
 * Registro de una venta.
 *
 * **El vendedor lo pone la sesión, no el formulario.** `CrearVentaRequest`
 * exige `idUsuario`, y preguntarlo en un desplegable dejaría registrar ventas
 * a nombre de otro además de pedir un dato que el sistema ya sabe. Por eso
 * este caso de uso lee la sesión y el puerto lo recibe aparte.
 *
 * El aviso dice el total **que devolvió el servidor**, no el que sumó el
 * formulario: si los dos no coincidieran, lo que se cobró es lo del servidor.
 */
export function useCreateVenta() {
  const { usuarioId } = useSesionActual();

  return useAccionSobreColeccion({
    ejecutar: (dto: CrearVenta) => ventaApi.crear(dto, usuarioId),
    invalidar: [ventaKeys.listas()],
    exito: (venta) => `Venta registrada por ${formatearMoneda(venta.total)}`,
  });
}
