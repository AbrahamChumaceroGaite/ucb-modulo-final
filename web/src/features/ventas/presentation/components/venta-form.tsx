'use client';

import { useFieldArray, useForm, useWatch } from 'react-hook-form';
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
import { formatearMoneda } from '@/shared/lib/format';
import {
  crearVentaSchema,
  subtotalDeLinea,
  totalProvisional,
  type CrearVenta,
  type EstadoVenta,
  type Venta,
} from '../../domain/venta.schema';
import {
  nombreDeCliente,
  type ClienteDeVenta,
  type ProductoDeVenta,
} from '../../domain/referencias.schema';
import { aFormulario } from '../../domain/venta.mapper';

/**
 * El cobro, por pasos.
 *
 * Mismo asistente y mismo criterio que los otros tres formularios: si llega
 * `venta`, arranca con sus valores y el botón final cambia de texto.
 *
 * ## Por qué solo dos pasos y no tres
 *
 * Porque un cobro son dos preguntas: **qué se lleva** y **cómo queda**. Los
 * otros formularios tienen tres porque tienen tres asuntos; forzar aquí un
 * tercero para que «todos tengan tres» sería simetría por simetría. Lo que se
 * mantiene igual es el asistente, la revisión y el botón que confirma.
 *
 * ## El vendedor no se pregunta
 *
 * `CrearVentaRequest` exige `idUsuario`, y lo pone la sesión
 * (`use-create-venta.ts`). Un desplegable de «vendedor» dejaría registrar
 * ventas a nombre de otro, además de pedir un dato que el sistema ya sabe.
 *
 * ## El total se enseña, no se manda
 *
 * `useWatch` recalcula la suma mientras se teclea, porque quien cobra necesita
 * ver la cifra **antes** de guardar. Pero ese número no viaja: `total` y
 * `subtotal` los calcula el servidor. Es la diferencia entre ayudar a leer y
 * ofrecer una segunda verdad.
 *
 * ## Elegir producto pone su precio, y se puede cambiar
 *
 * El precio de la línea arranca en el del producto porque es lo que ahorra
 * teclear, pero sigue siendo editable: `precioUnitario` es un campo de la
 * línea en el backend, no una copia del producto — un precio pactado o una
 * promoción no deberían obligar a tocar la carta.
 */
export function VentaForm({
  venta,
  estados,
  productos,
  clientes,
  guardando,
  onGuardar,
  onCancelar,
}: {
  venta?: Venta;
  estados: readonly EstadoVenta[];
  /** Solo los vendibles: un insumo de despensa no se cobra en barra. */
  productos: readonly ProductoDeVenta[];
  /** Solo los que se pueden elegir hoy; los de baja no se ofrecen. */
  clientes: readonly ClienteDeVenta[];
  guardando: boolean;
  onGuardar: (valores: CrearVenta) => void;
  onCancelar: () => void;
}) {
  const form = useForm<CrearVenta>({
    resolver: zodResolver(crearVentaSchema),
    defaultValues: venta
      ? aFormulario(venta)
      : {
          idCliente: '',
          idEstadoVenta: estados[0]?.id ?? '',
          detalles: [{ idProducto: '', precioUnitario: 0, cantidad: 1, descuentoAplicado: 0 }],
        },
  });

  const errores = form.formState.errors;
  const lineas = useFieldArray({ control: form.control, name: 'detalles' });

  // `useWatch` y no `form.watch()`: repinta solo lo que depende de las líneas,
  // en vez de todo el formulario en cada tecla.
  const detalles = useWatch({ control: form.control, name: 'detalles' }) ?? [];
  const total = totalProvisional(
    detalles.map((linea) => ({
      precioUnitario: Number(linea?.precioUnitario) || 0,
      cantidad: Number(linea?.cantidad) || 0,
      descuentoAplicado: Number(linea?.descuentoAplicado) || 0,
    })),
  );

  const productoPorId = new Map(productos.map((producto) => [producto.id, producto]));

  const opcionesDeProducto = productos.map((producto) => ({
    valor: producto.id,
    etiqueta: `${producto.nombre} · ${formatearMoneda(producto.precio)}`,
  }));

  const opcionesDeCliente = clientes.map((cliente) => ({
    valor: cliente.id,
    etiqueta: nombreDeCliente(cliente),
  }));

  const opcionesDeEstado = estados.map((estado) => ({
    valor: estado.id,
    etiqueta: estado.nombre,
  }));

  /** Al elegir producto se propone su precio, salvo que ya haya uno puesto. */
  const proponerPrecio = (indice: number, idProducto: string) => {
    const producto = productoPorId.get(idProducto);
    const actual = form.getValues(`detalles.${indice}.precioUnitario`);
    if (producto && (!actual || actual === 0)) {
      form.setValue(`detalles.${indice}.precioUnitario`, producto.precio, {
        shouldValidate: true,
      });
    }
  };

  const pasos: PasoFormulario<CrearVenta>[] = [
    {
      clave: 'lineas',
      titulo: 'Qué se lleva',
      campos: ['detalles'],
      contenido: (
        <div className="flex flex-col gap-3">
          <FieldList
            titulo="Líneas"
            ayuda="Producto, cuántos y descuento si lo hay"
            textoAnadir="Añadir línea"
            etiquetaQuitar={(indice) => `Quitar la línea ${indice + 1}`}
            {...(errores.detalles?.message ? { error: errores.detalles.message } : {})}
            onAnadir={() =>
              lineas.append({
                idProducto: '',
                precioUnitario: 0,
                cantidad: 1,
                descuentoAplicado: 0,
              })
            }
            onQuitar={(indice) => lineas.remove(indice)}
            filas={lineas.fields.map((fila, indice) => (
              <FormLayout key={fila.id}>
                <FormRow>
                  <FormField>
                    <Field
                      etiqueta="Producto"
                      requerido
                      error={errores.detalles?.[indice]?.idProducto?.message}
                    >
                      <Select
                        marcador="Elegir…"
                        opciones={opcionesDeProducto}
                        {...form.register(`detalles.${indice}.idProducto`, {
                          onChange: (evento) => proponerPrecio(indice, evento.target.value),
                        })}
                      />
                    </Field>
                  </FormField>
                </FormRow>

                <FormRow>
                  <FormField tramo="tercio" minimo="6rem">
                    <Field
                      etiqueta="Cantidad"
                      requerido
                      error={errores.detalles?.[indice]?.cantidad?.message}
                    >
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register(`detalles.${indice}.cantidad`, { valueAsNumber: true })}
                      />
                    </Field>
                  </FormField>

                  <FormField tramo="tercio" minimo="6rem">
                    <Field
                      etiqueta="Precio"
                      requerido
                      error={errores.detalles?.[indice]?.precioUnitario?.message}
                    >
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register(`detalles.${indice}.precioUnitario`, {
                          valueAsNumber: true,
                        })}
                      />
                    </Field>
                  </FormField>

                  <FormField tramo="tercio" minimo="6rem">
                    <Field
                      etiqueta="Descuento"
                      error={errores.detalles?.[indice]?.descuentoAplicado?.message}
                      ayuda="Sobre la línea"
                    >
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register(`detalles.${indice}.descuentoAplicado`, {
                          valueAsNumber: true,
                        })}
                      />
                    </Field>
                  </FormField>
                </FormRow>
              </FormLayout>
            ))}
          />

          {/* La cifra mientras se teclea. No viaja: la calcula el servidor. */}
          <p className="flex items-baseline justify-between border-t border-outline-variant pt-2 text-sm">
            <span className="text-on-surface-variant">Total provisional</span>
            <span className="font-semibold tabular-nums text-on-surface">
              {formatearMoneda(total)}
            </span>
          </p>
        </div>
      ),
    },
    {
      clave: 'cierre',
      titulo: 'Cómo queda',
      campos: ['idEstadoVenta', 'idCliente'],
      contenido: (
        <FormLayout>
          <FormRow>
            <FormField>
              <Field etiqueta="Estado" requerido error={errores.idEstadoVenta?.message}>
                <Select
                  marcador="Elegir…"
                  opciones={opcionesDeEstado}
                  {...form.register('idEstadoVenta')}
                />
              </Field>
            </FormField>
          </FormRow>

          <FormRow>
            <FormField>
              <Field
                etiqueta="Cliente"
                error={errores.idCliente?.message}
                ayuda="Opcional. Sin cliente es una venta de mostrador"
              >
                <Select
                  marcador="Mostrador"
                  opciones={opcionesDeCliente}
                  {...form.register('idCliente')}
                />
              </Field>
            </FormField>
          </FormRow>

          <p className="text-xs text-on-surface-variant">
            La fecha y el vendedor los pone el sistema: la hora del servidor y quien tiene la
            sesión abierta.
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
      textoEnviar={venta ? 'Guardar cambios' : 'Registrar venta'}
      resumen={(valores) => (
        <div className="flex flex-col gap-3">
          <ResumenGrupo titulo="Qué se lleva">
            {valores.detalles.map((linea, indice) => (
              <ResumenDato
                key={`${linea.idProducto}-${indice}`}
                etiqueta={`${productoPorId.get(linea.idProducto)?.nombre ?? 'Sin elegir'} × ${linea.cantidad}`}
              >
                {formatearMoneda(subtotalDeLinea(linea))}
              </ResumenDato>
            ))}
            <ResumenDato etiqueta="Total provisional">
              {formatearMoneda(totalProvisional(valores.detalles))}
            </ResumenDato>
          </ResumenGrupo>

          <ResumenGrupo titulo="Cómo queda">
            <ResumenDato etiqueta="Estado">
              {estados.find((estado) => estado.id === valores.idEstadoVenta)?.nombre ?? '—'}
            </ResumenDato>
            <ResumenDato etiqueta="Cliente">
              {clientes.find((cliente) => cliente.id === valores.idCliente)
                ? nombreDeCliente(
                    clientes.find((cliente) => cliente.id === valores.idCliente)!,
                  )
                : 'Mostrador'}
            </ResumenDato>
          </ResumenGrupo>
        </div>
      )}
    />
  );
}
