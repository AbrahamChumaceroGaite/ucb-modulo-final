import type { Paginado, ParamsListado } from '@/shared/api/paginated';
import type {
  ActualizarProducto,
  Categoria,
  CrearProducto,
  Producto,
  Unidad,
} from '../domain/producto.schema';
import type { CatalogoApi, ProductoApi } from './producto.puertos';

/**
 * La despensa de mentira, mientras no haya backend.
 *
 * **Las filas salen del Excel de poblado**, hoja «Manejo de Inventario», con
 * sus nombres, precios, stocks, unidades y vendibilidad reales. Traían también
 * una columna «tipo» (Producto / Insumo) que ya no está aquí: el backend no
 * tiene dónde guardarla, así que mantenerla en los datos falsos habría hecho
 * que la pantalla funcionara solo con mocks. Eso importa más de lo que
 * parece: «Kaffe en grano» con 1500 g y mínimo 500 desborda de otra manera que
 * un «Producto 1» con stock 10, y los precios de 0,17 Bs enseñan si el
 * formateo de moneda aguanta dos decimales pequeños.
 *
 * Mismo contrato que la implementación real: lista, pagina, busca, crea,
 * actualiza parcialmente y da de baja, con memoria mientras viva la pestaña y
 * 350 ms de retardo para que los esqueletos se vean.
 *
 * Se borra entero el día que exista el servidor, junto con `USAR_MOCKS`.
 */
const RETARDO_MS = 350;

const esperar = <T,>(valor: T): Promise<T> =>
  new Promise((resolver) => setTimeout(() => resolver(valor), RETARDO_MS));

// ─── Catálogos ───────────────────────────────────────────────────────────────
// Los ids imitan UUID para que nada dependa de que sean cortos.
const CATEGORIAS: Categoria[] = [
  { id: 'cat-cafes', nombre: 'Cafes', esBorrable: false, borrado: false },
  { id: 'cat-capuchinos', nombre: 'Capuchinos', esBorrable: false, borrado: false },
  { id: 'cat-masas', nombre: 'Masas', esBorrable: false, borrado: false },
  { id: 'cat-sandwiches', nombre: 'Sandwiches', esBorrable: false, borrado: false },
  { id: 'cat-gaseosas', nombre: 'Gaseosas', esBorrable: false, borrado: false },
  { id: 'cat-otros', nombre: 'Otros', esBorrable: true, borrado: false },
];

const UNIDADES: Unidad[] = [
  { id: 'uni-g', unidad: 'gramos', abreviatura: 'g', esBorrable: false, borrado: false },
  { id: 'uni-ml', unidad: 'mililitros', abreviatura: 'ml', esBorrable: false, borrado: false },
  { id: 'uni-u', unidad: 'unidades', abreviatura: 'U', esBorrable: false, borrado: false },
  { id: 'uni-kg', unidad: 'kilogramos', abreviatura: 'Kg', esBorrable: false, borrado: false },
  { id: 'uni-l', unidad: 'litros', abreviatura: 'L', esBorrable: false, borrado: false },
];

const porId = <T extends { id: string }>(lista: readonly T[], id: string) =>
  lista.find((fila) => fila.id === id) ?? null;

// ─── Productos ───────────────────────────────────────────────────────────────
type FilaCruda = [
  id: string,
  nombre: string,
  stock: number,
  precio: number,
  minimo: number,
  unidad: string,
  categoria: string,
  vendible: boolean,
  padre?: string,
];

/** Las 35 filas del Excel, en el mismo orden y con los mismos valores. */
const CRUDOS: FilaCruda[] = [
  ['pr-1', 'Kaffe en grano', 1500, 0.5, 500, 'uni-g', 'cat-cafes', true],
  ['pr-2', 'Kaffe Molido', 10000, 0.8, 1000, 'uni-g', 'cat-cafes', true],
  ['pr-3', 'Ñape Grande', 5, 1, 0, 'uni-u', 'cat-masas', true],
  ['pr-4', 'Galletas', 70, 2, 0, 'uni-u', 'cat-masas', true],
  ['pr-5', 'Sandwich Mixto', 15, 0.4, 0, 'uni-u', 'cat-sandwiches', true],
  ['pr-6', 'Sandwich Napolitano', 10, 0.2, 0, 'uni-u', 'cat-sandwiches', true],
  ['pr-7', 'Sandwich Capresse', 5, 0.17, 0, 'uni-u', 'cat-sandwiches', true],
  ['pr-8', 'Agua Sin Gas', 5, 0.45, 0, 'uni-u', 'cat-gaseosas', true],
  ['pr-9', 'Agua Con Gas', 5, 0.25, 0, 'uni-u', 'cat-gaseosas', true],
  ['pr-10', 'Te Frio', 10, 0.5, 0, 'uni-u', 'cat-gaseosas', true],
  ['pr-11', 'Frapuccino', 10, 0.8, 10, 'uni-u', 'cat-capuchinos', true],
  ['pr-12', 'Fralatte', 10, 1, 0, 'uni-u', 'cat-capuchinos', true],
  ['pr-13', 'Eis Kaffe', 10, 2, 0, 'uni-u', 'cat-cafes', true],
  ['pr-14', 'Affogato', 10, 0.4, 10, 'uni-u', 'cat-cafes', true],
  ['pr-15', 'Chokolatte', 10, 0.2, 5, 'uni-u', 'cat-capuchinos', true],
  ['pr-16', 'Café en grano', 50, 0.17, 5, 'uni-g', 'cat-cafes', true],
  ['pr-17', 'Café molido', 26, 0.45, 0, 'uni-g', 'cat-cafes', true],
  ['pr-18', 'Leche entera', 5000, 0.25, 2000, 'uni-ml', 'cat-otros', false],
  ['pr-19', 'Leche descremada', 24, 2, 0, 'uni-ml', 'cat-otros', true],
  ['pr-20', 'Chocolate en polvo', 43, 0.4, 0, 'uni-g', 'cat-otros', true],
  ['pr-21', 'Cocoa', 11, 0.2, 0, 'uni-g', 'cat-otros', true],
  ['pr-22', 'Canela', 82, 0.7, 0, 'uni-g', 'cat-otros', true],
  ['pr-23', 'Clavo de olor', 54, 0.45, 0, 'uni-g', 'cat-otros', true],
  ['pr-24', 'Azúcar blanca', 55, 0.25, 0, 'uni-g', 'cat-otros', true],
  ['pr-25', 'Azúcar morena', 52, 0.5, 10, 'uni-g', 'cat-otros', true],
  ['pr-26', 'Miel', 23, 0.8, 0, 'uni-ml', 'cat-otros', true],
  ['pr-27', 'Pan de Molde', 76, 1, 0, 'uni-ml', 'cat-masas', true],
  ['pr-28', 'Mermelada', 34, 2, 10, 'uni-g', 'cat-otros', true],
  ['pr-29', 'Mantequilla', 23, 0.4, 0, 'uni-g', 'cat-otros', true],
  ['pr-30', 'Queso', 21, 0.2, 10, 'uni-g', 'cat-otros', true],
  ['pr-31', 'Jamon', 45, 0.17, 0, 'uni-g', 'cat-otros', true],
  ['pr-32', 'Harina', 67, 0.2, 0, 'uni-g', 'cat-masas', true],
  ['pr-33', 'Huevo', 58, 0.4, 10, 'uni-g', 'cat-otros', true],
  ['pr-34', 'Leche Pil', 0, 11, 0, 'uni-u', 'cat-otros', true, 'pr-18'],
  ['pr-35', 'Leche Prolac', 0, 11, 0, 'uni-u', 'cat-otros', true, 'pr-18'],
];

const armar = ([
  id,
  nombre,
  stock,
  precio,
  stockMinimo,
  unidad,
  categoria,
  vendible,
  padre,
]: FilaCruda): Producto => ({
  id,
  nombre,
  stock,
  precio,
  stockMinimo,
  vendible,
  unidadActual: porId(UNIDADES, unidad),
  categoria: porId(CATEGORIAS, categoria),
  idProductoPadre: padre ?? null,
  borrado: false,
});

let productos: Producto[] = CRUDOS.map(armar);

let siguiente = 100;
const nuevoId = () => `pr-${++siguiente}`;

/** Busca y pagina como lo haría el backend. Mismo contrato, otra fuente. */
function paginar(filas: readonly Producto[], params: ParamsListado): Paginado<Producto> {
  const busqueda = params.search?.trim().toLowerCase() ?? '';
  const encontradas = busqueda
    ? filas.filter((fila) =>
        `${fila.nombre} ${fila.categoria?.nombre ?? ''}`
          .toLowerCase()
          .includes(busqueda),
      )
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

/** Aplica el PATCH. Lo ausente no se toca; `''` en el padre es «ninguno». */
function conCambios(actual: Producto, cambios: ActualizarProducto): Producto {
  return {
    ...actual,
    ...(cambios.nombre !== undefined ? { nombre: cambios.nombre } : {}),
    ...(cambios.stock !== undefined ? { stock: cambios.stock } : {}),
    ...(cambios.precio !== undefined ? { precio: cambios.precio } : {}),
    ...(cambios.stockMinimo !== undefined ? { stockMinimo: cambios.stockMinimo } : {}),
    ...(cambios.vendible !== undefined ? { vendible: cambios.vendible } : {}),
    ...(cambios.idUnidadActual !== undefined
      ? { unidadActual: porId(UNIDADES, cambios.idUnidadActual) }
      : {}),
    ...(cambios.idCategoria !== undefined
      ? { categoria: porId(CATEGORIAS, cambios.idCategoria) }
      : {}),
    ...(cambios.idProductoPadre !== undefined
      ? { idProductoPadre: cambios.idProductoPadre === '' ? null : cambios.idProductoPadre }
      : {}),
  };
}

export const productoApiMock: ProductoApi = {
  listar: (params) => esperar(paginar(productos, params)),

  crear: (valores: CrearProducto) => {
    const producto = armar([
      nuevoId(),
      valores.nombre,
      valores.stock,
      valores.precio,
      valores.stockMinimo,
      valores.idUnidadActual,
      valores.idCategoria,
      valores.vendible,
      valores.idProductoPadre || undefined,
    ]);

    productos = [producto, ...productos];
    return esperar(producto);
  },

  actualizar: (id, cambios) => {
    const actual = productos.find((producto) => producto.id === id);
    if (!actual) throw new Error(`No existe el producto ${id}`);

    const actualizado = conCambios(actual, cambios);
    productos = productos.map((producto) => (producto.id === id ? actualizado : producto));
    return esperar(actualizado);
  },

  eliminar: (id) => {
    // Baja lógica, como el backend: `borrado = true`, la fila no desaparece.
    productos = productos.map((producto) =>
      producto.id === id ? { ...producto, borrado: true } : producto,
    );
    return esperar(undefined);
  },
};

export const catalogoApiMock: CatalogoApi = {
  categorias: () => esperar(CATEGORIAS),
  unidades: () => esperar(UNIDADES),
};
