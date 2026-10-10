'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, CookingPot, Plus } from 'lucide-react';
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
import type { Receta } from '../domain/receta.schema';
import { aActualizacion } from '../domain/receta.mapper';
import { filtrarRecetas, type FiltrosDeReceta } from '../domain/receta.filtros';
import { useRecetaList } from '../application/use-receta-list';
import { useProductosDeReceta } from '../application/use-productos-de-receta';
import { useCreateReceta } from '../application/use-create-receta';
import { useUpdateReceta } from '../application/use-update-receta';
import { useDeleteReceta } from '../application/use-delete-receta';
import { RecetaCard } from './components/receta-card';
import { RecetaTabla } from './components/receta-tabla';
import { RecetaDetalle } from './components/receta-detalle';
import { RecetaForm } from './components/receta-form';
import { PASOS_TOUR_RECETAS } from './receta.tour';

/**
 * El recetario: qué lleva cada cosa de la carta y en qué orden se hace.
 *
 * Está montada con **las mismas piezas y en el mismo orden** que Personal y
 * Productos: `<ListLayout>` con cabecera, `<FilterBar>` y contenido; las tres
 * vistas de tarjeta más la tabla; el panel que empuja para la ficha; un
 * diálogo con el asistente para el alta y la edición; y el de confirmación
 * para la baja.
 *
 * Eso no es casualidad ni copia: **lo que se repite es la composición, no el
 * código**. Cada pieza está escrita una vez en `shared/ui` y aquí solo se le
 * dice qué dominio pinta. `audit-pantallas.mjs` comprueba que las tres monten
 * las diez piezas comunes y que sus recorridos guiados expliquen lo mismo.
 *
 * ## Lo propio de esta pantalla
 *
 * - **Los productos se piden aparte** (`useProductosDeReceta`), porque el
 *   backend manda ids sueltos: `idProductoObtenido` e `idProducto` son cadenas,
 *   no objetos. Sin esa lista no hay nombres que enseñar.
 * - **El estado de una receta depende de la despensa**, no de sí misma: para
 *   cuántas tandas da. Eso lo calcula el dominio, no la vista.
 * - **Los filtros son dos**: estado y qué produce. No hay más porque no hay más
 *   que el DTO permita distinguir sin inventar.
 */
export function RecetaView() {
  const router = useRouter();
  const parametros = useSearchParams();

  const busqueda = parametros.get('search') ?? '';
  const skip = Number(parametros.get('skip') ?? 0);
  const limit = Number(parametros.get('limit') ?? LIMITE_POR_DEFECTO);
  // La URL manda; si no dice nada, la última vista que se eligió aquí.
  const vista = useVistaPreferida('recetas', parametros.get('vista'));

  // Memorizado porque es la dependencia de `filas`: sin esto, un objeto nuevo
  // en cada render invalidaría el filtrado aunque la URL no haya cambiado.
  const filtros: FiltrosDeReceta = useMemo(
    () => ({
      estado: leerLista(parametros, 'estado'),
      productos: leerLista(parametros, 'producto'),
    }),
    [parametros],
  );

  const lista = useRecetaList({ skip, limit, search: busqueda || undefined });
  const { productos } = useProductosDeReceta();

  const crear = useCreateReceta();
  const actualizar = useUpdateReceta();
  const eliminar = useDeleteReceta();

  const [enDetalle, setEnDetalle] = useState<Receta | null>(null);
  const [enFormulario, setEnFormulario] = useState<Receta | 'nuevo' | null>(null);
  const [porDarDeBaja, setPorDarDeBaja] = useState<Receta | null>(null);

  const cambiarParametros = (cambios: Record<string, string | number | null>) => {
    const siguientes = new URLSearchParams(parametros.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === null || valor === '') siguientes.delete(clave);
      else siguientes.set(clave, String(valor));
    }
    const consulta = siguientes.toString();
    router.replace(consulta ? `/recetas?${consulta}` : '/recetas', { scroll: false });
  };

  const cargadas = useMemo(() => lista.data?.data ?? [], [lista.data]);
  const filas = useMemo(() => filtrarRecetas(cargadas, filtros), [cargadas, filtros]);

  /** Por id, para que tarjeta, tabla y ficha no rehagan el mapa cada una. */
  const productosPorId = useMemo(
    () => new Map(productos.map((producto) => [producto.id, producto])),
    [productos],
  );

  const cambiarLista = (clave: string, valores: string[]) =>
    cambiarParametros({ [clave]: escribirLista(valores), skip: null });

  const nombreDeProducto = (id: string) => productosPorId.get(id)?.nombre ?? id;

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
      texto: (valor) => (valor === 'activos' ? 'Activas' : 'Dadas de baja'),
      alCambiar: (valores) => cambiarLista('estado', valores),
    }),
    ...chipsDeLista({
      clave: 'producto',
      etiqueta: 'Produce',
      valores: filtros.productos,
      texto: nombreDeProducto,
      alCambiar: (valores) => cambiarLista('producto', valores),
    }),
  ];

  const opcionesDeEstado: OpcionFiltro[] = [
    { valor: '', etiqueta: 'Todas' },
    { valor: 'activos', etiqueta: 'Activas' },
    { valor: 'baja', etiqueta: 'Dadas de baja' },
  ];

  /**
   * Solo los productos que **alguna receta produce**.
   *
   * Ofrecer los treinta y cinco de la despensa llenaría la fila de opciones
   * que no devuelven nada: filtrar por «Canela» daría siempre cero, y un
   * filtro que siempre vacía la lista se lee como un fallo.
   */
  const opcionesDeProducto: OpcionFiltro[] = useMemo(() => {
    const ids = [...new Set(cargadas.map((receta) => receta.idProductoObtenido))];
    return [
      { valor: '', etiqueta: 'Todo' },
      ...ids.map((id) => ({ valor: id, etiqueta: nombreDeProducto(id) })),
    ];
    // `nombreDeProducto` depende del mapa, así que basta con esas dos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargadas, productosPorId]);

  const guardando = crear.isPending || actualizar.isPending;
  const cerrarFormulario = () => setEnFormulario(null);
  const limpiarFiltros = () =>
    cambiarParametros({ search: null, estado: null, producto: null, skip: null });

  return (
    <ListLayout
      cabecera={
        <PageHeader
          migas={[
            { etiqueta: 'Inicio', href: '/productos' },
            { etiqueta: 'Inventario' },
            { etiqueta: 'Recetas' },
          ]}
          titulo="Recetas"
          descripcion="Qué lleva cada cosa de la carta y en qué orden se prepara."
          icono={<CookingPot />}
          acciones={
            <>
              <HelpButton pasos={PASOS_TOUR_RECETAS} />
              <Button
                tono="primary"
                icono={<Plus className="size-4" />}
                onClick={() => setEnFormulario('nuevo')}
                data-tour="alta"
              >
                Nueva receta
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
                    recordarVista('recetas', siguiente);
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
              opciones={opcionesDeProducto}
              valores={filtros.productos}
              etiquetaGrupo="Filtrar por lo que produce"
              onCambiar={(valores) => cambiarLista('producto', valores)}
            />
            <FiltroDeFecha que="una receta" />
          </FilterBar>
        </div>
      }
    >
      {lista.isError ? (
        <EmptyState
          icono={<AlertTriangle className="size-5 text-error" />}
          titulo="No pudimos traer el recetario"
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
          titulo={enDetalle?.titulo ?? ''}
          subtitulo={enDetalle ? nombreDeProducto(enDetalle.idProductoObtenido) : ''}
          marca={<CookingPot />}
          panel={
            enDetalle && <RecetaDetalle receta={enDetalle} productos={productosPorId} />
          }
        >
          <div className="flex flex-col gap-4" data-tour="coleccion">
            {vista === 'tabla' ? (
              <RecetaTabla
                filas={filas}
                productos={productosPorId}
                cargando={lista.isPending}
                onVer={setEnDetalle}
                onEditar={setEnFormulario}
                onEliminar={setPorDarDeBaja}
              />
            ) : (
              <CardGrid vista={vista}>
                {filas.map((receta) => (
                  <RecetaCard
                    key={receta.id}
                    receta={receta}
                    productos={productosPorId}
                    vista={vista}
                    onVer={() => setEnDetalle(receta)}
                    onEditar={() => setEnFormulario(receta)}
                    onEliminar={() => setPorDarDeBaja(receta)}
                  />
                ))}

                {filas.length > 0 && (
                  <AddCard
                    titulo="Nueva receta"
                    descripcion="Escribe cómo se prepara algo de la carta."
                    onClick={() => setEnFormulario('nuevo')}
                  />
                )}
              </CardGrid>
            )}

            {!lista.isPending && filas.length === 0 && (
              <EmptyState
                icono={<CookingPot className="size-5" />}
                titulo={
                  aplicados.length > 0
                    ? 'Nada coincide con este filtro'
                    : 'El recetario está vacío'
                }
                mensaje={
                  aplicados.length > 0
                    ? 'Prueba a quitar alguno de los filtros de arriba.'
                    : 'Empieza por lo que más sale en barra: el capuchino y el sandwich mixto.'
                }
                accion={
                  aplicados.length > 0 ? (
                    <Button tono="contorno" onClick={limpiarFiltros}>
                      Quitar los filtros
                    </Button>
                  ) : (
                    <Button tono="primary" onClick={() => setEnFormulario('nuevo')}>
                      Escribir la primera
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
        titulo={enFormulario === 'nuevo' ? 'Nueva receta' : 'Editar receta'}
      >
        {enFormulario !== null && (
          <RecetaForm
            {...(enFormulario === 'nuevo' ? {} : { receta: enFormulario })}
            productos={productos}
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
        abierto={porDarDeBaja !== null}
        alCerrar={() => setPorDarDeBaja(null)}
        titulo="Dar de baja la receta"
        mensaje={`«${porDarDeBaja?.titulo ?? ''}» dejará de aparecer en el recetario.`}
        advertencia="Los productos que usa no se tocan: solo desaparece la preparación."
        textoConfirmar="Dar de baja"
        procesando={eliminar.isPending}
        onConfirmar={() => {
          if (!porDarDeBaja) return;
          eliminar.mutate(porDarDeBaja.id, { onSuccess: () => setPorDarDeBaja(null) });
        }}
      />
    </ListLayout>
  );
}
