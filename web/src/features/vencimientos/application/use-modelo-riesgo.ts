'use client';

import { useQuery } from '@tanstack/react-query';
import { modeloRiesgoApi } from '../infrastructure/vencimiento.api';
import { modeloRiesgoKeys } from '../infrastructure/vencimiento.keys';

/**
 * La ficha del modelo: catálogo de insumos, umbral y métricas de prueba.
 *
 * No cambia mientras el servicio está arriba —el modelo se carga una vez al
 * arrancar—, así que no se vuelve a pedir al volver a la pestaña.
 */
export function useModeloRiesgo() {
  return useQuery({
    queryKey: modeloRiesgoKeys.ficha(),
    queryFn: () => modeloRiesgoApi.obtener(),
    staleTime: Infinity,
  });
}
