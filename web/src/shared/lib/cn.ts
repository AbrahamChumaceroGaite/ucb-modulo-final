import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Une clases resolviendo conflictos de Tailwind.
 *
 * Sin `twMerge`, pasar `className="p-4"` a un componente que ya trae `p-2` deja
 * las dos y gana la que el CSS ordene, que no es la que quien llama esperaba.
 */
export function cn(...valores: ClassValue[]): string {
  return twMerge(clsx(valores));
}
