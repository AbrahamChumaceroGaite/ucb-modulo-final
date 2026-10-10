import { z } from 'zod';
import { cantidad, dinero, textoRequerido } from '@/shared/lib/validation';

/**
 * El contrato del formulario de ejemplo del catálogo.
 *
 * Vive en su propio archivo por la misma razón que en una feature vive en
 * `domain/*.schema.ts`: es una declaración de qué se acepta, no una vista y no
 * datos. El `.tsx` de al lado solo pinta los campos.
 *
 * Las piezas —`textoRequerido`, `dinero`, `cantidad`— salen de
 * `shared/lib/validation`: el mensaje viaja pegado a la regla y no se reescribe
 * en cada formulario.
 */
export const esquemaInsumo = z.object({
  nombre: textoRequerido(2, 'El nombre'),
  categoria: z.string().min(1, 'Elige una categoría'),
  precio: dinero,
  unidad: z.string().min(1, 'Elige una unidad'),
  stock: cantidad,
  minimo: cantidad,
  vendible: z.boolean(),
  notas: z.string().max(280, 'Máximo 280 caracteres').optional(),
});

export type ValoresInsumo = z.infer<typeof esquemaInsumo>;

export const INSUMO_VACIO: ValoresInsumo = {
  nombre: '',
  categoria: '',
  precio: 0,
  unidad: '',
  stock: 0,
  minimo: 0,
  vendible: true,
  notas: '',
};
