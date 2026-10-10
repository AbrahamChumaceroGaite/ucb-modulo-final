/**
 * Rutas tipadas. Ninguna pantalla escribe una URL a mano.
 *
 * Renombrar una ruta debe ser un error de compilación, no un enlace roto que
 * alguien descubre en producción.
 */
export const RUTAS = {
  landing: '/',
  panel: {
    productos: '/productos',
    inventario: '/inventario',
    recetas: '/recetas',
    ventas: '/ventas',
    caja: '/caja',
    usuarios: '/usuarios',
  },
  demoUi: '/ui',
} as const;

/**
 * Entradas del menú flotante. El orden es el orden en que se pintan.
 *
 * El escaparate **no está aquí**: `/ui` devuelve 404 en producción, así que
 * tenerlo en el menú era poner un enlace roto en la barra principal de todo el
 * mundo. Lo añade `BottomNav` solo en desarrollo, que es donde existe.
 */
export const NAVEGACION = [
  { href: RUTAS.panel.productos, etiqueta: 'Productos', icono: 'package' },
  { href: RUTAS.panel.inventario, etiqueta: 'Inventario', icono: 'boxes' },
  { href: RUTAS.panel.recetas, etiqueta: 'Recetas', icono: 'recipe' },
  { href: RUTAS.panel.caja, etiqueta: 'Caja', icono: 'cash' },
  { href: RUTAS.panel.usuarios, etiqueta: 'Usuarios', icono: 'users' },
] as const;

/** Solo en desarrollo: el catálogo del sistema de diseño. */
export const ENTRADA_CATALOGO = {
  href: RUTAS.demoUi,
  etiqueta: 'Diseño',
  icono: 'palette',
} as const;

/**
 * La acción del centro del menú: registrar una venta.
 *
 * Es la única cosa que alguien hace veinte veces por turno, así que no comparte
 * sitio con la navegación: va en el medio, redonda y en color de marca, donde
 * el pulgar cae solo.
 */
export const ACCION_CENTRAL = {
  href: RUTAS.panel.ventas,
  etiqueta: 'Nueva venta',
} as const;
