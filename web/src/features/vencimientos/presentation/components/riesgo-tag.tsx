'use client';

import { Tag } from '@/shared/ui/primitives';
import { textoDeRiesgo, TONO_POR_NIVEL } from '../../domain/evaluacion.lectura';
import type { Evaluacion } from '../../domain/evaluacion.schema';

/**
 * El nivel de riesgo con su probabilidad: «Usar primero · 74%».
 *
 * Lo pintan la tabla y la ficha; la tarjeta dice lo mismo en su línea de
 * estado, que es donde `<EntityCard>` pone el estado de todas las tarjetas. El
 * texto y el tono vienen del dominio, así que las tres dicen lo mismo con el
 * mismo color (regla 8.10).
 */
export function RiesgoTag({ evaluacion }: { evaluacion: Evaluacion }) {
  return (
    <Tag tono={TONO_POR_NIVEL[evaluacion.nivel]}>{textoDeRiesgo(evaluacion)}</Tag>
  );
}
