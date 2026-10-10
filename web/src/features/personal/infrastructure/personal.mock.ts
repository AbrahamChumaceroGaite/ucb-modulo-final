import type { ParamsListado, Paginado } from '@/shared/api/paginated';
import { ROL_ID } from '@/shared/config/roles';
import type { ActualizarCliente, CamposDeCliente, Cliente } from '../domain/cliente.schema';
import type { Persona } from '../domain/persona.schema';
import type { ActualizarUsuario, Usuario } from '../domain/usuario.schema';
import type { ClienteApi, UsuarioApi } from './personal.puertos';

/**
 * Datos falsos con memoria, mientras no haya backend.
 *
 * ## Qué es y qué no
 *
 * **Es** una implementación completa del puerto: lista, pagina, busca, crea,
 * actualiza parcialmente y borra, y los cambios persisten mientras la pestaña
 * viva. Así la pantalla se puede terminar y probar de verdad —incluido el
 * PATCH, que es donde más fácil se cuela un error— sin esperar al servidor.
 *
 * **No es** una simulación del backend. No valida nada, no comprueba correos
 * repetidos y no hashea contraseñas. Lo que responde está fabricado aquí.
 *
 * Las primeras filas salen del Excel de poblado (`Personal y Roles`) para que
 * los nombres, carnets y teléfonos sean los que habrá de verdad; el resto
 * sigue el mismo patrón. Son **doce y doce** a propósito: con cuatro registros
 * el paginador nunca se ejercita y se entrega sin haberlo pulsado nunca.
 *
 * ## El retardo es a propósito
 *
 * 350 ms en cada llamada. Sin él, los esqueletos no se ven nunca y se entrega
 * una pantalla cuyo estado de carga nadie ha mirado — que es exactamente lo
 * que encontramos auditando.
 */
const RETARDO_MS = 350;

const esperar = <T,>(valor: T): Promise<T> =>
  new Promise((resolver) => setTimeout(() => resolver(valor), RETARDO_MS));

function persona(
  idPersona: string,
  nombres: string,
  apellidos: string,
  telefono: string | null,
  carnet: string,
): Persona {
  return { idPersona, nombres, apellidos, telefono, carnet, borrado: false };
}

const PERSONAS = {
  luis: persona('p-1', 'Luis Fernando', 'Chavez Pereira', '67253582', '83726352'),
  sebastian: persona('p-2', 'Sebastian Carlos', 'Oliveira Pacheco', '73619473', '73653721'),
  ernesto: persona('p-3', 'Ernesto Sebastian', 'Cruz Portal', '60485686', '74625382'),
  raul: persona('p-4', 'Raul Oscar', 'Menendez Urzagaste', '60485686', '35173829'),
  juan: persona('p-5', 'Juan Eduardo', 'Perez Angulo', null, '35173829'),
  ana: persona('p-6', 'Ana Gabriela', 'Rojas Vargas', '71234567', '91827364'),
  marta: persona('p-7', 'Marta Elena', 'Quiroga Ledezma', '76543210', '10293847'),
  diego: persona('p-8', 'Diego Armando', 'Salazar Nuñez', '68889900', '55667788'),
  carla: persona('p-9', 'Carla Beatriz', 'Mendoza Rivas', '70112233', '44556677'),
  hugo: persona('p-10', 'Hugo Nelson', 'Vaca Tapia', null, '33445566'),
  rosa: persona('p-11', 'Rosa Mercedes', 'Aguilar Soto', '72223344', '22334455'),
  ivan: persona('p-12', 'Ivan Ricardo', 'Terceros Lima', '67778899', '11223344'),
  paola: persona('p-13', 'Paola Andrea', 'Justiniano Roca', '73334455', '99887766'),
  omar: persona('p-14', 'Omar Esteban', 'Camacho Peña', '69990011', '88776655'),
} satisfies Record<string, Persona>;

const ROL = {
  administrador: { id: ROL_ID.administrador, nombre: 'Administrador', borrado: false },
  operador: { id: ROL_ID.operador, nombre: 'Operador', borrado: false },
};

let usuarios: Usuario[] = [
  {
    id: 'u-1',
    correo: 'sebastian@kaffehaus.bo',
    persona: PERSONAS.sebastian,
    rol: ROL.operador,
    borrado: false,
  },
  {
    id: 'u-2',
    correo: 'ernesto@kaffehaus.bo',
    persona: PERSONAS.ernesto,
    rol: ROL.operador,
    borrado: false,
  },
  {
    id: 'u-3',
    correo: 'raul@kaffehaus.bo',
    persona: PERSONAS.raul,
    rol: ROL.administrador,
    borrado: false,
  },
  {
    id: 'u-4',
    correo: 'ana@kaffehaus.bo',
    persona: PERSONAS.ana,
    rol: ROL.administrador,
    borrado: true,
  },
  { id: 'u-5', correo: 'marta@kaffehaus.bo', persona: PERSONAS.marta, rol: ROL.operador, borrado: false },
  { id: 'u-6', correo: 'diego@kaffehaus.bo', persona: PERSONAS.diego, rol: ROL.operador, borrado: false },
  { id: 'u-7', correo: 'carla@kaffehaus.bo', persona: PERSONAS.carla, rol: ROL.administrador, borrado: false },
  { id: 'u-8', correo: 'hugo@kaffehaus.bo', persona: PERSONAS.hugo, rol: ROL.operador, borrado: false },
  { id: 'u-9', correo: 'rosa@kaffehaus.bo', persona: PERSONAS.rosa, rol: ROL.operador, borrado: true },
  { id: 'u-10', correo: 'ivan@kaffehaus.bo', persona: PERSONAS.ivan, rol: ROL.operador, borrado: false },
  { id: 'u-11', correo: 'paola@kaffehaus.bo', persona: PERSONAS.paola, rol: ROL.administrador, borrado: false },
  { id: 'u-12', correo: 'omar@kaffehaus.bo', persona: PERSONAS.omar, rol: ROL.operador, borrado: false },
];

let clientes: Cliente[] = [
  { id: 'c-1', persona: PERSONAS.luis, borrado: false },
  { id: 'c-2', persona: PERSONAS.sebastian, borrado: false },
  { id: 'c-3', persona: PERSONAS.ernesto, borrado: false },
  { id: 'c-4', persona: PERSONAS.raul, borrado: false },
  { id: 'c-5', persona: PERSONAS.juan, borrado: true },
  { id: 'c-6', persona: PERSONAS.marta, borrado: false },
  { id: 'c-7', persona: PERSONAS.diego, borrado: false },
  { id: 'c-8', persona: PERSONAS.carla, borrado: false },
  { id: 'c-9', persona: PERSONAS.hugo, borrado: false },
  { id: 'c-10', persona: PERSONAS.rosa, borrado: false },
  { id: 'c-11', persona: PERSONAS.ivan, borrado: true },
  { id: 'c-12', persona: PERSONAS.paola, borrado: false },
];

/**
 * Busca y pagina como lo haría el backend: `skip`/`limit` y un `search` que
 * mira los campos visibles. Mismo contrato, para que cambiar de puerto no
 * cambie ni una línea de la pantalla.
 */
function paginar<T>(filas: readonly T[], params: ParamsListado, texto: (fila: T) => string) {
  const busqueda = params.search?.trim().toLowerCase() ?? '';
  const encontradas = busqueda
    ? filas.filter((fila) => texto(fila).toLowerCase().includes(busqueda))
    : filas;

  const skip = params.skip ?? 0;
  const limit = params.limit ?? 10;
  const pagina = encontradas.slice(skip, skip + limit);

  return {
    data: [...pagina],
    skip,
    limit,
    total: encontradas.length,
    hasMore: skip + limit < encontradas.length,
  };
}

const textoDe = (persona: Persona, extra = '') =>
  `${persona.nombres} ${persona.apellidos} ${persona.carnet} ${extra}`;

let siguiente = 100;
const nuevoId = (prefijo: string) => `${prefijo}-${++siguiente}`;

/** De los campos del formulario a una persona nueva. `''` sale como `null`. */
function personaDesde(valores: CamposDeCliente): Persona {
  return {
    idPersona: nuevoId('p'),
    nombres: valores.nombres,
    apellidos: valores.apellidos,
    telefono: valores.telefono === '' ? null : valores.telefono,
    carnet: valores.carnet,
    borrado: false,
  };
}

/** Aplica un PATCH sobre la persona. Lo ausente no se toca. */
function personaConCambios(actual: Persona, cambios: Partial<CamposDeCliente>): Persona {
  return {
    ...actual,
    ...(cambios.nombres !== undefined ? { nombres: cambios.nombres } : {}),
    ...(cambios.apellidos !== undefined ? { apellidos: cambios.apellidos } : {}),
    ...(cambios.carnet !== undefined ? { carnet: cambios.carnet } : {}),
    ...(cambios.telefono !== undefined
      ? { telefono: cambios.telefono === '' ? null : cambios.telefono }
      : {}),
  };
}

function exigir<T>(fila: T | undefined, que: string): T {
  if (!fila) throw new Error(`No existe ${que}`);
  return fila;
}

export const usuarioApiMock: UsuarioApi = {
  listar: (params) =>
    esperar(paginar(usuarios, params, (u) => textoDe(u.persona, u.correo))) as Promise<
      Paginado<Usuario>
    >,

  crear: (valores) => {
    const usuario: Usuario = {
      id: nuevoId('u'),
      correo: valores.correo,
      persona: personaDesde(valores),
      rol: valores.idRol === ROL_ID.administrador ? ROL.administrador : ROL.operador,
      borrado: false,
    };
    usuarios = [usuario, ...usuarios];
    return esperar(usuario);
  },

  actualizar: (id, cambios: ActualizarUsuario) => {
    const actual = exigir(
      usuarios.find((usuario) => usuario.id === id),
      `el usuario ${id}`,
    );

    const actualizado: Usuario = {
      ...actual,
      ...(cambios.correo !== undefined ? { correo: cambios.correo } : {}),
      ...(cambios.idRol !== undefined
        ? { rol: cambios.idRol === ROL_ID.administrador ? ROL.administrador : ROL.operador }
        : {}),
      persona: personaConCambios(actual.persona, cambios),
    };

    usuarios = usuarios.map((usuario) => (usuario.id === id ? actualizado : usuario));
    return esperar(actualizado);
  },

  eliminar: (id) => {
    // Baja lógica, como el backend: `borrado = true`, la fila no desaparece.
    usuarios = usuarios.map((usuario) =>
      usuario.id === id ? { ...usuario, borrado: true } : usuario,
    );
    return esperar(undefined);
  },
};

export const clienteApiMock: ClienteApi = {
  listar: (params) =>
    esperar(paginar(clientes, params, (c) => textoDe(c.persona))) as Promise<Paginado<Cliente>>,

  crear: (valores) => {
    const cliente: Cliente = { id: nuevoId('c'), persona: personaDesde(valores), borrado: false };
    clientes = [cliente, ...clientes];
    return esperar(cliente);
  },

  actualizar: (id, cambios: ActualizarCliente) => {
    const actual = exigir(
      clientes.find((cliente) => cliente.id === id),
      `el cliente ${id}`,
    );
    const actualizado: Cliente = { ...actual, persona: personaConCambios(actual.persona, cambios) };

    clientes = clientes.map((cliente) => (cliente.id === id ? actualizado : cliente));
    return esperar(actualizado);
  },

  eliminar: (id) => {
    clientes = clientes.map((cliente) =>
      cliente.id === id ? { ...cliente, borrado: true } : cliente,
    );
    return esperar(undefined);
  },
};
