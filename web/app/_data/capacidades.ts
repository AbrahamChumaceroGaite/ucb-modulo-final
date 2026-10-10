/**
 * Lo que la portada promete que el producto hace.
 *
 * Es contenido, no interfaz: vive fuera de la página para que cambiarlo no
 * obligue a tocar el archivo que decide la maquetación.
 */

import { Coffee, Croissant, Package } from 'lucide-react';

export const CAPACIDADES = [
  {
    Icono: Package,
    titulo: 'Insumos',
    detalle: 'Cuánto queda de café, leche y vasos.',
  },
  {
    Icono: Croissant,
    titulo: 'Carta',
    detalle: 'Precios y qué se puede vender hoy.',
  },
  {
    Icono: Coffee,
    titulo: 'Equipo',
    detalle: 'Quién entra, quién cierra y con qué permisos.',
  },
] as const;
