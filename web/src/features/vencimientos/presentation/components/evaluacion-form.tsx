'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DatePicker, Field, Input, Select } from '@/shared/ui/primitives';
import {
  FormField,
  FormLayout,
  FormRow,
  FormWizard,
  ResumenDato,
  ResumenGrupo,
  type PasoFormulario,
} from '@/shared/ui/patterns';
import { formatearCantidad, formatearFecha } from '@/shared/lib/format';
import { aFechaLocal, aTextoDeFecha } from '@/shared/lib/fecha-local';
import { nombreDeCategoria } from '../../domain/evaluacion.lectura';
import {
  registrarEvaluacionSchema,
  type InsumoDelModelo,
  type RegistrarEvaluacion,
} from '../../domain/evaluacion.schema';

/**
 * Evaluar un lote, por pasos.
 *
 * Son nueve datos y tres asuntos —qué lote, qué fechas, cómo se está
 * gastando—, así que va con `<FormWizard>` (regla 10.3) y la revisión al final
 * es el único sitio desde el que se envía.
 *
 * ## Solo los insumos que el modelo conoce
 *
 * El desplegable sale de la ficha del modelo, no del catálogo de productos:
 * el modelo solo sabe juzgar los insumos con los que se entrenó, y ofrecer
 * otro sería pedirle una respuesta que no tiene.
 *
 * ## El consumo de 28 días es opcional de verdad
 *
 * Un insumo nuevo no tiene cuatro semanas de historia. Vacío viaja como
 * `null` —no como 0, que diría «no se gastó nada»— y el modelo, que se entrenó
 * con esos huecos, lo maneja.
 */
export function EvaluacionForm({
  valores,
  hoy,
  insumos,
  guardando,
  onEvaluar,
  onCancelar,
}: {
  /** Si llega, es «revisar de nuevo» un lote: arranca con sus datos. */
  valores?: RegistrarEvaluacion;
  /** `AAAA-MM-DD` local. La fecha de revisión por omisión. */
  hoy: string;
  insumos: readonly InsumoDelModelo[];
  guardando: boolean;
  onEvaluar: (valores: RegistrarEvaluacion) => void;
  onCancelar: () => void;
}) {
  const form = useForm<RegistrarEvaluacion>({
    resolver: zodResolver(registrarEvaluacionSchema),
    defaultValues: valores ?? {
      codigoInsumo: '',
      fechaIngreso: '',
      fechaVencimiento: '',
      fechaRevision: hoy,
      consumo28d: null,
      stockPorDelante: 0,
    },
  });

  const errores = form.formState.errors;
  const porCodigo = new Map(insumos.map((insumo) => [insumo.codigo, insumo]));
  const codigoInsumo = useWatch({ control: form.control, name: 'codigoInsumo' });
  const unidad = porCodigo.get(codigoInsumo)?.unidad;
  const enUnidad = (texto: string) => (unidad ? `${texto} (${unidad})` : texto);

  const opcionesDeInsumo = insumos.map((insumo) => ({
    valor: insumo.codigo,
    etiqueta: `${insumo.nombre} · ${nombreDeCategoria(insumo.categoria)}`,
  }));

  const campoDeFecha = (nombre: 'fechaIngreso' | 'fechaVencimiento' | 'fechaRevision', etiqueta: string, ayuda?: string) => (
    <Field etiqueta={etiqueta} requerido error={errores[nombre]?.message} {...(ayuda ? { ayuda } : {})}>
      <Controller
        control={form.control}
        name={nombre}
        render={({ field }) => (
          <DatePicker
            valor={aFechaLocal(field.value) ?? null}
            onCambiar={(fecha) => field.onChange(aTextoDeFecha(fecha) ?? '')}
          />
        )}
      />
    </Field>
  );

  const pasos: PasoFormulario<RegistrarEvaluacion>[] = [
    {
      clave: 'lote',
      titulo: 'El lote',
      campos: ['codigoInsumo', 'cantidadInicial', 'cantidadRestante'],
      contenido: (
        <FormLayout>
          <FormRow>
            <FormField>
              <Field
                etiqueta="Insumo"
                requerido
                error={errores.codigoInsumo?.message}
                ayuda="Solo los que el modelo conoce"
              >
                <Select marcador="Elegir…" opciones={opcionesDeInsumo} {...form.register('codigoInsumo')} />
              </Field>
            </FormField>
          </FormRow>
          <FormRow>
            <FormField tramo="mitad" minimo="9rem">
              <Field etiqueta={enUnidad('Se compró')} requerido error={errores.cantidadInicial?.message}>
                <Input type="number" step="0.01" min="0" {...form.register('cantidadInicial', { valueAsNumber: true })} />
              </Field>
            </FormField>
            <FormField tramo="mitad" minimo="9rem">
              <Field
                etiqueta={enUnidad('Queda')}
                requerido
                error={errores.cantidadRestante?.message}
                ayuda="Lo que hay hoy en este lote"
              >
                <Input type="number" step="0.01" min="0" {...form.register('cantidadRestante', { valueAsNumber: true })} />
              </Field>
            </FormField>
          </FormRow>
        </FormLayout>
      ),
    },
    {
      clave: 'fechas',
      titulo: 'Fechas',
      campos: ['fechaIngreso', 'fechaVencimiento', 'fechaRevision'],
      contenido: (
        <FormLayout>
          <FormRow>
            <FormField tramo="mitad" minimo="10rem">
              {campoDeFecha('fechaIngreso', 'Entró')}
            </FormField>
            <FormField tramo="mitad" minimo="10rem">
              {campoDeFecha('fechaVencimiento', 'Vence')}
            </FormField>
          </FormRow>
          <FormRow>
            <FormField tramo="mitad" minimo="10rem">
              {campoDeFecha('fechaRevision', 'Revisión', 'Por omisión, hoy')}
            </FormField>
          </FormRow>
        </FormLayout>
      ),
    },
    {
      clave: 'consumo',
      titulo: 'Consumo',
      campos: ['consumo7d', 'consumo28d', 'stockPorDelante'],
      contenido: (
        <FormLayout>
          <FormRow>
            <FormField tramo="mitad" minimo="10rem">
              <Field
                etiqueta={enUnidad('Promedio diario, 7 días')}
                requerido
                error={errores.consumo7d?.message}
                ayuda="Del kardex de este insumo"
              >
                <Input type="number" step="0.01" min="0" {...form.register('consumo7d', { valueAsNumber: true })} />
              </Field>
            </FormField>
            <FormField tramo="mitad" minimo="10rem">
              <Field
                etiqueta={enUnidad('Promedio diario, 28 días')}
                error={errores.consumo28d?.message}
                ayuda="Opcional si es un insumo nuevo"
              >
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('consumo28d', {
                    setValueAs: (valor: unknown) => (valor === '' || valor === null ? null : Number(valor)),
                  })}
                />
              </Field>
            </FormField>
          </FormRow>
          <FormRow>
            <FormField tramo="mitad" minimo="10rem">
              <Field
                etiqueta={enUnidad('Por delante en la fila')}
                requerido
                error={errores.stockPorDelante?.message}
                ayuda="Lo que hay en lotes que vencen antes que este"
              >
                <Input type="number" step="0.01" min="0" {...form.register('stockPorDelante', { valueAsNumber: true })} />
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
      onEnviar={onEvaluar}
      onCancelar={onCancelar}
      textoEnviar="Evaluar con el modelo"
      resumen={(v) => {
        const insumo = porCodigo.get(v.codigoInsumo);
        const conUnidad = (valor: number | null) => (valor === null ? null : formatearCantidad(valor, insumo?.unidad));
        return (
          <div className="flex flex-col gap-3">
            <ResumenGrupo titulo="El lote">
              <ResumenDato etiqueta="Insumo">{insumo?.nombre ?? '—'}</ResumenDato>
              <ResumenDato etiqueta="Se compró">{conUnidad(v.cantidadInicial)}</ResumenDato>
              <ResumenDato etiqueta="Queda">{conUnidad(v.cantidadRestante)}</ResumenDato>
            </ResumenGrupo>
            <ResumenGrupo titulo="Fechas">
              <ResumenDato etiqueta="Entró">{formatearFecha(v.fechaIngreso)}</ResumenDato>
              <ResumenDato etiqueta="Vence">{formatearFecha(v.fechaVencimiento)}</ResumenDato>
              <ResumenDato etiqueta="Revisión">{formatearFecha(v.fechaRevision)}</ResumenDato>
            </ResumenGrupo>
            <ResumenGrupo titulo="Consumo">
              <ResumenDato etiqueta="Diario, 7 días">{conUnidad(v.consumo7d)}</ResumenDato>
              <ResumenDato etiqueta="Diario, 28 días">{conUnidad(v.consumo28d)}</ResumenDato>
              <ResumenDato etiqueta="Por delante">{conUnidad(v.stockPorDelante)}</ResumenDato>
            </ResumenGrupo>
          </div>
        );
      }}
    />
  );
}
