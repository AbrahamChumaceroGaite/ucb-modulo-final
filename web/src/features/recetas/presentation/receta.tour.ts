import type { PasoTour } from '@/shared/lib/tour/use-tour';

/**
 * Recorrido guiado del recetario.
 *
 * Vive en la feature porque habla del dominio: `shared` aporta el motor del
 * tour, no su contenido. Los selectores son `data-tour`, un atributo puesto a
 * propósito para esto — enganchar el tour a clases de Tailwind lo rompería el
 * día que alguien cambie un margen.
 *
 * **Los cuatro pasos son los mismos que en Productos y Personal**, en el mismo
 * orden y con el mismo sentido: dar de alta, acotar, mirar de otra forma y
 * actuar sobre una fila. Cambian las palabras, porque cambia el dominio; no
 * cambia lo que se enseña. `audit-pantallas.mjs` lo comprueba y falla si una
 * pantalla se sale del guion.
 */
export const PASOS_TOUR_RECETAS: readonly PasoTour[] = [
  {
    elemento: '[data-tour="alta"]',
    titulo: 'Escribir una receta',
    descripcion: 'Qué produce, con qué ingredientes y en qué orden se hace.',
    lado: 'left',
  },
  {
    elemento: '[data-tour="filtros"]',
    titulo: 'Acotar la lista',
    descripcion:
      'Puedes marcar varios productos a la vez. Lo que elijas queda en la dirección, así que el enlace lleva a la misma lista.',
    lado: 'bottom',
  },
  {
    elemento: '[data-tour="vistas"]',
    titulo: 'Verlo de otra forma',
    descripcion: 'Tarjetas para mirar de un vistazo, tabla para comparar.',
    lado: 'bottom',
  },
  {
    elemento: '[data-tour="coleccion"]',
    titulo: 'El recetario',
    descripcion:
      'El estado dice para cuántas tandas da con lo que hay en la despensa. Al pasar el cursor aparecen las acciones.',
    lado: 'top',
  },
];
