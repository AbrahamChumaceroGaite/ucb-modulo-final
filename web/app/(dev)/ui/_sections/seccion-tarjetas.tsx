'use client';

import { useState } from 'react';
import {
  Boxes,
  Eye,
  Pencil,
  Timer,
  Trash2,
  Utensils,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Avatar,
  Dialog,
  DrawerPush,
  IconAction,
  ProgressBar,
  Tag,
} from '@/shared/ui/primitives';
import {
  AddCard,
  CardGrid,
  DataTable,
  EntityCard,
  StatCard,
  ViewSwitcher,
  VISTAS,
  type Vista,
} from '@/shared/ui/patterns';
import { formatearCantidad, formatearMoneda } from '@/shared/lib/format';
import { Muestra, Seccion } from '../_components/showcase';
import { FormularioInsumo } from '../_components/formulario-insumo';
import type { ValoresInsumo } from '../_components/formulario-insumo.schema';
import {
  aValoresDeFormulario,
  COLUMNAS_INSUMO,
  INSUMOS,
  PERSONAS,
  RECETAS,
  TICKETS_POR_HORA,
  VENTAS_POR_HORA,
} from '../_data/tarjetas';

type Insumo = (typeof INSUMOS)[number];

/**
 * Las tarjetas, que son la firma visual del producto.
 *
 * Todas salen del mismo `<EntityCard>`: lo que cambia son las props. Si cada
 * pantalla se hiciera su propia caja, en tres meses habría cuatro tarjetas
 * distintas — que es exactamente lo que encontramos auditando.
 */
export function SeccionTarjetas() {
  const [vista, setVista] = useState<Vista>('rejilla');
  const [enDetalle, setEnDetalle] = useState<Insumo | null>(null);
  const [enFormulario, setEnFormulario] = useState<Insumo | 'nuevo' | null>(null);

  const [guardando, setGuardando] = useState(false);

  /**
   * Guardar tarda. Aquí se finge la ida y vuelta al servidor porque el
   * catálogo no tiene backend, pero el orden es el de verdad: **primero se
   * guarda y después se cierra**. Cerrar el diálogo al pulsar y avisar del
   * éxito antes de tenerlo es prometer algo que todavía no ha pasado.
   */
  const guardar = (valores: ValoresInsumo) => {
    setGuardando(true);
    setTimeout(() => {
      setGuardando(false);
      setEnFormulario(null);
      toast.success(`«${valores.nombre}» guardado`);
    }, 1200);
  };

  const accionesDe = (insumo: Insumo) => (
    <>
      <IconAction
        accion="ver"
        etiqueta={`Ver ${insumo.titulo}`}
        icono={<Eye className="size-4" />}
        onClick={() => setEnDetalle(insumo)}
      />
      <IconAction
        accion="editar"
        etiqueta={`Editar ${insumo.titulo}`}
        icono={<Pencil className="size-4" />}
        onClick={() => setEnFormulario(insumo)}
      />
      <IconAction
        accion="eliminar"
        etiqueta={`Dar de baja ${insumo.titulo}`}
        icono={<Trash2 className="size-4" />}
        onClick={() => toast.warning(`Aquí se confirmaría la baja de «${insumo.titulo}»`)}
      />
    </>
  );

  return (
    <Seccion
      id="tarjetas"
      titulo="Tarjetas"
      descripcion="Icono de fondo girado, acento lateral del estado y acciones que aparecen al atender. Una sola implementación para todos los usos."
    >
      <Muestra
        titulo="Insumo"
        nota="Cambia la vista aquí arriba: es la misma tarjeta y la misma rejilla, sin un solo breakpoint escrito. Pasa el cursor sobre una para ver las acciones, que no ocupan sitio hasta que aparecen."
        className="block"
      >
        <DrawerPush
          abierto={enDetalle !== null}
          alCerrar={() => setEnDetalle(null)}
          titulo={enDetalle?.titulo ?? ''}
          subtitulo={enDetalle?.categoria ?? ''}
          marca={enDetalle ? <enDetalle.Icono /> : undefined}
          panel={
            enDetalle && (
              <div className="flex flex-col gap-3 text-sm">
                <ProgressBar
                  valor={enDetalle.stock}
                  maximo={enDetalle.minimo}
                  tono={enDetalle.tono}
                  etiqueta={`Existencias de ${enDetalle.titulo}`}
                />
                <p className="text-xs text-on-surface-variant">
                  Quedan {formatearCantidad(enDetalle.stock, enDetalle.unidad)} de un mínimo de{' '}
                  {formatearCantidad(enDetalle.minimo, enDetalle.unidad)}. La lista de la izquierda
                  sigue viva: se puede recorrer con el panel abierto, que es lo que este tipo de
                  panel compra y el superpuesto no.
                </p>
              </div>
            )
          }
        >
          <div className="mb-3 flex justify-end">
            <ViewSwitcher vista={vista} opciones={VISTAS} onCambiar={setVista} />
          </div>

          {vista === 'tabla' ? (
            <DataTable
              filas={INSUMOS}
              columnas={COLUMNAS_INSUMO}
              idDe={(fila) => fila.titulo}
              acciones={accionesDe}
            />
          ) : (
        <CardGrid vista={vista}>
          {INSUMOS.map((insumo) => (
            <EntityCard
              key={insumo.titulo}
              categoria={insumo.categoria}
              titulo={insumo.titulo}
              estado={insumo.estado}
              tono={insumo.tono}
              marca={<insumo.Icono />}
              medio={<insumo.Icono className="size-6" />}
              acciones={accionesDe(insumo)}
              vista={vista}
              pie={
                <div>
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="text-on-surface-variant">Existencias</span>
                    <span data-tabular className="font-medium text-on-surface">
                      {formatearCantidad(insumo.stock, insumo.unidad)} de{' '}
                      {formatearCantidad(insumo.minimo, insumo.unidad)}
                    </span>
                  </div>
                  <ProgressBar
                    className="mt-2"
                    valor={insumo.stock}
                    maximo={insumo.minimo}
                    tono={insumo.tono}
                    etiqueta={`Existencias de ${insumo.titulo}`}
                  />
                </div>
              }
            />
          ))}
        </CardGrid>
          )}
        </DrawerPush>

        {/* El mismo formulario que la sección de Formularios enseña como alta.
            Aquí llega con los valores dentro: editar desde una tarjeta o desde
            una fila abre lo mismo, no una copia parecida. */}
        <Dialog
          abierto={enFormulario !== null}
          alCerrar={() => !guardando && setEnFormulario(null)}
          titulo={enFormulario === 'nuevo' ? 'Nuevo insumo' : 'Editar insumo'}
        >
          {enFormulario !== null && (
            <FormularioInsumo
              {...(enFormulario === 'nuevo'
                ? {}
                : { valores: aValoresDeFormulario(enFormulario) })}
              guardando={guardando}
              onGuardar={guardar}
              onCancelar={() => setEnFormulario(null)}
            />
          )}
        </Dialog>
      </Muestra>

      <Muestra
        titulo="Persona"
        nota="Mismo componente, otra carga: avatar en el hueco del medio y las acciones arriba a la derecha, que aquí no hay banda superior que las estorbe."
        className="block"
      >
        <CardGrid>
          {PERSONAS.map((persona) => (
            <EntityCard
              key={persona.nombre}
              categoria={persona.rol}
              titulo={persona.nombre}
              tono={persona.tono}
              marca={<persona.Icono />}
              medio={<Avatar nombre={persona.nombre} />}
              acciones={
                <>
                  <IconAction
                    accion="editar"
                    etiqueta={`Editar ${persona.nombre}`}
                    icono={<Pencil className="size-4" />}
                  />
                  <IconAction
                    accion="eliminar"
                    etiqueta={`Dar de baja a ${persona.nombre}`}
                    icono={<Trash2 className="size-4" />}
                  />
                </>
              }
              pie={<span className="text-xs text-on-surface-variant">{persona.actividad}</span>}
            />
          ))}

          <AddCard
            titulo="Nueva persona"
            descripcion="Da de alta una cuenta del equipo."
            onClick={() => toast.info('Aquí se abriría el alta de cuentas.')}
          />
        </CardGrid>
      </Muestra>

      <Muestra
        titulo="Receta"
        nota="La carga completa: banda superior, insignia de dificultad encima, descripción de dos líneas, fila de datos y pie con la acción. El hueco de trazo discontinuo cierra la rejilla."
        className="block"
      >
        <CardGrid>
          {RECETAS.map((receta) => (
            <EntityCard
              key={receta.titulo}
              categoria={receta.categoria}
              titulo={receta.titulo}
              descripcion={receta.descripcion}
              tono={receta.tono}
              imagen={
                <div className="flex h-full items-center justify-center bg-linear-to-br from-primary-container to-surface-container-high">
                  <receta.Icono className="size-14 text-primary opacity-70" aria-hidden />
                </div>
              }
              insignia={
                <Tag
                  tono={receta.tono}
                  solido
                  icono={<span className="size-1.5 rounded-full bg-current" aria-hidden />}
                >
                  {receta.dificultad}
                </Tag>
              }
              datos={[
                { icono: <Timer />, texto: receta.minutos },
                { icono: <Utensils />, texto: `${receta.insumos} insumos` },
              ]}
              acciones={
                <>
                  <IconAction
                    accion="ver"
                    etiqueta={`Ver ${receta.titulo}`}
                    icono={<Eye className="size-4" />}
                  />
                  <IconAction
                    accion="editar"
                    etiqueta={`Editar ${receta.titulo}`}
                    icono={<Pencil className="size-4" />}
                  />
                </>
              }
            />
          ))}

          <AddCard
            titulo="Nueva receta"
            descripcion="Crea un plato o una bebida para la carta."
            onClick={() => toast.info('Aquí se abriría el alta de recetas.')}
          />
        </CardGrid>
      </Muestra>

      <Muestra titulo="Cifras" nota="El número manda. Detrás va la serie al 40 %, o al lado si la cifra es corta; la última no lleva serie porque un recuento de tres no tiene historia que contar." className="block">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            etiqueta="Ventas de hoy"
            valor={formatearMoneda(1245.5)}
            variacion="+12%"
            detalle="Frente a ayer a esta hora"
            tono="success"
            serie={VENTAS_POR_HORA}
          />
          <StatCard
            etiqueta="Tickets"
            valor="142"
            detalle="8,77 Bs de media"
            tono="primary"
            serie={TICKETS_POR_HORA}
          />
          <StatCard
            etiqueta="Hora punta"
            valor="08:00"
            detalle="45 pedidos en esa franja"
            tono="secondary"
            serie={VENTAS_POR_HORA}
            serieEn="lado"
          />
          <StatCard
            etiqueta="Bajo mínimos"
            valor="3"
            variacion="-2%"
            detalle="Insumos por reponer"
            tono="warning"
            marca={<Boxes />}
          />
        </div>
      </Muestra>
    </Seccion>
  );
}
