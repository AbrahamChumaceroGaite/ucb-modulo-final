import { ConciergeBell, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { Perfil } from '../../domain/perfil';

/**
 * Qué dibujo lleva cada perfil.
 *
 * Está aquí y no en `perfil.ts` porque el dominio describe una regla de
 * negocio y no debe saber que existe lucide ni que hay una pantalla. Y está
 * fuera del `.tsx` porque es una tabla de datos, no una parte del formulario.
 */
export const ICONO_POR_PERFIL: Record<Perfil, LucideIcon> = {
  administrador: ShieldCheck,
  operador: ConciergeBell,
};
