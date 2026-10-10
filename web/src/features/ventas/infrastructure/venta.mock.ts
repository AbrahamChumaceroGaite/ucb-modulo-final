import type { Paginado, ParamsListado } from '@/shared/api/paginated';
import type {
  ActualizarVenta,
  CrearVenta,
  DetalleVenta,
  EstadoVenta,
  Venta,
} from '../domain/venta.schema';
import { subtotalDeLinea } from '../domain/venta.schema';
import type { ClienteDeVenta, ProductoDeVenta } from '../domain/referencias.schema';
import type { CatalogoDeVentaApi, VentaApi } from './venta.puertos';

/**
 * El libro de ventas de mentira, mientras no haya backend.
 *
 * ## De dónde salen estos datos, dicho sin adornos
 *
 * **Las ventas están inventadas.** El Excel de poblado trae inventario, no un
 * histórico de caja. Lo que **no** está inventado es la forma: el servidor
 * calcula `total` y `subtotal`, la fecha es un `LocalDateTime` sin zona, el
 * cliente puede faltar y el borrado es lógico — las cuatro cosas leídas de los
 * DTO y de `databasev4.sql`.
 *
 * Los ids de producto y de cliente son los mismos que usan los mocks de las
 * otras features (`pr-*`, `c-*`), a propósito: así los nombres se resuelven de
 * verdad en pantalla.
 *
 * **Los estados de venta también son inventados.** `estado_venta` es una tabla
 * sin datos de siembra en el SQL, así que «Pagada», «Pendiente» y «Anulada»
 * son una suposición razonable, no un dato. Si el negocio usa otros, cambian
 * aquí y el resto del código no se entera: la pantalla nunca compara contra
 * estos nombres.
 *
 * Se borra entero el día que exista el servidor, junto con `USAR_MOCKS`.
 */
const RETARDO_MS = 350;

const esperar = <T,>(valor: T): Promise<T> =>
  new Promise((resolver) => setTimeout(() => resolver(valor), RETARDO_MS));

const ESTADOS: EstadoVenta[] = [
  { id: 'ev-pagada', nombre: 'Pagada', borrado: false },
  { id: 'ev-pendiente', nombre: 'Pendiente de cobro', borrado: false },
  { id: 'ev-anulada', nombre: 'Anulada', borrado: false },
];

/** Solo lo vendible: un insumo de despensa no se cobra en barra. */
const PRODUCTOS: ProductoDeVenta[] = [
  { id: 'pr-3', nombre: 'Ñape Grande', precio: 1, vendible: true },
  { id: 'pr-4', nombre: 'Galletas', precio: 2, vendible: true },
  { id: 'pr-5', nombre: 'Sandwich Mixto', precio: 0.4, vendible: true },
  { id: 'pr-6', nombre: 'Sandwich Napolitano', precio: 0.2, vendible: true },
  { id: 'pr-7', nombre: 'Sandwich Capresse', precio: 0.17, vendible: true },
  { id: 'pr-8', nombre: 'Agua Sin Gas', precio: 0.45, vendible: true },
  { id: 'pr-9', nombre: 'Agua Con Gas', precio: 0.25, vendible: true },
  { id: 'pr-10', nombre: 'Te Frio', precio: 0.5, vendible: true },
  { id: 'pr-11', nombre: 'Frapuccino', precio: 0.8, vendible: true },
  { id: 'pr-12', nombre: 'Fralatte', precio: 1, vendible: true },
  { id: 'pr-13', nombre: 'Eis Kaffe', precio: 2, vendible: true },
  { id: 'pr-14', nombre: 'Affogato', precio: 0.4, vendible: true },
  // Uno no vendible, para que se vea que la pantalla lo deja fuera.
  { id: 'pr-18', nombre: 'Leche entera', precio: 0.25, vendible: false },
];

const CLIENTES: ClienteDeVenta[] = [
  { id: 'c-1', persona: { nombres: 'Luis Fernando', apellidos: 'Chavez Rojas' }, borrado: false },
  {
    id: 'c-2',
    persona: { nombres: 'Sebastian Carlos', apellidos: 'Oliveira Pacheco' },
    borrado: false,
  },
  { id: 'c-3', persona: { nombres: 'Marta Elena', apellidos: 'Quiroga Vaca' }, borrado: false },
  { id: 'c-4', persona: { nombres: 'Diego Andres', apellidos: 'Suarez Lima' }, borrado: true },
];

type LineaCruda = [producto: string, precio: number, cantidad: number, descuento?: number];

type Cruda = {
  id: string;
  fecha: string;
  estado: string;
  cliente?: string;
  lineas: LineaCruda[];
  borrado?: boolean;
};

const CRUDAS: Cruda[] = [
  {
    id: 've-1',
    fecha: '2026-09-21T08:12:00',
    estado: 'ev-pagada',
    cliente: 'c-1',
    lineas: [
      ['pr-11', 0.8, 2],
      ['pr-4', 2, 1],
    ],
  },
  {
    // Sin cliente: venta de mostrador. `id_cliente` admite NULL.
    id: 've-2',
    fecha: '2026-09-21T09:40:00',
    estado: 'ev-pagada',
    lineas: [['pr-5', 0.4, 3]],
  },
  {
    id: 've-3',
    fecha: '2026-09-21T13:05:00',
    estado: 'ev-pendiente',
    cliente: 'c-2',
    lineas: [
      ['pr-13', 2, 2],
      ['pr-8', 0.45, 2, 0.2],
    ],
  },
  {
    // De noche: la que se iría de día si alguien construyera un `Date`.
    id: 've-4',
    fecha: '2026-09-21T22:40:00',
    estado: 'ev-pagada',
    lineas: [['pr-12', 1, 1]],
  },
  {
    id: 've-5',
    fecha: '2026-09-20T10:30:00',
    estado: 'ev-pagada',
    cliente: 'c-3',
    lineas: [
      ['pr-3', 1, 4],
      ['pr-9', 0.25, 2],
      ['pr-14', 0.4, 1],
    ],
  },
  {
    id: 've-6',
    fecha: '2026-09-20T17:15:00',
    estado: 'ev-anulada',
    lineas: [['pr-7', 0.17, 1]],
    borrado: true,
  },
  {
    id: 've-7',
    fecha: '2026-09-19T11:00:00',
    estado: 'ev-pagada',
    cliente: 'c-1',
    lineas: [['pr-10', 0.5, 6, 0.5]],
  },
];

const porId = <T extends { id: string }>(lista: readonly T[], id: string) =>
  lista.find((fila) => fila.id === id) ?? null;

/**
 * Arma una venta **calculando los totales aquí**, como hace el servidor.
 *
 * Es el detalle que hace útil a este mock: si los calculara la pantalla, el
 * día que se apagara `USAR_MOCKS` nadie notaría que el servidor manda otra
 * cifra. Aquí la cifra viene «de fuera», igual que vendrá entonces.
 */
const armar = (cruda: Cruda, idUsuario = 'u-3'): Venta => {
  const detalles: DetalleVenta[] = cruda.lineas.map(
    ([idProducto, precioUnitario, cantidad, descuentoAplicado = 0], indice) => ({
      id: `${cruda.id}-d-${indice + 1}`,
      idProducto,
      precioUnitario,
      cantidad,
      subtotal: subtotalDeLinea({ precioUnitario, cantidad, descuentoAplicado }),
      descuentoAplicado,
      estado: true,
      borrado: false,
    }),
  );

  return {
    id: cruda.id,
    fechaVenta: cruda.fecha,
    total: detalles.reduce((suma, detalle) => suma + detalle.subtotal, 0),
    idUsuario,
    idCliente: cruda.cliente ?? null,
    estadoVenta: porId(ESTADOS, cruda.estado),
    detalles,
    borrado: cruda.borrado ?? false,
  };
};

let ventas: Venta[] = CRUDAS.map((cruda) => armar(cruda));

let siguiente = 100;
const nuevoId = () => `ve-${++siguiente}`;

/** La fecha que pondría el servidor con `LocalDateTime.now()`: local, sin zona. */
const ahoraLocal = () => {
  const ahora = new Date();
  const dos = (valor: number) => String(valor).padStart(2, '0');
  return (
    `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}` +
    `T${dos(ahora.getHours())}:${dos(ahora.getMinutes())}:${dos(ahora.getSeconds())}`
  );
};

/** Busca y pagina como lo haría el backend. Mismo contrato, otra fuente. */
function paginar(filas: readonly Venta[], params: ParamsListado): Paginado<Venta> {
  const busqueda = params.search?.trim().toLowerCase() ?? '';
  const encontradas = busqueda
    ? filas.filter((fila) =>
        `${fila.id} ${fila.estadoVenta?.nombre ?? ''}`.toLowerCase().includes(busqueda),
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

/** Aplica la actualización. Lo ausente no se toca; una lista llega entera. */
function conCambios(actual: Venta, cambios: ActualizarVenta): Venta {
  const detalles =
    cambios.detalles !== undefined
      ? cambios.detalles.map((linea, indice) => ({
          id: `${actual.id}-d-${indice + 1}`,
          idProducto: linea.idProducto,
          precioUnitario: linea.precioUnitario,
          cantidad: linea.cantidad,
          subtotal: subtotalDeLinea(linea),
          descuentoAplicado: linea.descuentoAplicado,
          estado: true,
          borrado: false,
        }))
      : actual.detalles;

  return {
    ...actual,
    detalles,
    // El total lo recalcula el servidor en cuanto cambian las líneas.
    total: detalles.reduce((suma, detalle) => suma + detalle.subtotal, 0),
    ...(cambios.idCliente !== undefined
      ? { idCliente: cambios.idCliente === '' ? null : cambios.idCliente }
      : {}),
    ...(cambios.idEstadoVenta !== undefined
      ? { estadoVenta: porId(ESTADOS, cambios.idEstadoVenta) }
      : {}),
  };
}

export const ventaApiMock: VentaApi = {
  listar: (params) => esperar(paginar(ventas, params)),

  crear: (valores: CrearVenta, idUsuario: string) => {
    const venta = armar(
      {
        id: nuevoId(),
        fecha: ahoraLocal(),
        estado: valores.idEstadoVenta,
        ...(valores.idCliente ? { cliente: valores.idCliente } : {}),
        lineas: valores.detalles.map((linea) => [
          linea.idProducto,
          linea.precioUnitario,
          linea.cantidad,
          linea.descuentoAplicado,
        ]),
      },
      idUsuario,
    );

    ventas = [venta, ...ventas];
    return esperar(venta);
  },

  actualizar: (id, cambios) => {
    const actual = ventas.find((venta) => venta.id === id);
    if (!actual) throw new Error(`No existe la venta ${id}`);

    const actualizada = conCambios(actual, cambios);
    ventas = ventas.map((venta) => (venta.id === id ? actualizada : venta));
    return esperar(actualizada);
  },

  eliminar: (id) => {
    // Baja lógica, como el backend: `borrado = true`, la fila no desaparece.
    ventas = ventas.map((venta) => (venta.id === id ? { ...venta, borrado: true } : venta));
    return esperar(undefined);
  },
};

export const catalogoDeVentaApiMock: CatalogoDeVentaApi = {
  estados: () => esperar(ESTADOS),
  productos: () => esperar(PRODUCTOS),
  clientes: () => esperar(CLIENTES),
};
