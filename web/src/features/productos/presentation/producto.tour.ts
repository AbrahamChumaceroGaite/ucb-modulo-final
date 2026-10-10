import type { PasoTour } from '@/shared/lib/tour/use-tour';

/**
 * Recorrido guiado de la pantalla de productos.
 *
 * Vive en la feature porque habla del dominio: `shared` aporta el motor del
 * tour, no su contenido. Los selectores son `data-tour`, un atributo puesto a
 * propósito para esto — enganchar el tour a clases de Tailwind lo rompería el
 * día que alguien cambie un margen.
 *
 * **Los cuatro pasos son los mismos que los de Personal**, en el mismo orden y
 * con el mismo sentido: dar de alta, acotar, mirar de otra forma y actuar
 * sobre una fila. Cambian las palabras, porque cambia el dominio; no cambia lo
 * que se enseña. Dos recorridos con distinta estructura enseñarían que las dos
 * pantallas funcionan distinto, y no es verdad.
 */
export const PASOS_TOUR_PRODUCTOS: readonly PasoTour[] = [
  {
    elemento: '[data-tour="alta"]',
    titulo: 'Añadir a la despensa',
    descripcion: 'Aquí se da de alta lo que entra por la puerta: café, leche, vasos.',
    lado: 'left',
  },
  {
    elemento: '[data-tour="filtros"]',
    titulo: 'Acotar la lista',
    descripcion:
      'Puedes marcar varias categorías a la vez. Lo que elijas queda en la dirección, así que el enlace lleva a la misma lista.',
    lado: 'bottom',
  },
  {
    elemento: '[data-tour="vistas"]',
    titulo: 'Verlo de otra forma',
    descripcion: 'Tarjetas para mirar de un vistazo, tabla para comparar cifras.',
    lado: 'bottom',
  },
  {
    elemento: '[data-tour="coleccion"]',
    titulo: 'Lo que hay',
    descripcion:
      'El estado dice qué hay que reponer. Al pasar el cursor sobre una fila aparecen sus acciones.',
    lado: 'top',
  },
];
