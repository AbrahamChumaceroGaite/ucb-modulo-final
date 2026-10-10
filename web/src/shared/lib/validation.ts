import { z } from 'zod';

/**
 * Piezas de validación reutilizables, sin conocimiento de dominio.
 *
 * Se componen dentro de los esquemas de cada feature. Lo que sabe qué es un
 * producto no vive aquí.
 *
 * El mensaje viaja pegado a la regla: si el mínimo cambia de 2 a 3, el texto
 * cambia en la misma línea. En el proyecto auditado la regla decía «al menos 4
 * caracteres» y el 4 real estaba en otro archivo.
 */

/** Identificadores del backend: UUID en `string`, nunca número. */
export const id = z.uuid({ error: 'Identificador inválido' });

/** Texto obligatorio, recortado. Un nombre de dos espacios no pasa. */
export const textoRequerido = (minimo = 2, etiqueta = 'Este campo') =>
  z
    .string()
    .trim()
    .min(minimo, `${etiqueta} necesita al menos ${minimo} caracteres`);

export const correo = z.email({ error: 'El correo no tiene un formato válido' });

/** Contraseña: el backend exige 8; el mensaje lo dice con el mismo número. */
export const contrasena = z.string().min(8, 'La contraseña necesita al menos 8 caracteres');

/** Dinero. Nunca negativo, dos decimales como mucho. */
export const dinero = z
  .number({ error: 'Debe ser un número' })
  .nonnegative('No puede ser negativo')
  .refine((valor) => Number.isFinite(valor), 'Importe inválido');

/** Cantidad de inventario: admite decimales (2.5 kg). */
export const cantidad = z.number({ error: 'Debe ser un número' }).nonnegative('No puede ser negativa');

