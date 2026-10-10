import { describe, expect, it } from 'vitest';
import { nivelDeStock, type Producto } from './producto.schema';

const insumo = (stock: number, stockMinimo: number): Producto =>
  ({ id: 'x', nombre: 'Café', precio: 1, stock, stockMinimo, vendible: true }) as Producto;

/**
 * El umbral es una regla de negocio y por eso vive en el dominio. Si se toca,
 * estas pruebas dicen exactamente qué cambia de color en toda la aplicación.
 */
describe('nivelDeStock', () => {
  it('es crítico cuando no llega al mínimo', () => {
    expect(nivelDeStock(insumo(2.5, 10))).toBe('critico');
  });

  it('sigue siendo crítico justo en el mínimo: quedarse al borde es quedarse corto', () => {
    expect(nivelDeStock(insumo(10, 10))).toBe('critico');
  });

  it('es bajo hasta una vez y media el mínimo', () => {
    expect(nivelDeStock(insumo(14, 10))).toBe('bajo');
    expect(nivelDeStock(insumo(15, 10))).toBe('bajo');
  });

  it('es suficiente por encima de eso', () => {
    expect(nivelDeStock(insumo(15.1, 10))).toBe('suficiente');
  });

  it('sin mínimo declarado no hay nada de que avisar', () => {
    expect(nivelDeStock(insumo(0, 0))).toBe('suficiente');
  });
});
