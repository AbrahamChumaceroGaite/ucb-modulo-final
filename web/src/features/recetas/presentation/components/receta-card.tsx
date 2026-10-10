'use client';

import { CookingPot, Eye, ListOrdered, Pencil, Trash2 } from 'lucide-react';
import { IconAction, Tag } from '@/shared/ui/primitives';
import { EntityCard, type Vista } from '@/shared/ui/patterns';
import { tandasPosibles, type Receta } from '../../domain/receta.schema';
import type { ReferenciaDeProducto } from '../../domain/referencia-producto.schema';
import { conUnidad } from '../../domain/referencia-producto.schema';

/**
 * La tarjeta de una receta.
 *
 * Misma anatomía que `<PersonaCard>` y `<ProductoCard>`, y por la misma razón:
 * las tres salen de `<EntityCard>`, así que la marca girada, las acciones que
 * se revelan al atender la fila y la adaptación a la vista se escriben **una
 * vez**.
 *
 * Lo que cambia es la carga: qué produce, cuántos ingredientes lleva y cuántos
 * pasos tiene — que es lo que se mira al barrer un recetario.
 *
 * ## «No se sabe» no es «cero»
 *
 * `tandasPosibles` devuelve `null` cuando falta algún producto de la despensa
 * cargada. Pintar «0 tandas» ahí diría que no hay existencias, que es una
 * afirmación distinta y falsa. Por eso ese caso no pinta la etiqueta: se
 * prefiere callar a mentir.
 */
export function RecetaCard({
  receta,
  productos,
  vista,
  onVer,
  onEditar,
  onEliminar,
}: {
  receta: Receta;
  /** Por id, para resolver nombres sin salir a buscarlos. */
  productos: ReadonlyMap<string, ReferenciaDeProducto>;
  vista: Vista;
  onVer: () => void;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const obtenido = productos.get(receta.idProductoObtenido);
  const stock = new Map([...productos].map(([id, producto]) => [id, producto.stock]));
  const tandas = tandasPosibles(receta, stock);

  const vigentes = receta.ingredientes.filter((ingrediente) => !ingrediente.borrado);
  const pasos = receta.pasos.filter((paso) => !paso.borrado);

  return (
    <EntityCard
      categoria={obtenido?.nombre ?? 'Producto sin resolver'}
      titulo={receta.titulo}
      tono={receta.borrado ? 'neutral' : 'primary'}
      marca={<CookingPot />}
      medio={<CookingPot className="size-5" />}
      vista={vista}
      {...(receta.borrado ? { insignia: <Tag tono="neutral">Dada de baja</Tag> } : {})}
      datos={[
        {
          icono: <ListOrdered />,
          texto: `${vigentes.length} ingrediente${vigentes.length === 1 ? '' : 's'} · ${pasos.length} paso${pasos.length === 1 ? '' : 's'}`,
        },
        {
          icono: <CookingPot />,
          texto: `Rinde ${conUnidad(receta.cantidad, obtenido)}`,
        },
      ]}
      {...(tandas !== null
        ? {
            pie: (
              <p className="text-xs text-on-surface-variant">
                {tandas > 0
                  ? `Da para ${tandas} tanda${tandas === 1 ? '' : 's'} con lo que hay`
                  : 'No alcanza para una tanda'}
              </p>
            ),
          }
        : {})}
      acciones={
        <>
          <IconAction
            accion="ver"
            etiqueta={`Ver la receta de ${receta.titulo}`}
            icono={<Eye className="size-4" />}
            onClick={onVer}
          />
          <IconAction
            accion="editar"
            etiqueta={`Editar ${receta.titulo}`}
            icono={<Pencil className="size-4" />}
            onClick={onEditar}
          />
          <IconAction
            accion="eliminar"
            etiqueta={`Dar de baja ${receta.titulo}`}
            icono={<Trash2 className="size-4" />}
            onClick={onEliminar}
            disabled={receta.borrado}
          />
        </>
      }
    />
  );
}
