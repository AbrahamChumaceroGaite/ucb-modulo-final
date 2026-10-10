import type { PasoTour } from '@/shared/lib/tour/use-tour';

/**
 * Recorrido guiado de la pantalla de personal.
 *
 * No existía: Productos tenía tour y Usuarios no, que es de las asimetrías
 * que peor se explican —la misma plantilla de listado, la misma barra, el
 * mismo panel, y una con ayuda y otra sin—.
 *
 * Los cuatro pasos son los de `producto.tour.ts`, en el mismo orden y con el
 * mismo sentido, más el que es propio de aquí: las dos colecciones. Lo que
 * cambia son las palabras; la estructura no, porque la pantalla tampoco.
 */
export const PASOS_TOUR_PERSONAL: readonly PasoTour[] = [
  {
    elemento: '[data-tour="coleccion-personal"]',
    titulo: 'Dos libretas, una pantalla',
    descripcion:
      'Las cuentas del equipo entran al panel; los clientes no tienen acceso, solo sus datos.',
    lado: 'bottom',
  },
  {
    elemento: '[data-tour="alta"]',
    titulo: 'Dar de alta',
    descripcion: 'Una cuenta nueva o un cliente nuevo, según la libreta que estés mirando.',
    lado: 'left',
  },
  {
    elemento: '[data-tour="filtros"]',
    titulo: 'Acotar la lista',
    descripcion:
      'Puedes marcar varios roles a la vez. Lo que elijas queda en la dirección, así que el enlace lleva a la misma lista.',
    lado: 'bottom',
  },
  {
    elemento: '[data-tour="vistas"]',
    titulo: 'Verlo de otra forma',
    descripcion: 'Tarjetas para mirar de un vistazo, tabla para comparar datos.',
    lado: 'bottom',
  },
  {
    elemento: '[data-tour="coleccion"]',
    titulo: 'La gente',
    descripcion:
      'Al pasar el cursor sobre una fila aparecen sus acciones: ver la ficha, editarla o darla de baja.',
    lado: 'top',
  },
];
