import { describe, expect, it } from 'vitest';
import { camposDePersonaSchema, nombreCompleto } from './persona.schema';

const valido = {
  nombres: 'Luis Fernando',
  apellidos: 'Chavez Pereira',
  telefono: '67253582',
  carnet: '83726352',
};

/**
 * Los cuatro campos que comparten usuario y cliente. Si estas reglas cambian,
 * cambian para los dos formularios a la vez — que es justo el motivo de que el
 * esquema esté compartido.
 */
describe('camposDePersonaSchema', () => {
  it('acepta una persona completa', () => {
    expect(camposDePersonaSchema.safeParse(valido).success).toBe(true);
  });

  it('el teléfono es opcional: vacío vale', () => {
    expect(camposDePersonaSchema.safeParse({ ...valido, telefono: '' }).success).toBe(true);
  });

  it('pero si se pone, tiene que ser boliviano', () => {
    const corto = camposDePersonaSchema.safeParse({ ...valido, telefono: '6725' });
    expect(corto.success).toBe(false);

    const malPrefijo = camposDePersonaSchema.safeParse({ ...valido, telefono: '12345678' });
    expect(malPrefijo.success).toBe(false);
  });

  it('el mensaje del teléfono dice qué se espera, no «inválido»', () => {
    const resultado = camposDePersonaSchema.safeParse({ ...valido, telefono: '12345678' });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toContain('empezar por 6 o 7');
    }
  });

  it('el carnet es obligatorio y de al menos cinco caracteres', () => {
    expect(camposDePersonaSchema.safeParse({ ...valido, carnet: '' }).success).toBe(false);
    expect(camposDePersonaSchema.safeParse({ ...valido, carnet: '1234' }).success).toBe(false);
    expect(camposDePersonaSchema.safeParse({ ...valido, carnet: '12345' }).success).toBe(true);
  });

  it('nombres y apellidos no pueden ser espacios', () => {
    expect(camposDePersonaSchema.safeParse({ ...valido, nombres: '  ' }).success).toBe(false);
    expect(camposDePersonaSchema.safeParse({ ...valido, apellidos: ' ' }).success).toBe(false);
  });

  it('el teléfono NO se transforma a null: el formulario maneja texto', () => {
    const resultado = camposDePersonaSchema.parse({ ...valido, telefono: '' });
    expect(resultado.telefono).toBe('');
  });
});

describe('nombreCompleto', () => {
  it('une nombres y apellidos, que en la base no existen juntos', () => {
    expect(
      nombreCompleto({
        idPersona: 'p-1',
        nombres: 'Luis Fernando',
        apellidos: 'Chavez Pereira',
        telefono: null,
        carnet: '1',
        borrado: false,
      }),
    ).toBe('Luis Fernando Chavez Pereira');
  });
});
