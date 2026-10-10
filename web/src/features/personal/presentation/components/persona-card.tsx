'use client';

import { Eye, IdCard, Pencil, Phone, Trash2 } from 'lucide-react';
import { Avatar, IconAction, Tag } from '@/shared/ui/primitives';
import { EntityCard, type Vista } from '@/shared/ui/patterns';
import type { Tone } from '@/shared/config/variants';
import type { ReactNode } from 'react';
import { nombreCompleto, type Persona } from '../../domain/persona.schema';

/**
 * La tarjeta de una persona, sea cuenta o cliente.
 *
 * ## Por qué una sola y no dos
 *
 * Porque lo que se ve es casi todo lo mismo: avatar, nombre, carnet y
 * teléfono. Lo que cambia son dos cosas —el rótulo de arriba y lo que va en el
 * pie— y eso entra por props. Dos tarjetas separadas habrían divergido en el
 * primer retoque, que es exactamente lo que medimos auditando: setenta
 * componentes con el mismo nombre en dos árboles distintos.
 *
 * No sabe qué es un usuario ni qué es un cliente: recibe la persona y los
 * adornos ya resueltos. Quien decide es la vista.
 */
export function PersonaCard({
  persona,
  categoria,
  tono = 'neutral',
  marca,
  pie,
  dadaDeBaja = false,
  vista,
  onVer,
  onEditar,
  onEliminar,
}: {
  persona: Persona;
  /** El rótulo en mayúsculas: el rol de la cuenta, o «Cliente». */
  categoria: string;
  tono?: Tone;
  marca: ReactNode;
  /** Lo propio de cada colección: el correo de una cuenta, por ejemplo. */
  pie?: ReactNode;
  dadaDeBaja?: boolean;
  vista: Vista;
  onVer: () => void;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const nombre = nombreCompleto(persona);

  return (
    <EntityCard
      categoria={categoria}
      titulo={nombre}
      tono={dadaDeBaja ? 'neutral' : tono}
      marca={marca}
      medio={<Avatar nombre={nombre} />}
      vista={vista}
      {...(dadaDeBaja ? { insignia: <Tag tono="neutral">Dada de baja</Tag> } : {})}
      datos={[
        { icono: <IdCard />, texto: persona.carnet },
        // Sin teléfono se dice, no se deja el hueco: en blanco no se
        // distingue «no tiene» de «no cargó».
        { icono: <Phone />, texto: persona.telefono ?? 'Sin teléfono' },
      ]}
      acciones={
        <>
          <IconAction
            accion="ver"
            etiqueta={`Ver la ficha de ${nombre}`}
            icono={<Eye className="size-4" />}
            onClick={onVer}
          />
          <IconAction
            accion="editar"
            etiqueta={`Editar a ${nombre}`}
            icono={<Pencil className="size-4" />}
            onClick={onEditar}
          />
          <IconAction
            accion="eliminar"
            etiqueta={`Dar de baja a ${nombre}`}
            icono={<Trash2 className="size-4" />}
            onClick={onEliminar}
            disabled={dadaDeBaja}
          />
        </>
      }
      {...(pie ? { pie } : {})}
    />
  );
}
