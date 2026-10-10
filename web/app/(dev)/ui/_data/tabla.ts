/** Filas y filtros de ejemplo de la tabla del escaparate. */

import type { Nivel } from '@/shared/config/levels';

export type FilaInsumo = {
  id: string;
  nombre: string;
  categoria: string;
  stock: number;
  minimo: number;
  unidad: string;
  precio: number;
  nivel: Nivel;
};

export const FILAS: FilaInsumo[] = [
  { id: '1', nombre: 'House Espresso', categoria: 'Café', stock: 2.5, minimo: 10, unidad: 'kg', precio: 92, nivel: 'critico' },
  { id: '2', nombre: 'Leche entera', categoria: 'Lácteos', stock: 18, minimo: 20, unidad: 'L', precio: 7.5, nivel: 'suficiente' },
  { id: '3', nombre: 'Leche de avena', categoria: 'Lácteos', stock: 6, minimo: 12, unidad: 'L', precio: 14, nivel: 'bajo' },
  { id: '4', nombre: 'Vasos de 12 oz', categoria: 'Desechables', stock: 320, minimo: 500, unidad: 'u', precio: 0.9, nivel: 'bajo' },
  { id: '5', nombre: 'Sirope de vainilla', categoria: 'Siropes', stock: 4, minimo: 3, unidad: 'L', precio: 38, nivel: 'suficiente' },
  { id: '6', nombre: 'Croissant congelado', categoria: 'Repostería', stock: 40, minimo: 24, unidad: 'u', precio: 4.2, nivel: 'suficiente' },
];

export const CATEGORIAS = [
  { valor: '', etiqueta: 'Todo', cuenta: FILAS.length },
  { valor: 'Café', etiqueta: 'Café', cuenta: 1 },
  { valor: 'Lácteos', etiqueta: 'Lácteos', cuenta: 2 },
  { valor: 'Desechables', etiqueta: 'Desechables', cuenta: 1 },
  { valor: 'Siropes', etiqueta: 'Siropes', cuenta: 1 },
  { valor: 'Repostería', etiqueta: 'Repostería', cuenta: 1 },
];

