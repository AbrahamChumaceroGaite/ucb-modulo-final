'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, Input, Select } from '@/shared/ui/primitives';
import {
  FieldList,
  FormField,
  FormLayout,
  FormRow,
  FormWizard,
  ResumenDato,
  ResumenGrupo,
  type PasoFormulario,
} from '@/shared/ui/patterns';
import { crearRecetaSchema, type CrearReceta, type Receta } from '../../domain/receta.schema';
import { conUnidad, type ReferenciaDeProducto } from '../../domain/referencia-producto.schema';
import { aFormulario } from '../../domain/receta.mapper';

/**
 * Alta y edición de receta, por pasos.
 *
 * Mismo asistente y mismo criterio que los otros dos formularios: si llega
 * `receta`, arranca con sus valores y el botón final cambia de texto.
 *
 * ## Por qué los pasos son estos tres
 *
 * Porque son tres preguntas distintas —qué se hace, con qué, y cómo— y porque
 * las dos últimas son **listas que crecen**. Meterlas en un solo paso deja una
 * pantalla que se estira sin fin y en la que el botón de guardar desaparece por
 * abajo.
 *
 * ## `useFieldArray` y no un `useState` con un array
 *
 * Es la vía que React Hook Form declara para listas de campos: mantiene la
 * identidad de cada fila con su propio `id`, así que añadir una en medio no
 * mueve lo tecleado en las demás. Con un array en `useState` hay que
 * sincronizar dos fuentes de verdad, y el error clásico —los valores bailan al
 * borrar una fila— aparece el primer día.
 *
 * ## Los pasos no llevan número
 *
 * `PasoRecetaRequest` solo acepta `descripcion`: el orden lo da la posición en
 * la lista. Por eso `<FieldList numerada>` pinta el índice pero no lo deja
 * editar — ver el porqué en ese archivo.
 */
export function RecetaForm({
  receta,
  productos,
  guardando,
  onGuardar,
  onCancelar,
}: {
  receta?: Receta;
  productos: readonly ReferenciaDeProducto[];
  guardando: boolean;
  onGuardar: (valores: CrearReceta) => void;
  onCancelar: () => void;
}) {
  const form = useForm<CrearReceta>({
    resolver: zodResolver(crearRecetaSchema),
    defaultValues: receta
      ? aFormulario(receta)
      : {
          titulo: '',
          cantidad: 1,
          idProductoObtenido: '',
          ingredientes: [{ idProducto: '', cantidad: 0 }],
          pasos: [{ descripcion: '' }],
        },
  });

  const errores = form.formState.errors;

  const ingredientes = useFieldArray({ control: form.control, name: 'ingredientes' });
  const pasos = useFieldArray({ control: form.control, name: 'pasos' });

  const porId = new Map(productos.map((producto) => [producto.id, producto]));
  const opcionesDeProducto = productos.map((producto) => ({
    valor: producto.id,
    etiqueta: producto.nombre,
  }));

  const listaDePasos: PasoFormulario<CrearReceta>[] = [
    {
      clave: 'que',
      titulo: 'Qué se hace',
      campos: ['titulo', 'idProductoObtenido', 'cantidad'],
      contenido: (
        <FormLayout>
          <FormRow>
            <FormField>
              <Field etiqueta="Título" requerido error={errores.titulo?.message}>
                <Input placeholder="Capuchino de la casa" {...form.register('titulo')} />
              </Field>
            </FormField>
          </FormRow>

          <FormRow>
            <FormField tramo="mitad" minimo="10rem">
              <Field
                etiqueta="Se obtiene"
                requerido
                error={errores.idProductoObtenido?.message}
                ayuda="El producto que sale de esta receta"
              >
                <Select
                  marcador="Elegir…"
                  opciones={opcionesDeProducto}
                  {...form.register('idProductoObtenido')}
                />
              </Field>
            </FormField>

            <FormField tramo="mitad" minimo="9rem">
              <Field
                etiqueta="Rinde"
                requerido
                error={errores.cantidad?.message}
                ayuda="Cuánto sale de una tanda"
              >
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('cantidad', { valueAsNumber: true })}
                />
              </Field>
            </FormField>
          </FormRow>
        </FormLayout>
      ),
    },
    {
      clave: 'ingredientes',
      titulo: 'Con qué',
      campos: ['ingredientes'],
      contenido: (
        <FieldList
          titulo="Ingredientes"
          ayuda="Lo que se gasta de la despensa"
          textoAnadir="Añadir ingrediente"
          etiquetaQuitar={(indice) => `Quitar el ingrediente ${indice + 1}`}
          {...(errores.ingredientes?.message ? { error: errores.ingredientes.message } : {})}
          onAnadir={() => ingredientes.append({ idProducto: '', cantidad: 0 })}
          onQuitar={(indice) => ingredientes.remove(indice)}
          filas={ingredientes.fields.map((fila, indice) => (
            <FormRow key={fila.id}>
              <FormField tramo="mitad" minimo="10rem">
                <Field
                  etiqueta="Producto"
                  requerido
                  error={errores.ingredientes?.[indice]?.idProducto?.message}
                >
                  <Select
                    marcador="Elegir…"
                    opciones={opcionesDeProducto}
                    {...form.register(`ingredientes.${indice}.idProducto`)}
                  />
                </Field>
              </FormField>

              <FormField tramo="mitad" minimo="8rem">
                <Field
                  etiqueta="Cantidad"
                  requerido
                  error={errores.ingredientes?.[indice]?.cantidad?.message}
                >
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register(`ingredientes.${indice}.cantidad`, { valueAsNumber: true })}
                  />
                </Field>
              </FormField>
            </FormRow>
          ))}
        />
      ),
    },
    {
      clave: 'pasos',
      titulo: 'Cómo',
      campos: ['pasos'],
      contenido: (
        <FieldList
          numerada
          titulo="Pasos"
          ayuda="En orden. El número sale de la posición"
          textoAnadir="Añadir paso"
          etiquetaQuitar={(indice) => `Quitar el paso ${indice + 1}`}
          {...(errores.pasos?.message ? { error: errores.pasos.message } : {})}
          onAnadir={() => pasos.append({ descripcion: '' })}
          onQuitar={(indice) => pasos.remove(indice)}
          filas={pasos.fields.map((fila, indice) => (
            <Field
              key={fila.id}
              etiqueta={`Paso ${indice + 1}`}
              requerido
              error={errores.pasos?.[indice]?.descripcion?.message}
            >
              <Input
                placeholder="Vaporizar la leche a 60 °C"
                {...form.register(`pasos.${indice}.descripcion`)}
              />
            </Field>
          ))}
        />
      ),
    },
  ];

  return (
    <FormWizard
      form={form}
      pasos={listaDePasos}
      enviando={guardando}
      onEnviar={onGuardar}
      onCancelar={onCancelar}
      textoEnviar={receta ? 'Guardar cambios' : 'Añadir al recetario'}
      resumen={(valores) => {
        const obtenido = porId.get(valores.idProductoObtenido);

        return (
          <div className="flex flex-col gap-3">
            <ResumenGrupo titulo="Qué se hace">
              <ResumenDato etiqueta="Título">{valores.titulo}</ResumenDato>
              <ResumenDato etiqueta="Se obtiene">{obtenido?.nombre ?? '—'}</ResumenDato>
              <ResumenDato etiqueta="Rinde">
                {conUnidad(valores.cantidad, obtenido)}
              </ResumenDato>
            </ResumenGrupo>

            <ResumenGrupo titulo="Con qué">
              {valores.ingredientes.map((ingrediente, indice) => (
                <ResumenDato
                  key={`${ingrediente.idProducto}-${indice}`}
                  etiqueta={porId.get(ingrediente.idProducto)?.nombre ?? 'Sin elegir'}
                >
                  {conUnidad(ingrediente.cantidad, porId.get(ingrediente.idProducto))}
                </ResumenDato>
              ))}
            </ResumenGrupo>

            <ResumenGrupo titulo="Cómo">
              {valores.pasos.map((paso, indice) => (
                <ResumenDato key={indice} etiqueta={`Paso ${indice + 1}`}>
                  {paso.descripcion}
                </ResumenDato>
              ))}
            </ResumenGrupo>
          </div>
        );
      }}
    />
  );
}
