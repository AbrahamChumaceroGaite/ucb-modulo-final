'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, BarChart3, Download, Plus, Receipt } from 'lucide-react';
import {
  Button,
  Dialog,
  DrawerPush,
  FilterChips,
  Pagination,
  type OpcionFiltro,
} from '@/shared/ui/primitives';
import {
  AddCard,
  CardGrid,
  chipsDeLista,
  ConfirmDialog,
  EmptyState,
  FilterBar,
  FiltroDeFecha,
  HelpButton,
  ListLayout,
  PageHeader,
  recordarVista,
  useVistaPreferida,
  ViewSwitcher,
  VISTAS,
  type FiltroAplicado,
} from '@/shared/ui/patterns';
import { LIMITE_POR_DEFECTO } from '@/shared/api/paginated';
import { escribirLista, leerLista } from '@/shared/lib/params-lista';
import { mensajeDe } from '@/shared/api/api-error';
import { formatearIntervalo, formatearMoneda } from '@/shared/lib/format';
import type { Venta } from '../domain/venta.schema';
import { aActualizacion } from '../domain/venta.mapper';
import { filtrarVentas, totalDeLoMostrado, type FiltrosDeVenta } from '../domain/venta.filtros';
import { nombreDeCliente } from '../domain/referencias.schema';
import { useVentaList } from '../application/use-venta-list';
import { useCatalogosDeVenta } from '../application/use-catalogos-de-venta';
import { useCreateVenta } from '../application/use-create-venta';
import { useUpdateVenta } from '../application/use-update-venta';
import { useDeleteVenta } from '../application/use-delete-venta';
import { useReporteDeVentas } from '../application/use-reporte-de-ventas';
import { VentaCard } from './components/venta-card';
import { VentaTabla } from './components/venta-tabla';
import { VentaDetalle } from './components/venta-detalle';
import { VentaForm } from './components/venta-form';
import { VentaResumen } from './components/venta-resumen';
import { PASOS_TOUR_VENTAS } from './venta.tour';

/**
 * El libro de ventas: lo que salió por la barra, ticket a ticket.
 *
 * Está montada con **las mismas piezas y en el mismo orden** que Personal,
 * Productos y Recetas. Eso no es casualidad ni copia: **lo que se repite es la
 * composición, no el código**. Cada pieza está escrita una vez en `shared/ui`
 * y aquí solo se le dice qué dominio pinta. `audit-pantallas.mjs` comprueba
 * que las cuatro monten las diez piezas comunes y que sus recorridos
 * expliquen lo mismo.
 *
 * ## Lo propio de esta pantalla
 *
 * - **El filtro de fecha funciona.** Es la única de las cuatro donde no está
 *   apagado, porque `VentaResponse.fechaVenta` es el único campo de fecha que
 *   el backend expone en todo el proyecto.
 * - **Hay una suma de lo que se está mirando.** Un libro de ventas sin total
 *   obliga a sacar la calculadora, que es exactamente lo que no debe pasar al
 *   cuadrar caja.
 * - **Tres listas se piden aparte** (`useCatalogosDeVenta`), porque el backend
 *   manda `idUsuario`, `idCliente` e `idProducto` como cadenas sueltas.
 * - **El vendedor no se elige**: lo pone la sesión.
 */
export function VentaView() {
  const router = useRouter();
  const parametros = useSearchParams();

  const busqueda = parametros.get('search') ?? '';
  const skip = Number(parametros.get('skip') ?? 0);
  const limit = Number(parametros.get('limit') ?? LIMITE_POR_DEFECTO);
  // La URL manda; si no dice nada, la última vista que se eligió aquí.
  const vista = useVistaPreferida('ventas', parametros.get('vista'));
  // Si el resumen está abierto también vive en la dirección (regla 8.11): un
  // enlace a «las ventas de ayer con sus gráficos» tiene que llevar a eso.
  const conResumen = parametros.get('resumen') === '1';

  // Memorizado porque es la dependencia de `filas`: sin esto, un objeto nuevo
  // en cada render invalidaría el filtrado aunque la URL no haya cambiado.
  const filtros: FiltrosDeVenta = useMemo(
    () => ({
      estado: leerLista(parametros, 'estado'),
      estados: leerLista(parametros, 'estadoVenta'),
      desde: parametros.get('desde') ?? '',
      hasta: parametros.get('hasta') ?? '',
    }),
    [parametros],
  );

  const lista = useVentaList({ skip, limit, search: busqueda || undefined });
  const { estados, clientes, clientesElegibles, productos, productosElegibles } =
    useCatalogosDeVenta();

  const crear = useCreateVenta();
  const actualizar = useUpdateVenta();
  const eliminar = useDeleteVenta();

  const [enDetalle, setEnDetalle] = useState<Venta | null>(null);
  const [enFormulario, setEnFormulario] = useState<Venta | 'nuevo' | null>(null);
  const [porAnular, setPorAnular] = useState<Venta | null>(null);

  const cambiarParametros = (cambios: Record<string, string | number | null>) => {
    const siguientes = new URLSearchParams(parametros.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === null || valor === '') siguientes.delete(clave);
      else siguientes.set(clave, String(valor));
    }
    const consulta = siguientes.toString();
    router.replace(consulta ? `/ventas?${consulta}` : '/ventas', { scroll: false });
  };

  const cargadas = useMemo(() => lista.data?.data ?? [], [lista.data]);
  const filas = useMemo(() => filtrarVentas(cargadas, filtros), [cargadas, filtros]);

  /**
   * Los nombres, resueltos una vez.
   *
   * Se usan **todos** los clientes y productos, no solo los elegibles: una
   * venta vieja de un cliente dado de baja tiene que seguir enseñando su
   * nombre. Lo que no puede es ofrecerse en un cobro nuevo, y de eso se
   * encarga `clientesElegibles`.
   */
  const clientePorId = useMemo(
    () => new Map(clientes.map((cliente) => [cliente.id, cliente])),
    [clientes],
  );
  const productoPorId = useMemo(
    () => new Map(productos.map((producto) => [producto.id, producto])),
    [productos],
  );

  const nombreDelCliente = (venta: Venta) => {
    const cliente = venta.idCliente ? clientePorId.get(venta.idCliente) : undefined;
    return cliente ? nombreDeCliente(cliente) : undefined;
  };

  // Sin el nombre resuelto se enseña el id: es feo y es cierto. Inventar un
  // «Producto desconocido» escondería el fallo.
  const nombreDelProducto = (id: string) => productoPorId.get(id)?.nombre ?? id;

  const reporte = useReporteDeVentas({
    filtros,
    busqueda,
    nombreDelCliente: (idCliente) => {
      const cliente = idCliente ? clientePorId.get(idCliente) : undefined;
      return cliente ? nombreDeCliente(cliente) : undefined;
    },
  });

  const cambiarLista = (clave: string, valores: string[]) =>
    cambiarParametros({ [clave]: escribirLista(valores), skip: null });

  const aplicados: FiltroAplicado[] = [
    ...(busqueda
      ? [
          {
            clave: 'search',
            etiqueta: 'Busca',
            valor: busqueda,
            quitar: () => cambiarParametros({ search: null, skip: null }),
          },
        ]
      : []),
    ...chipsDeLista({
      clave: 'estado',
      etiqueta: 'Estado',
      valores: filtros.estado,
      texto: (valor) => (valor === 'activas' ? 'Registradas' : 'Anuladas'),
      alCambiar: (valores) => cambiarLista('estado', valores),
    }),
    ...chipsDeLista({
      clave: 'estadoVenta',
      etiqueta: 'Cómo quedó',
      valores: filtros.estados,
      texto: (id) => estados.find((estado) => estado.id === id)?.nombre ?? id,
      alCambiar: (valores) => cambiarLista('estadoVenta', valores),
    }),
    ...(filtros.desde || filtros.hasta
      ? [
          {
            clave: 'fechas',
            etiqueta: 'Fechas',
            valor: formatearIntervalo(filtros.desde, filtros.hasta),
            quitar: () => cambiarParametros({ desde: null, hasta: null, skip: null }),
          },
        ]
      : []),
  ];

  const opcionesDeEstado: OpcionFiltro[] = [
    { valor: '', etiqueta: 'Todas' },
    { valor: 'activas', etiqueta: 'Registradas' },
    { valor: 'baja', etiqueta: 'Anuladas' },
  ];

  const opcionesDeEstadoVenta: OpcionFiltro[] = [
    { valor: '', etiqueta: 'Todo' },
    ...estados.map((estado) => ({ valor: estado.id, etiqueta: estado.nombre })),
  ];

  const guardando = crear.isPending || actualizar.isPending;
  const cerrarFormulario = () => setEnFormulario(null);
  const limpiarFiltros = () =>
    cambiarParametros({
      search: null,
      estado: null,
      estadoVenta: null,
      desde: null,
      hasta: null,
      skip: null,
      // `resumen` no se toca: limpiar filtros acota la lista, no cierra lo
      // que se había abierto para mirarla.
    });

  return (
    <ListLayout
      cabecera={
        <PageHeader
          migas={[
            { etiqueta: 'Inicio', href: '/productos' },
            { etiqueta: 'Ventas' },
          ]}
          titulo="Ventas"
          descripcion="Lo que sale por la barra, ticket a ticket."
          icono={<Receipt />}
          acciones={
            <>
              <HelpButton pasos={PASOS_TOUR_VENTAS} />

              <Button
                tono="contorno"
                icono={<BarChart3 className="size-4" />}
                aria-pressed={conResumen}
                onClick={() => cambiarParametros({ resumen: conResumen ? null : '1' })}
              >
                Resumen
              </Button>

              {/* Mientras prepara, el botón queda ocupado: `cargando` lo
                  deshabilita y pinta los puntos. La guardia de verdad contra
                  descargas repetidas está en el caso de uso, porque
                  deshabilitar solo tapa el clic. */}
              <Button
                tono="contorno"
                icono={<Download className="size-4" />}
                cargando={reporte.preparando}
                etiquetaCargando="Preparando el reporte"
                onClick={() => void reporte.descargar()}
              >
                Reporte
              </Button>

              <Button
                tono="primary"
                icono={<Plus className="size-4" />}
                onClick={() => setEnFormulario('nuevo')}
                data-tour="alta"
              >
                Nueva venta
              </Button>
            </>
          }
        />
      }
      filtros={
        <div data-tour="filtros">
          <FilterBar
            aplicados={aplicados}
            onLimpiar={limpiarFiltros}
            vista={
              <span data-tour="vistas">
                <ViewSwitcher
                  vista={vista}
                  opciones={VISTAS}
                  onCambiar={(siguiente) => {
                    recordarVista('ventas', siguiente);
                    cambiarParametros({ vista: siguiente });
                  }}
                />
              </span>
            }
          >
            <FilterChips
              opciones={opcionesDeEstado}
              valores={filtros.estado}
              etiquetaGrupo="Filtrar por estado"
              onCambiar={(valores) => cambiarLista('estado', valores)}
            />
            <FilterChips
              opciones={opcionesDeEstadoVenta}
              valores={filtros.estados}
              etiquetaGrupo="Filtrar por cómo quedó la venta"
              onCambiar={(valores) => cambiarLista('estadoVenta', valores)}
            />
            {/* La única de las cuatro pantallas donde esto no está apagado. */}
            <FiltroDeFecha
              que="una venta"
              desde={filtros.desde}
              hasta={filtros.hasta}
              onCambiar={(rango) =>
                cambiarParametros({ desde: rango.desde, hasta: rango.hasta, skip: null })
              }
            />
          </FilterBar>
        </div>
      }
    >
      {lista.isError ? (
        <EmptyState
          icono={<AlertTriangle className="size-5 text-error" />}
          titulo="No pudimos traer las ventas"
          mensaje={mensajeDe(lista.error)}
          accion={
            <Button tono="contorno" onClick={() => void lista.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <DrawerPush
          abierto={enDetalle !== null}
          alCerrar={() => setEnDetalle(null)}
          titulo={enDetalle ? formatearMoneda(enDetalle.total) : ''}
          subtitulo={enDetalle?.estadoVenta?.nombre ?? ''}
          marca={<Receipt />}
          panel={
            enDetalle && (
              <VentaDetalle
                venta={enDetalle}
                {...(nombreDelCliente(enDetalle)
                  ? { nombreDelCliente: nombreDelCliente(enDetalle) as string }
                  : {})}
                nombreDelProducto={nombreDelProducto}
              />
            )
          }
        >
          <div className="flex flex-col gap-4" data-tour="coleccion">
            {conResumen && (
              <VentaResumen ventas={filas} nombreDelProducto={nombreDelProducto} />
            )}

            {filas.length > 0 && (
              <p className="flex items-baseline justify-end gap-2 text-sm">
                <span className="text-on-surface-variant">Suma de lo que estás viendo</span>
                <span className="font-semibold tabular-nums text-on-surface">
                  {formatearMoneda(totalDeLoMostrado(filas))}
                </span>
              </p>
            )}

            {vista === 'tabla' ? (
              <VentaTabla
                filas={filas}
                nombreDelCliente={nombreDelCliente}
                cargando={lista.isPending}
                onVer={setEnDetalle}
                onEditar={setEnFormulario}
                onEliminar={setPorAnular}
              />
            ) : (
              <CardGrid vista={vista}>
                {filas.map((venta) => (
                  <VentaCard
                    key={venta.id}
                    venta={venta}
                    {...(nombreDelCliente(venta)
                      ? { nombreDelCliente: nombreDelCliente(venta) as string }
                      : {})}
                    vista={vista}
                    onVer={() => setEnDetalle(venta)}
                    onEditar={() => setEnFormulario(venta)}
                    onEliminar={() => setPorAnular(venta)}
                  />
                ))}

                {filas.length > 0 && (
                  <AddCard
                    titulo="Nueva venta"
                    descripcion="Cobra lo que se lleva alguien ahora."
                    onClick={() => setEnFormulario('nuevo')}
                  />
                )}
              </CardGrid>
            )}

            {!lista.isPending && filas.length === 0 && (
              <EmptyState
                icono={<Receipt className="size-5" />}
                titulo={
                  aplicados.length > 0 ? 'Nada coincide con este filtro' : 'Todavía no hay ventas'
                }
                mensaje={
                  aplicados.length > 0
                    ? 'Prueba a quitar alguno de los filtros de arriba.'
                    : 'En cuanto cobres la primera, aparecerá aquí.'
                }
                accion={
                  aplicados.length > 0 ? (
                    <Button tono="contorno" onClick={limpiarFiltros}>
                      Quitar los filtros
                    </Button>
                  ) : (
                    <Button tono="primary" onClick={() => setEnFormulario('nuevo')}>
                      Cobrar la primera
                    </Button>
                  )
                }
              />
            )}

            {lista.data && lista.data.total > 0 && (
              <Pagination
                skip={lista.data.skip}
                limit={lista.data.limit}
                total={lista.data.total}
                onCambiar={(siguiente) => cambiarParametros(siguiente)}
              />
            )}
          </div>
        </DrawerPush>
      )}

      <Dialog
        abierto={enFormulario !== null}
        alCerrar={() => !guardando && cerrarFormulario()}
        titulo={enFormulario === 'nuevo' ? 'Nueva venta' : 'Corregir venta'}
      >
        {enFormulario !== null && (
          <VentaForm
            {...(enFormulario === 'nuevo' ? {} : { venta: enFormulario })}
            estados={estados}
            productos={productosElegibles}
            clientes={clientesElegibles}
            guardando={guardando}
            onCancelar={cerrarFormulario}
            onGuardar={(valores) => {
              if (enFormulario === 'nuevo') {
                return crear.mutate(valores, { onSuccess: cerrarFormulario });
              }

              const cambios = aActualizacion(enFormulario, valores);
              // Sin cambios no se llama: el aviso de éxito cantaría algo que
              // no pasó.
              if (Object.keys(cambios).length === 0) return cerrarFormulario();

              return actualizar.mutate(
                { id: enFormulario.id, cambios },
                { onSuccess: cerrarFormulario },
              );
            }}
          />
        )}
      </Dialog>

      <ConfirmDialog
        abierto={porAnular !== null}
        alCerrar={() => setPorAnular(null)}
        titulo="Anular la venta"
        mensaje={`La venta de ${formatearMoneda(porAnular?.total ?? 0)} dejará de contar en los totales.`}
        advertencia="El registro se conserva: una venta anulada sigue en el libro, marcada."
        textoConfirmar="Anular"
        procesando={eliminar.isPending}
        onConfirmar={() => {
          if (!porAnular) return;
          eliminar.mutate(porAnular.id, { onSuccess: () => setPorAnular(null) });
        }}
      />
    </ListLayout>
  );
}
