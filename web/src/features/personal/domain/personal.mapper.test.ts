import { describe, expect, it } from 'vitest';
import { ROL_ID } from '@/shared/config/roles';
import type { Usuario } from './usuario.schema';
import type { Cliente } from './cliente.schema';
import {
  clienteAActualizacion,
  clienteAFormulario,
  usuarioAActualizacion,
  usuarioAFormulario,
} from './personal.mapper';

const persona = {
  idPersona: 'p-1',
  nombres: 'Luis Fernando',
  apellidos: 'Chavez Pereira',
  telefono: '67253582',
  carnet: '83726352',
  borrado: false,
};

const usuario: Usuario = {
  id: 'u-1',
  correo: 'luis@kaffehaus.bo',
  persona,
  rol: { id: ROL_ID.operador, nombre: 'Operador', borrado: false },
  borrado: false,
};

const cliente: Cliente = { id: 'c-1', persona, borrado: false };

describe('usuarioAFormulario', () => {
  it('aplana la persona y trae el id del rol, no su nombre', () => {
    expect(usuarioAFormulario(usuario)).toEqual({
      nombres: 'Luis Fernando',
      apellidos: 'Chavez Pereira',
      telefono: '67253582',
      carnet: '83726352',
      correo: 'luis@kaffehaus.bo',
      contrasena: '',
      idRol: ROL_ID.operador,
    });
  });

  it('un teléfono nulo llega al formulario como texto vacío', () => {
    const sinTelefono = { ...usuario, persona: { ...persona, telefono: null } };
    expect(usuarioAFormulario(sinTelefono).telefono).toBe('');
  });
});

describe('usuarioAActualizacion', () => {
  it('sin cambios no manda nada', () => {
    expect(usuarioAActualizacion(usuario, usuarioAFormulario(usuario))).toEqual({});
  });

  it('manda solo el campo que cambió', () => {
    const valores = { ...usuarioAFormulario(usuario), correo: 'otro@kaffehaus.bo' };
    expect(usuarioAActualizacion(usuario, valores)).toEqual({ correo: 'otro@kaffehaus.bo' });
  });

  it('la contraseña en blanco NO viaja: significa «no la toques»', () => {
    const valores = { ...usuarioAFormulario(usuario), contrasena: '' };
    const cambios = usuarioAActualizacion(usuario, valores);

    expect(Object.hasOwn(cambios, 'contrasena')).toBe(false);
  });

  it('una contraseña escrita sí viaja, aunque el resto no cambie', () => {
    const valores = { ...usuarioAFormulario(usuario), contrasena: 'tostado2026' };
    expect(usuarioAActualizacion(usuario, valores)).toEqual({ contrasena: 'tostado2026' });
  });

  it('cambiar de rol manda el id, no el nombre', () => {
    const valores = { ...usuarioAFormulario(usuario), idRol: ROL_ID.administrador };
    expect(usuarioAActualizacion(usuario, valores)).toEqual({ idRol: ROL_ID.administrador });
  });
});

describe('cliente', () => {
  it('el formulario de cliente es solo la persona: ni correo ni rol', () => {
    expect(clienteAFormulario(cliente)).toEqual({
      nombres: 'Luis Fernando',
      apellidos: 'Chavez Pereira',
      telefono: '67253582',
      carnet: '83726352',
    });
  });

  it('el PATCH de cliente manda solo lo que cambió', () => {
    const valores = { ...clienteAFormulario(cliente), telefono: '70000000' };
    expect(clienteAActualizacion(cliente, valores)).toEqual({ telefono: '70000000' });
  });
});
