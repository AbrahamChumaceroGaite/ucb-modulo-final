import type { PasoTour } from '@/shared/lib/tour/use-tour';

/**
 * Recorrido guiado de vencimientos.
 *
 * **Los cuatro pasos son los mismos que en las demás pantallas de lista**, en
 * el mismo orden: dar de alta, acotar, mirar de otra forma y actuar sobre una
 * fila. `audit-pantallas.mjs` lo comprueba. Cambian las palabras porque aquí
 * «dar de alta» es pedirle al modelo que juzgue un lote.
 */
export const PASOS_TOUR_VENCIMIENTOS: readonly PasoTour[] = [
  {
    elemento: '[data-tour="alta"]',
    titulo: 'Evaluar un lote',
    descripcion:
      'Cuánto se compró, cuánto queda, cuándo vence y cómo se está gastando. El modelo responde si conviene usarlo primero.',
    lado: 'left',
  },
  {
    elemento: '[data-tour="filtros"]',
    titulo: 'Acotar la lista',
    descripcion:
      'Por nivel de riesgo, categoría o fecha de vencimiento. Lo que elijas queda en la dirección, así que el enlace lleva a la misma lista.',
    lado: 'bottom',
  },
  {
    elemento: '[data-tour="vistas"]',
    titulo: 'Verlo de otra forma',
    descripcion: 'Tarjetas para mirar de un vistazo, tabla para comparar con la regla simple.',
    lado: 'bottom',
  },
  {
    elemento: '[data-tour="coleccion"]',
    titulo: 'Los lotes, del más urgente al menos',
    descripcion:
      'Arriba lo que más riesgo tiene. Si el modelo y la regla simple no coinciden, la tarjeta lo dice abajo: ahí conviene mirar.',
    lado: 'top',
  },
];
