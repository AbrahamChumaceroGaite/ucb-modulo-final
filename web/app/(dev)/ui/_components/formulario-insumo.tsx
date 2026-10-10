'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, Input, Select, Switch, Tag, Textarea } from '@/shared/ui/primitives';
import {
  FormField,
  FormLayout,
  FormRow,
  FormWizard,
  ResumenDato,
  ResumenGrupo,
  type PasoFormulario,
} from '@/shared/ui/patterns';
import { formatearCantidad, formatearMoneda } from '@/shared/lib/format';
import { CATEGORIAS, UNIDADES } from '../_data/formularios';
import { esquemaInsumo, INSUMO_VACIO, type ValoresInsumo } from './formulario-insumo.schema';

/**
 * El formulario de ejemplo del catálogo, por pasos.
 *
 * **Uno solo, usado en dos sitios:** la sección de formularios lo enseña como
 * alta, y la sección de tarjetas lo abre en un diálogo para editar lo que se
 * pulsó en una tarjeta o en una fila de la tabla. Escribirlo dos veces era la
 * forma garantizada de que el de las tarjetas se quedara atrás.
 *
 * Si llega `valores`, arranca con ellos y el botón final dice «Guardar
 * cambios». Es el mismo criterio que sigue `ProductoForm` en la feature real:
 * alta y edición son el mismo formulario con distintos valores iniciales.
 */
export function FormularioInsumo({
  valores,
  guardando = false,
  onGuardar,
  onCancelar,
}: {
  valores?: ValoresInsumo;
  guardando?: boolean;
  onGuardar: (valores: ValoresInsumo) => void;
  onCancelar?: () => void;
}) {
  const form = useForm<ValoresInsumo>({
    resolver: zodResolver(esquemaInsumo),
    defaultValues: valores ?? INSUMO_VACIO,
  });

  const errores = form.formState.errors;
  const nombreDe = (lista: ReadonlyArray<{ valor: string; etiqueta: string }>, id: string) =>
    lista.find((opcion) => opcion.valor === id)?.etiqueta ?? '';

  const pasos: PasoFormulario<ValoresInsumo>[] = [
    {
      clave: 'identidad',
      titulo: 'Qué es',
      campos: ['nombre', 'categoria'],
      contenido: (
        <FormLayout>
          <FormRow>
            <FormField tramo="dosTercios">
              <Field etiqueta="Nombre" requerido error={errores.nombre?.message}>
                <Input placeholder="House Espresso" {...form.register('nombre')} />
              </Field>
            </FormField>
            <FormField tramo="tercio">
              <Field etiqueta="Categoría" requerido error={errores.categoria?.message}>
                <Select opciones={CATEGORIAS} marcador="Elegir…" {...form.register('categoria')} />
              </Field>
            </FormField>
          </FormRow>
        </FormLayout>
      ),
    },
    {
      clave: 'existencias',
      titulo: 'Cuánto hay',
      campos: ['precio', 'unidad', 'stock', 'minimo'],
      contenido: (
        <FormLayout>
          <FormRow>
            <FormField tramo="mitad" minimo="9rem">
              <Field
                etiqueta="Precio"
                requerido
                error={errores.precio?.message}
                ayuda="En bolivianos"
              >
                <Input
                  type="number"
                  step="0.01"
                  {...form.register('precio', { valueAsNumber: true })}
                />
              </Field>
            </FormField>
            <FormField tramo="mitad" minimo="9rem">
              <Field etiqueta="Unidad" requerido error={errores.unidad?.message}>
                <Select opciones={UNIDADES} marcador="Elegir…" {...form.register('unidad')} />
              </Field>
            </FormField>
          </FormRow>
          <FormRow>
            <FormField tramo="mitad" minimo="9rem">
              <Field etiqueta="Stock actual" error={errores.stock?.message}>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register('stock', { valueAsNumber: true })}
                />
              </Field>
            </FormField>
            <FormField tramo="mitad" minimo="9rem">
              <Field etiqueta="Mínimo" error={errores.minimo?.message} ayuda="Cuándo avisar">
                <Input
                  type="number"
                  step="0.01"
                  {...form.register('minimo', { valueAsNumber: true })}
                />
              </Field>
            </FormField>
          </FormRow>
        </FormLayout>
      ),
    },
    {
      clave: 'preparacion',
      titulo: 'Preparación',
      campos: ['vendible', 'notas'],
      contenido: (
        <FormLayout>
          <FormRow>
            <FormField>
              <Controller
                name="vendible"
                control={form.control}
                render={({ field }) => (
                  <Switch
                    etiqueta="Se vende en la barra"
                    checked={field.value}
                    onChange={(evento) => field.onChange(evento.target.checked)}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField>
              <Field
                etiqueta="Para el barista"
                error={errores.notas?.message}
                ayuda="Cómo se prepara, a qué temperatura, en qué taza"
              >
                <Textarea rows={3} {...form.register('notas')} />
              </Field>
            </FormField>
          </FormRow>
        </FormLayout>
      ),
    },
  ];

  return (
    <FormWizard
      form={form}
      pasos={pasos}
      enviando={guardando}
      onEnviar={onGuardar}
      {...(onCancelar ? { onCancelar } : {})}
      textoEnviar={valores ? 'Guardar cambios' : 'Añadir a la despensa'}
      resumen={(datos) => (
        <div className="flex flex-col gap-3">
          <ResumenGrupo titulo="Qué es">
            <ResumenDato etiqueta="Nombre">{datos.nombre}</ResumenDato>
            <ResumenDato etiqueta="Categoría">{nombreDe(CATEGORIAS, datos.categoria)}</ResumenDato>
          </ResumenGrupo>

          <ResumenGrupo titulo="Cuánto hay">
            <ResumenDato etiqueta="Precio">{formatearMoneda(datos.precio)}</ResumenDato>
            <ResumenDato etiqueta="Stock actual">
              {formatearCantidad(datos.stock, nombreDe(UNIDADES, datos.unidad))}
            </ResumenDato>
            <ResumenDato etiqueta="Avisar por debajo de">
              {formatearCantidad(datos.minimo, nombreDe(UNIDADES, datos.unidad))}
            </ResumenDato>
          </ResumenGrupo>

          <ResumenGrupo titulo="Preparación">
            <ResumenDato etiqueta="Se vende">
              <Tag tono={datos.vendible ? 'success' : 'neutral'}>
                {datos.vendible ? 'Sí, está en la carta' : 'No, solo despensa'}
              </Tag>
            </ResumenDato>
            <ResumenDato etiqueta="Notas">{datos.notas}</ResumenDato>
          </ResumenGrupo>
        </div>
      )}
    />
  );
}
