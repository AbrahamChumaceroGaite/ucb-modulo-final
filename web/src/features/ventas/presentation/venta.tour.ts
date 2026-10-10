import type { PasoTour } from '@/shared/lib/tour/use-tour';

/**
 * Recorrido guiado del libro de ventas.
 *
 * Vive en la feature porque habla del dominio: `shared` aporta el motor del
 * tour, no su contenido. Los selectores son `data-tour`, un atributo puesto a
 * propósito para esto — enganchar el tour a clases de Tailwind lo rompería el
 * día que alguien cambie un margen.
 *
 * **Los cuatro pasos son los mismos que en las otras tres pantallas**, en el
 * mismo orden y con el mismo sentido. `audit-pantallas.mjs` lo comprueba y
 * falla si esta se sale del guion.
 */
export const PASOS_TOUR_VENTAS: readonly PasoTour[] = [
  {
    elemento: '[data-tour="alta"]',
    titulo: 'Cobrar',
    descripcion: 'Se eligen los productos, la cantidad y el estado en que queda la venta.',
    lado: 'left',
  },
  {
    elemento: '[data-tour="filtros"]',
    titulo: 'Acotar la lista',
    descripcion:
      'Aquí el filtro de fecha sí funciona: es el único dato de fecha que el backend devuelve. Lo que elijas queda en la dirección.',
    lado: 'bottom',
  },
  {
    elemento: '[data-tour="vistas"]',
    titulo: 'Verlo de otra forma',
    descripcion: 'Tarjetas para mirar de un vistazo, tabla para cuadrar cifras.',
    lado: 'bottom',
  },
  {
    elemento: '[data-tour="coleccion"]',
    titulo: 'Lo vendido',
    descripcion:
      'Arriba a la derecha está la suma de lo que estás mirando. Al pasar el cursor sobre una fila aparecen sus acciones.',
    lado: 'top',
  },
];
