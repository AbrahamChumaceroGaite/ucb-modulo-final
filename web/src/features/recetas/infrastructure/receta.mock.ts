import type { Paginado, ParamsListado } from '@/shared/api/paginated';
import type { ActualizarReceta, CrearReceta, Receta } from '../domain/receta.schema';
import type { ReferenciaDeProducto } from '../domain/referencia-producto.schema';
import type { ProductoDeRecetaApi, RecetaApi } from './receta.puertos';

/**
 * El recetario de mentira, mientras no haya backend.
 *
 * ## De dónde salen estos datos, dicho sin adornos
 *
 * **Las recetas están inventadas.** El Excel de poblado trae la hoja de
 * inventario, no un recetario, así que estas cinco las escribí yo a partir de
 * lo que hay en la despensa. Lo digo aquí porque la vez anterior documenté
 * como «leído del backend» algo que me había inventado, y la consecuencia fue
 * una pantalla entera construida sobre un campo inexistente.
 *
 * **Los ids de producto sí son los del Excel** (`pr-16` es «Café en grano»,
 * `pr-18` «Leche entera»…), a propósito: son los mismos que usa el mock de
 * productos, así que la pantalla resuelve nombres de verdad y el cálculo de
 * tandas da cifras creíbles en vez de ceros.
 *
 * La estructura, en cambio, **sí es la del contrato**: un paso guarda su orden
 * en un campo llamado `pasos`, los ingredientes traen su propio `id`, y el
 * borrado es lógico — las tres cosas leídas de los DTO.
 *
 * Se borra entero el día que exista el servidor, junto con `USAR_MOCKS`.
 */
const RETARDO_MS = 350;

const esperar = <T,>(valor: T): Promise<T> =>
  new Promise((resolver) => setTimeout(() => resolver(valor), RETARDO_MS));

/**
 * Los productos que una receta puede elegir.
 *
 * Es un recorte del mock de productos, **copiado a mano y no importado**: una
 * feature no importa otra. Que se parezcan es lo que hace creíble la demo; que
 * estén separados es lo que impide que la pantalla de recetas deje de
 * funcionar porque alguien tocó la de productos.
 */
const PRODUCTOS: ReferenciaDeProducto[] = [
  { id: 'pr-1', nombre: 'Kaffe en grano', stock: 1500, unidadActual: { abreviatura: 'g' } },
  { id: 'pr-2', nombre: 'Kaffe Molido', stock: 10000, unidadActual: { abreviatura: 'g' } },
  { id: 'pr-5', nombre: 'Sandwich Mixto', stock: 15, unidadActual: { abreviatura: 'U' } },
  { id: 'pr-11', nombre: 'Frapuccino', stock: 10, unidadActual: { abreviatura: 'U' } },
  { id: 'pr-12', nombre: 'Fralatte', stock: 10, unidadActual: { abreviatura: 'U' } },
  { id: 'pr-13', nombre: 'Eis Kaffe', stock: 10, unidadActual: { abreviatura: 'U' } },
  { id: 'pr-14', nombre: 'Affogato', stock: 10, unidadActual: { abreviatura: 'U' } },
  { id: 'pr-16', nombre: 'Café en grano', stock: 50, unidadActual: { abreviatura: 'g' } },
  { id: 'pr-17', nombre: 'Café molido', stock: 26, unidadActual: { abreviatura: 'g' } },
  { id: 'pr-18', nombre: 'Leche entera', stock: 5000, unidadActual: { abreviatura: 'ml' } },
  { id: 'pr-20', nombre: 'Chocolate en polvo', stock: 43, unidadActual: { abreviatura: 'g' } },
  { id: 'pr-22', nombre: 'Canela', stock: 82, unidadActual: { abreviatura: 'g' } },
  { id: 'pr-24', nombre: 'Azúcar blanca', stock: 55, unidadActual: { abreviatura: 'g' } },
  { id: 'pr-26', nombre: 'Miel', stock: 23, unidadActual: { abreviatura: 'ml' } },
  { id: 'pr-27', nombre: 'Pan de Molde', stock: 76, unidadActual: { abreviatura: 'ml' } },
  { id: 'pr-29', nombre: 'Mantequilla', stock: 23, unidadActual: { abreviatura: 'g' } },
  { id: 'pr-30', nombre: 'Queso', stock: 21, unidadActual: { abreviatura: 'g' } },
  { id: 'pr-31', nombre: 'Jamon', stock: 45, unidadActual: { abreviatura: 'g' } },
];

type Cruda = {
  id: string;
  titulo: string;
  cantidad: number;
  obtiene: string;
  ingredientes: [producto: string, cantidad: number][];
  pasos: string[];
  borrado?: boolean;
};

const CRUDAS: Cruda[] = [
  {
    id: 'rc-1',
    titulo: 'Frapuccino de la casa',
    cantidad: 1,
    obtiene: 'pr-11',
    ingredientes: [
      ['pr-17', 18],
      ['pr-18', 150],
      ['pr-24', 10],
    ],
    pasos: [
      'Extraer un espresso doble y dejarlo templar.',
      'Batir con la leche fría y el azúcar hasta que espume.',
      'Servir en vaso alto con hielo.',
    ],
  },
  {
    id: 'rc-2',
    titulo: 'Fralatte',
    cantidad: 1,
    obtiene: 'pr-12',
    ingredientes: [
      ['pr-16', 20],
      ['pr-18', 200],
    ],
    pasos: ['Moler el café grueso.', 'Vaporizar la leche a 60 °C.', 'Verter y servir.'],
  },
  {
    id: 'rc-3',
    titulo: 'Eis Kaffe',
    cantidad: 2,
    obtiene: 'pr-13',
    ingredientes: [
      ['pr-17', 30],
      ['pr-18', 300],
      ['pr-20', 15],
    ],
    pasos: [
      'Preparar el café y enfriarlo del todo.',
      'Mezclar con la leche y el chocolate.',
      'Repartir en dos vasos.',
    ],
  },
  {
    id: 'rc-4',
    titulo: 'Sandwich mixto',
    cantidad: 1,
    obtiene: 'pr-5',
    ingredientes: [
      ['pr-27', 2],
      ['pr-30', 40],
      ['pr-31', 40],
      ['pr-29', 10],
    ],
    pasos: ['Untar el pan.', 'Montar jamón y queso.', 'Planchar tres minutos por lado.'],
  },
  {
    // Una receta dada de baja: el estado se ve en la lista y no desaparece.
    id: 'rc-5',
    titulo: 'Affogato de temporada',
    cantidad: 1,
    obtiene: 'pr-14',
    ingredientes: [
      ['pr-16', 15],
      ['pr-26', 20],
    ],
    pasos: ['Servir el helado.', 'Verter el espresso encima.'],
    borrado: true,
  },
];

const armar = (cruda: Cruda): Receta => ({
  id: cruda.id,
  titulo: cruda.titulo,
  cantidad: cruda.cantidad,
  idProductoObtenido: cruda.obtiene,
  ingredientes: cruda.ingredientes.map(([idProducto, cantidad], indice) => ({
    id: `${cruda.id}-ing-${indice + 1}`,
    idProducto,
    cantidad,
    borrado: false,
  })),
  // `pasos` es el número de orden, así se llama en `PasoRecetaResponse`.
  pasos: cruda.pasos.map((descripcion, indice) => ({
    id: `${cruda.id}-paso-${indice + 1}`,
    pasos: indice + 1,
    descripcion,
    borrado: false,
  })),
  borrado: cruda.borrado ?? false,
});

let recetas: Receta[] = CRUDAS.map(armar);

let siguiente = 100;
const nuevoId = () => `rc-${++siguiente}`;

/** Busca y pagina como lo haría el backend. Mismo contrato, otra fuente. */
function paginar(filas: readonly Receta[], params: ParamsListado): Paginado<Receta> {
  const busqueda = params.search?.trim().toLowerCase() ?? '';
  const encontradas = busqueda
    ? filas.filter((fila) => fila.titulo.toLowerCase().includes(busqueda))
    : filas;

  const skip = params.skip ?? 0;
  const limit = params.limit ?? 10;

  return {
    data: encontradas.slice(skip, skip + limit),
    skip,
    limit,
    total: encontradas.length,
    hasMore: skip + limit < encontradas.length,
  };
}

/** Aplica la actualización. Lo ausente no se toca; una lista llega entera. */
function conCambios(actual: Receta, cambios: ActualizarReceta): Receta {
  return {
    ...actual,
    ...(cambios.titulo !== undefined ? { titulo: cambios.titulo } : {}),
    ...(cambios.cantidad !== undefined ? { cantidad: cambios.cantidad } : {}),
    ...(cambios.idProductoObtenido !== undefined
      ? { idProductoObtenido: cambios.idProductoObtenido }
      : {}),
    ...(cambios.ingredientes !== undefined
      ? {
          ingredientes: cambios.ingredientes.map((ingrediente, indice) => ({
            id: `${actual.id}-ing-${indice + 1}`,
            idProducto: ingrediente.idProducto,
            cantidad: ingrediente.cantidad,
            borrado: false,
          })),
        }
      : {}),
    ...(cambios.pasos !== undefined
      ? {
          pasos: cambios.pasos.map((paso, indice) => ({
            id: `${actual.id}-paso-${indice + 1}`,
            pasos: indice + 1,
            descripcion: paso.descripcion,
            borrado: false,
          })),
        }
      : {}),
  };
}

export const recetaApiMock: RecetaApi = {
  listar: (params) => esperar(paginar(recetas, params)),

  crear: (valores: CrearReceta) => {
    const receta = armar({
      id: nuevoId(),
      titulo: valores.titulo,
      cantidad: valores.cantidad,
      obtiene: valores.idProductoObtenido,
      ingredientes: valores.ingredientes.map((uno) => [uno.idProducto, uno.cantidad]),
      pasos: valores.pasos.map((uno) => uno.descripcion),
    });

    recetas = [receta, ...recetas];
    return esperar(receta);
  },

  actualizar: (id, cambios) => {
    const actual = recetas.find((receta) => receta.id === id);
    if (!actual) throw new Error(`No existe la receta ${id}`);

    const actualizada = conCambios(actual, cambios);
    recetas = recetas.map((receta) => (receta.id === id ? actualizada : receta));
    return esperar(actualizada);
  },

  eliminar: (id) => {
    // Baja lógica, como el backend: `borrado = true`, la fila no desaparece.
    recetas = recetas.map((receta) => (receta.id === id ? { ...receta, borrado: true } : receta));
    return esperar(undefined);
  },
};

export const productoDeRecetaApiMock: ProductoDeRecetaApi = {
  listar: () => esperar(PRODUCTOS),
};
