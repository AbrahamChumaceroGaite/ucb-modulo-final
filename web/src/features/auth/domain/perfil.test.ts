import { describe, expect, it } from 'vitest';
import { definicionDePerfil, perfilDeRol } from './perfil';

/**
 * `rol.nombre` es un `VARCHAR(50)` que alguien escribe a mano en la base: no
 * hay catálogo. Por eso esto reconoce por palabra, y por eso es importante que
 * **devuelva `null` cuando no reconoce** en lugar de adivinar: con `null` no se
 * afirma ninguna discrepancia y no se manda a nadie a la pantalla equivocada.
 */
describe('perfilDeRol', () => {
  it('reconoce al administrador escrito de varias formas', () => {
    for (const nombre of ['Administrador', 'ADMIN', 'Gerente', 'Encargada', 'Dueño']) {
      expect(perfilDeRol(nombre)).toBe('administrador');
    }
  });

  it('reconoce al operador escrito de varias formas', () => {
    for (const nombre of ['Operador', 'Barista', 'Cajero', 'Mesero']) {
      expect(perfilDeRol(nombre)).toBe('operador');
    }
  });

  it('no se deja engañar por acentos ni mayúsculas', () => {
    expect(perfilDeRol('ADMINISTRADORA')).toBe('administrador');
    expect(perfilDeRol('Baristá')).toBe('operador');
  });

  it('devuelve null si no reconoce, en vez de inventar', () => {
    expect(perfilDeRol('Contabilidad')).toBeNull();
    expect(perfilDeRol('')).toBeNull();
  });
});

describe('definicionDePerfil', () => {
  it('cada perfil entra por una puerta distinta', () => {
    expect(definicionDePerfil('administrador').entra).toBe('/usuarios');
    expect(definicionDePerfil('operador').entra).toBe('/productos');
  });
});
