import { describe, expect, it } from 'vitest';
import { ROL_ID } from '@/shared/config/roles';
import type { Cliente } from './cliente.schema';
import type { Usuario } from './usuario.schema';
import { esUsuario, filtrarPersonal, type FiltrosDePersonal } from './personal.filtros';

const persona = {
  idPersona: 'p-1',
  nombres: 'Luis',
  apellidos: 'Chavez',
  telefono: null,
  carnet: '83726352',
  borrado: false,
};

const usuario = (id: string, rol: string, borrado = false): Usuario => ({
  id,
  correo: `${id}@kaffehaus.bo`,
  persona,
  rol: { id: rol, nombre: rol === ROL_ID.administrador ? 'Administrador' : 'Operador', borrado: false },
  borrado,
});

const cliente = (id: string, borrado = false): Cliente => ({ id, persona, borrado });

/** «Nada puesto». Aquí y no en el dominio: allí solo lo usaría esta prueba. */
const SIN_FILTRO: FiltrosDePersonal = { estado: [], roles: [] };

describe('esUsuario', () => {
  it('distingue por el rol, que es lo único que un cliente no tiene', () => {
    expect(esUsuario(usuario('u-1', ROL_ID.operador))).toBe(true);
    expect(esUsuario(cliente('c-1'))).toBe(false);
  });
});

describe('filtrarPersonal', () => {
  const filas = [
    usuario('u-1', ROL_ID.operador),
    usuario('u-2', ROL_ID.administrador),
    usuario('u-3', ROL_ID.operador, true),
  ];

  it('sin filtros devuelve todo, incluidos los dados de baja', () => {
    expect(filtrarPersonal(filas, SIN_FILTRO)).toHaveLength(3);
  });

  it('«activos» esconde los dados de baja', () => {
    const resultado = filtrarPersonal(filas, { ...SIN_FILTRO, estado: ['activos'] });
    expect(resultado.map((f) => f.id)).toEqual(['u-1', 'u-2']);
  });

  it('«baja» enseña solo los dados de baja', () => {
    const resultado = filtrarPersonal(filas, { ...SIN_FILTRO, estado: ['baja'] });
    expect(resultado.map((f) => f.id)).toEqual(['u-3']);
  });

  it('el rol acota a los de ese rol', () => {
    const resultado = filtrarPersonal(filas, { ...SIN_FILTRO, roles: [ROL_ID.administrador] });
    expect(resultado.map((f) => f.id)).toEqual(['u-2']);
  });

  it('los dos filtros se suman', () => {
    const resultado = filtrarPersonal(filas, { estado: ['activos'], roles: [ROL_ID.operador] });
    expect(resultado.map((f) => f.id)).toEqual(['u-1']);
  });

  it('el rol se ignora sobre clientes: no tienen, y devolver cero parecería un fallo', () => {
    const clientes = [cliente('c-1'), cliente('c-2', true)];
    const resultado = filtrarPersonal(clientes, { estado: [], roles: [ROL_ID.administrador] });

    expect(resultado).toHaveLength(2);
  });

  it('varios roles se acumulan: es una unión, no una intersección', () => {
    const resultado = filtrarPersonal(filas, {
      ...SIN_FILTRO,
      roles: [ROL_ID.administrador, ROL_ID.operador],
    });
    expect(resultado.map((f) => f.id)).toEqual(['u-1', 'u-2', 'u-3']);
  });

  it('elegir los dos estados es lo mismo que no elegir ninguno', () => {
    const ambos = filtrarPersonal(filas, { ...SIN_FILTRO, estado: ['activos', 'baja'] });
    expect(ambos).toHaveLength(3);
  });

  it('no muta la lista que recibe', () => {
    const original = [...filas];
    filtrarPersonal(filas, { ...SIN_FILTRO, estado: ['activos'] });
    expect(filas).toEqual(original);
  });
});
