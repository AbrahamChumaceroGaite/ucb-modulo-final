/**
 * Datos de ejemplo del catálogo de tarjetas.
 *
 * Están aparte porque una sección del escaparate es **una vista**: mezclarle
 * ochenta líneas de datos obliga a bajarlas enteras para llegar al primer
 * componente, y es justo el vicio que esta regla existe para cortar.
 */

import { Boxes, Coffee, Croissant, CupSoda, Milk, ShieldCheck, Wheat } from 'lucide-react';
import type { ColumnaTabla } from '@/shared/ui/patterns';
import { formatearCantidad } from '@/shared/lib/format';
import type { ValoresInsumo } from '../_components/formulario-insumo.schema';
import { CATEGORIAS, UNIDADES } from './formularios';

export const INSUMOS = [
  {
    categoria: 'Café',
    titulo: 'House Espresso',
    estado: 'Hay que reponer',
    tono: 'danger' as const,
    Icono: Coffee,
    stock: 2.5,
    minimo: 10,
    unidad: 'kg',
  },
  {
    categoria: 'Lácteos',
    titulo: 'Leche entera',
    estado: 'Bien surtido',
    tono: 'success' as const,
    Icono: Milk,
    stock: 18,
    minimo: 20,
    unidad: 'L',
  },
  {
    categoria: 'Lácteos',
    titulo: 'Leche de avena',
    estado: 'Queda poco',
    tono: 'warning' as const,
    Icono: CupSoda,
    stock: 6,
    minimo: 12,
    unidad: 'L',
  },
  {
    categoria: 'Desechables',
    titulo: 'Vasos de 12 oz',
    estado: 'Conviene pedir',
    tono: 'warning' as const,
    Icono: Boxes,
    stock: 320,
    minimo: 500,
    unidad: 'u',
  },
];

export const RECETAS = [
  {
    categoria: 'Bebida caliente',
    titulo: 'Flat White clásico',
    descripcion: 'Doble espresso con leche texturizada a 60 °C. El pilar de la barra artesanal.',
    dificultad: 'Sencilla',
    tono: 'success' as const,
    Icono: Coffee,
    minutos: '3 min',
    insumos: 3,
  },
  {
    categoria: 'Método filtrado',
    titulo: 'V60 en goteo',
    descripcion: 'Filtrado de precisión con café de origen único. Pide balanza y temporizador.',
    dificultad: 'Media',
    tono: 'warning' as const,
    Icono: Wheat,
    minutos: '4,5 min',
    insumos: 2,
  },
  {
    categoria: 'Repostería',
    titulo: 'Croissant de almendra',
    descripcion: 'Relleno de frangipane y almendra laminada. Se hornea a primera hora.',
    dificultad: 'Difícil',
    tono: 'danger' as const,
    Icono: Croissant,
    minutos: '2 min',
    insumos: 6,
  },
];

/** Series de ejemplo: ventas y tickets de una jornada, hora a hora. */
export const VENTAS_POR_HORA = [180, 240, 420, 390, 510, 470, 620, 580, 710, 690, 820, 780];

export const TICKETS_POR_HORA = [12, 18, 31, 28, 39, 34, 46, 41, 52, 49, 58, 55];

export const PERSONAS = [
  {
    nombre: 'Elena Rostova',
    rol: 'Administrador',
    tono: 'primary' as const,
    Icono: ShieldCheck,
    actividad: 'Activa hace 2 minutos',
  },
  {
    nombre: 'Marcus Chen',
    rol: 'Barista',
    tono: 'secondary' as const,
    Icono: Coffee,
    actividad: 'Activo hace 3 horas',
  },
  {
    nombre: 'Sarah Ahmed',
    rol: 'Barista',
    tono: 'secondary' as const,
    Icono: Coffee,
    actividad: 'Ayer por la tarde',
  },
];

/**
 * Las mismas cuatro filas, en columnas.
 *
 * Están aquí y no en la sección porque son **datos sobre los datos**: qué
 * columna enseña qué. La sección solo elige si monta tarjetas o tabla.
 */
export const COLUMNAS_INSUMO: ReadonlyArray<ColumnaTabla<(typeof INSUMOS)[number]>> = [
  { clave: 'nombre', titulo: 'Insumo', celda: (fila) => fila.titulo },
  { clave: 'categoria', titulo: 'Categoría', celda: (fila) => fila.categoria },
  { clave: 'estado', titulo: 'Estado', celda: (fila) => fila.estado },
  {
    clave: 'stock',
    titulo: 'Existencias',
    alineacion: 'derecha',
    celda: (fila) => formatearCantidad(fila.stock, fila.unidad),
  },
];

/**
 * De una fila del catálogo a los valores del formulario.
 *
 * Existe para que editar desde una tarjeta abra el formulario **con los datos
 * dentro**, que es lo que cualquiera espera al pulsar un lápiz. Casa por
 * etiqueta porque estos datos de ejemplo guardan el nombre visible, no el id;
 * en la feature real ese trabajo lo hace `producto.mapper`.
 */
export function aValoresDeFormulario(insumo: (typeof INSUMOS)[number]): ValoresInsumo {
  const idPorEtiqueta = (lista: ReadonlyArray<{ valor: string; etiqueta: string }>, texto: string) =>
    lista.find((opcion) => opcion.etiqueta.toLowerCase() === texto.toLowerCase())?.valor ?? '';

  return {
    nombre: insumo.titulo,
    categoria: idPorEtiqueta(CATEGORIAS, insumo.categoria),
    precio: 0,
    unidad: UNIDADES.find((opcion) => opcion.valor === insumo.unidad.toLowerCase())?.valor ?? '',
    stock: insumo.stock,
    minimo: insumo.minimo,
    vendible: true,
    notas: '',
  };
}
