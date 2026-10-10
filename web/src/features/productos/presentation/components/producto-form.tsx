'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, Input, Select, Switch, Tag } from '@/shared/ui/primitives';
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
import {
  crearProductoSchema,
  type Categoria,
  type CrearProducto,
  type Producto,
  type Unidad,
} from '../../domain/producto.schema';
import { aFormulario } from '../../domain/producto.mapper';

/**
 * Alta y edición de producto, por pasos.
 *
 * Mismo asistente y mismo criterio que el formulario de usuario: si llega
 * `producto`, arranca con sus valores y el botón final cambia de texto. Tres
 * pasos y una revisión, porque son nueve campos de tres asuntos distintos.
 *
 * ## Los catálogos llegan por props
 *
 * Categoría y unidad **se piden al servidor** (`useCatalogos`) y entran
 * aquí ya resueltos. El formulario no sabe de dónde salen, no los cachea y no
 * tiene ninguna lista escrita a mano — que es lo que había antes, derivando
 * las categorías de los productos ya cargados: si una categoría no tenía
 * productos, no se podía elegir.
 *
 * ## Ya no hay paso de «tipo»
 *
 * Hubo un `<ChoiceGroup>` de «Producto / Insumo» aquí. El backend no tiene ese
 * campo —ni columna, ni DTO, ni endpoint de catálogo—, así que mandarlo era
 * mandar algo que el validador ignora. Lo que sí existe y dice lo mismo es
 * **«Se vende en la barra»**, que está en el último paso.
 *
 * ## «Presentación de» es un `<Select>` y no un buscador
 *
 * Porque la lista de posibles padres es la de insumos, corta y conocida. El
 * día que sean cientos, esto pide un buscador — y será un cambio de este
 * archivo, no del asistente.
 */
export function ProductoForm({
  producto,
  categorias,
  unidades,
  posiblesPadres,
  guardando,
  onGuardar,
  onCancelar,
}: {
  producto?: Producto;
  categorias: readonly Categoria[];
  unidades: readonly Unidad[];
  /** Insumos a los que este producto puede colgarse. Sin el propio producto. */
  posiblesPadres: readonly Producto[];
  guardando: boolean;
  onGuardar: (valores: CrearProducto) => void;
  onCancelar: () => void;
}) {
  const form = useForm<CrearProducto>({
    resolver: zodResolver(crearProductoSchema),
    defaultValues: producto
      ? aFormulario(producto)
      : {
          nombre: '',
          precio: 0,
          stock: 0,
          stockMinimo: 0,
          vendible: true,
          idUnidadActual: '',
          idCategoria: '',
          idProductoPadre: '',
        },
  });

  const errores = form.formState.errors;
  const nombreDe = <T extends { id: string }>(lista: readonly T[], id: string, campo: keyof T) =>
    (lista.find((fila) => fila.id === id)?.[campo] as string | undefined) ?? '';

  const pasos: PasoFormulario<CrearProducto>[] = [
    {
      clave: 'identidad',
      titulo: 'Qué es',
      campos: ['nombre', 'idCategoria'],
      contenido: (
        <FormLayout>
          <FormRow>
            <FormField>
              <Field etiqueta="Nombre" requerido error={errores.nombre?.message}>
                <Input placeholder="Café en grano" {...form.register('nombre')} />
              </Field>
            </FormField>
          </FormRow>

          <FormRow>
            <FormField>
              <Field etiqueta="Categoría" requerido error={errores.idCategoria?.message}>
                <Select
                  marcador="Elegir…"
                  opciones={categorias.map((categoria) => ({
                    valor: categoria.id,
                    etiqueta: categoria.nombre,
                  }))}
                  {...form.register('idCategoria')}
                />
              </Field>
            </FormField>
          </FormRow>
        </FormLayout>
      ),
    },
    {
      clave: 'existencias',
      titulo: 'Cuánto hay',
      campos: ['precio', 'idUnidadActual', 'stock', 'stockMinimo'],
      contenido: (
        <FormLayout>
          <FormRow>
            <FormField tramo="mitad" minimo="9rem">
              <Field
                etiqueta="Precio"
                requerido
                error={errores.precio?.message}
                ayuda="En bolivianos, por unidad"
              >
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('precio', { valueAsNumber: true })}
                />
              </Field>
            </FormField>

            <FormField tramo="mitad" minimo="9rem">
              <Field etiqueta="Unidad" requerido error={errores.idUnidadActual?.message}>
                <Select
                  marcador="Elegir…"
                  opciones={unidades.map((unidad) => ({
                    valor: unidad.id,
                    etiqueta: `${unidad.unidad} (${unidad.abreviatura})`,
                  }))}
                  {...form.register('idUnidadActual')}
                />
              </Field>
            </FormField>
          </FormRow>

          <FormRow>
            <FormField tramo="mitad" minimo="9rem">
              <Field etiqueta="Stock actual" error={errores.stock?.message}>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('stock', { valueAsNumber: true })}
                />
              </Field>
            </FormField>

            <FormField tramo="mitad" minimo="9rem">
              <Field
                etiqueta="Mínimo"
                error={errores.stockMinimo?.message}
                ayuda="Cero desactiva el aviso"
              >
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('stockMinimo', { valueAsNumber: true })}
                />
              </Field>
            </FormField>
          </FormRow>
        </FormLayout>
      ),
    },
    {
      clave: 'barra',
      titulo: 'En la barra',
      campos: ['vendible', 'idProductoPadre'],
      contenido: (
        <FormLayout>
          <FormRow>
            <FormField>
              {/* `Controller` y no `watch` + `setValue`: es la vía que React
                  Hook Form declara para controles propios. */}
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
                etiqueta="Presentación de"
                error={errores.idProductoPadre?.message}
                ayuda="Opcional. Para marcas del mismo insumo: «Leche Pil» cuelga de «Leche entera»"
              >
                <Select
                  marcador="Ninguno"
                  opciones={posiblesPadres.map((padre) => ({
                    valor: padre.id,
                    etiqueta: padre.nombre,
                  }))}
                  {...form.register('idProductoPadre')}
                />
              </Field>
            </FormField>
          </FormRow>

          <p className="text-xs text-on-surface-variant">
            Lo que no se vende sigue contando en la despensa: la harina no está en la carta y hay
            que reponerla igual.
          </p>
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
      onCancelar={onCancelar}
      textoEnviar={producto ? 'Guardar cambios' : 'Añadir a la despensa'}
      resumen={(valores) => {
        const abreviatura = nombreDe(unidades, valores.idUnidadActual, 'abreviatura');

        return (
          <div className="flex flex-col gap-3">
            <ResumenGrupo titulo="Qué es">
              <ResumenDato etiqueta="Nombre">{valores.nombre}</ResumenDato>
              <ResumenDato etiqueta="Categoría">
                {nombreDe(categorias, valores.idCategoria, 'nombre')}
              </ResumenDato>
            </ResumenGrupo>

            <ResumenGrupo titulo="Cuánto hay">
              <ResumenDato etiqueta="Precio">{formatearMoneda(valores.precio)}</ResumenDato>
              <ResumenDato etiqueta="Stock actual">
                {formatearCantidad(valores.stock, abreviatura)}
              </ResumenDato>
              <ResumenDato etiqueta="Avisar por debajo de">
                {valores.stockMinimo > 0
                  ? formatearCantidad(valores.stockMinimo, abreviatura)
                  : 'Sin aviso'}
              </ResumenDato>
            </ResumenGrupo>

            <ResumenGrupo titulo="En la barra">
              <ResumenDato etiqueta="Se vende">
                <Tag tono={valores.vendible ? 'success' : 'neutral'}>
                  {valores.vendible ? 'Sí, está en la carta' : 'No, solo despensa'}
                </Tag>
              </ResumenDato>
              <ResumenDato etiqueta="Presentación de">
                {nombreDe(posiblesPadres, valores.idProductoPadre, 'nombre')}
              </ResumenDato>
            </ResumenGrupo>
          </div>
        );
      }}
    />
  );
}
