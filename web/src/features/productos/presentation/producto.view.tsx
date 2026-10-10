'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Boxes, Package, Plus } from 'lucide-react';
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
import type { Producto } from '../domain/producto.schema';
import { aActualizacion } from '../domain/producto.mapper';
import { filtrarProductos, type FiltrosDeProducto } from '../domain/producto.filtros';
import { useProductoList } from '../application/use-producto-list';
import { useCatalogos } from '../application/use-catalogos';
import { useCreateProducto } from '../application/use-create-producto';
import { useUpdateProducto } from '../application/use-update-producto';
import { useDeleteProducto } from '../application/use-delete-producto';
import { ProductoCard } from './components/producto-card';
import { ProductoTabla } from './components/producto-tabla';
import { ProductoDetalle } from './components/producto-detalle';
import { ProductoForm } from './components/producto-form';
import { PASOS_TOUR_PRODUCTOS } from './producto.tour';

/**
 * Inventario: lo que hay en la despensa y lo que se vende en la barra.
 *
 * Está montada con **las mismas piezas y en el mismo orden** que la pantalla
 * de Personal: `<ListLayout>` con cabecera, `<FilterBar>` y contenido; las
 * tres vistas de tarjeta más la tabla; el panel que empuja para la ficha; un
 * diálogo con el asistente para el alta y la edición; y el de confirmación
 * para la baja.
 *
 * Eso no es casualidad ni copia: **lo que se repite es la composición, no el
 * código**. Cada pieza está escrita una vez en `shared/ui` y aquí solo se le
 * dice qué dominio pinta. Si mañana cambia el ritmo de un listado, cambia en
 * las dos pantallas a la vez.
 *
 * ## Lo propio de esta pantalla
 *
 * - **Los catálogos se piden** (`useCatalogos`): categoría y unidad tienen
 *   endpoint. No hay ninguna lista escrita a mano.
 * - **Los filtros son tres**: estado, categoría y si está en la carta. Fueron
 *   cuatro, y el cuarto —«tipo»— filtraba por un campo que el backend no
 *   tiene; ver la nota de `producto.schema.ts`.
 * - **El padre se resuelve aquí**, no en la ficha: la vista ya tiene la página
 *   cargada, así que sabe el nombre sin pedir nada.
 */
export function ProductoView() {
  const router = useRouter();
  const parametros = useSearchParams();

  const busqueda = parametros.get('search') ?? '';
  const skip = Number(parametros.get('skip') ?? 0);
  const limit = Number(parametros.get('limit') ?? LIMITE_POR_DEFECTO);
  // La URL manda; si no dice nada, la última vista que se eligió aquí.
  const vista = useVistaPreferida('productos', parametros.get('vista'));

  // Memorizado porque es la dependencia de `filas`: sin esto, un objeto nuevo
  // en cada render invalidaría el filtrado aunque la URL no haya cambiado.
  const filtros: FiltrosDeProducto = useMemo(
    () => ({
      estado: leerLista(parametros, 'estado'),
      categorias: leerLista(parametros, 'categoria'),
      vendible: leerLista(parametros, 'vendible'),
    }),
    [parametros],
  );

  const lista = useProductoList({ skip, limit, search: busqueda || undefined });
  const { categorias, unidades } = useCatalogos();

  const crear = useCreateProducto();
  const actualizar = useUpdateProducto();
  const eliminar = useDeleteProducto();

  const [enDetalle, setEnDetalle] = useState<Producto | null>(null);
  const [enFormulario, setEnFormulario] = useState<Producto | 'nuevo' | null>(null);
  const [porDarDeBaja, setPorDarDeBaja] = useState<Producto | null>(null);

  const cambiarParametros = (cambios: Record<string, string | number | null>) => {
    const siguientes = new URLSearchParams(parametros.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === null || valor === '') siguientes.delete(clave);
      else siguientes.set(clave, String(valor));
    }
    const consulta = siguientes.toString();
    router.replace(consulta ? `/productos?${consulta}` : '/productos', { scroll: false });
  };

  const cargados = useMemo(() => lista.data?.data ?? [], [lista.data]);
  const filas = useMemo(() => filtrarProductos(cargados, filtros), [cargados, filtros]);

  /**
   * De qué productos puede ser presentación este.
   *
   * Cualquiera activo que no sea él mismo. Antes se exigía que el padre fuera
   * «Insumo», y eso dependía de un campo inventado: la base solo impide que
   * `id_producto_padre` apunte a un producto que no existe.
   */
  const posiblesPadres = useMemo(
    () =>
      cargados.filter(
        (producto) =>
          !producto.borrado &&
          producto.id !== (enFormulario === 'nuevo' ? '' : enFormulario?.id),
      ),
    [cargados, enFormulario],
  );

  const nombreDelPadre = (producto: Producto) =>
    cargados.find((otro) => otro.id === producto.idProductoPadre)?.nombre;

  const cambiarLista = (clave: string, valores: string[]) =>
    cambiarParametros({ [clave]: escribirLista(valores), skip: null });

  const nombreDeCategoria = (id: string) =>
    categorias.find((categoria) => categoria.id === id)?.nombre ?? id;

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
      texto: (valor) => (valor === 'activos' ? 'Activos' : 'Dados de baja'),
      alCambiar: (valores) => cambiarLista('estado', valores),
    }),
    ...chipsDeLista({
      clave: 'categoria',
      etiqueta: 'Categoría',
      valores: filtros.categorias,
      texto: nombreDeCategoria,
      alCambiar: (valores) => cambiarLista('categoria', valores),
    }),
    ...chipsDeLista({
      clave: 'vendible',
      etiqueta: 'En la carta',
      valores: filtros.vendible,
      texto: (valor) => (valor === 'si' ? 'Se vende' : 'Solo despensa'),
      alCambiar: (valores) => cambiarLista('vendible', valores),
    }),
  ];

  const opcionesDeEstado: OpcionFiltro[] = [
    { valor: '', etiqueta: 'Todos' },
    { valor: 'activos', etiqueta: 'Activos' },
    { valor: 'baja', etiqueta: 'Dados de baja' },
  ];

  const opcionesDeCategoria: OpcionFiltro[] = [
    { valor: '', etiqueta: 'Todas' },
    ...categorias.map((categoria) => ({ valor: categoria.id, etiqueta: categoria.nombre })),
  ];

  const opcionesDeVenta: OpcionFiltro[] = [
    { valor: '', etiqueta: 'Todo' },
    { valor: 'si', etiqueta: 'Se vende' },
    { valor: 'no', etiqueta: 'Solo despensa' },
  ];

  const guardando = crear.isPending || actualizar.isPending;
  const cerrarFormulario = () => setEnFormulario(null);
  const limpiarFiltros = () =>
    cambiarParametros({
      search: null,
      estado: null,
      categoria: null,
      vendible: null,
      skip: null,
    });

  return (
    <ListLayout
      cabecera={
        <PageHeader
          migas={[
            { etiqueta: 'Inicio', href: '/productos' },
            { etiqueta: 'Inventario' },
            { etiqueta: 'Productos' },
          ]}
          titulo="Productos"
          descripcion="Lo que hay en la despensa, lo que se vende y cuánto queda de cada cosa."
          icono={<Boxes />}
          acciones={
            <>
              <HelpButton pasos={PASOS_TOUR_PRODUCTOS} />
              <Button
                tono="primary"
                icono={<Plus className="size-4" />}
                onClick={() => setEnFormulario('nuevo')}
                data-tour="alta"
              >
                Nuevo producto
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
                    recordarVista('productos', siguiente);
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
              opciones={opcionesDeCategoria}
              valores={filtros.categorias}
              etiquetaGrupo="Filtrar por categoría"
              onCambiar={(valores) => cambiarLista('categoria', valores)}
            />
            <FilterChips
              opciones={opcionesDeVenta}
              valores={filtros.vendible}
              etiquetaGrupo="Filtrar por si está en la carta"
              onCambiar={(valores) => cambiarLista('vendible', valores)}
            />
            <FiltroDeFecha que="un producto" />
          </FilterBar>
        </div>
      }
    >
      {lista.isError ? (
        <EmptyState
          icono={<AlertTriangle className="size-5 text-error" />}
          titulo="No pudimos traer la despensa"
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
          titulo={enDetalle?.nombre ?? ''}
          subtitulo={enDetalle?.categoria?.nombre ?? ''}
          marca={enDetalle?.vendible ? <Package /> : <Boxes />}
          panel={
            enDetalle && (
              <ProductoDetalle
                producto={enDetalle}
                {...(nombreDelPadre(enDetalle)
                  ? { nombreDelPadre: nombreDelPadre(enDetalle) as string }
                  : {})}
              />
            )
          }
        >
          <div className="flex flex-col gap-4" data-tour="coleccion">
            {vista === 'tabla' ? (
              <ProductoTabla
                filas={filas}
                cargando={lista.isPending}
                onVer={setEnDetalle}
                onEditar={setEnFormulario}
                onEliminar={setPorDarDeBaja}
              />
            ) : (
              <CardGrid vista={vista}>
                {filas.map((producto) => (
                  <ProductoCard
                    key={producto.id}
                    producto={producto}
                    vista={vista}
                    onVer={() => setEnDetalle(producto)}
                    onEditar={() => setEnFormulario(producto)}
                    onEliminar={() => setPorDarDeBaja(producto)}
                  />
                ))}

                {filas.length > 0 && (
                  <AddCard
                    titulo="Nuevo producto"
                    descripcion="Da de alta un insumo o algo de la carta."
                    onClick={() => setEnFormulario('nuevo')}
                  />
                )}
              </CardGrid>
            )}

            {!lista.isPending && filas.length === 0 && (
              <EmptyState
                icono={<Boxes className="size-5" />}
                titulo={
                  aplicados.length > 0
                    ? 'Nada coincide con este filtro'
                    : 'Todavía no hay productos'
                }
                mensaje={
                  aplicados.length > 0
                    ? 'Prueba a quitar alguno de los filtros de arriba.'
                    : 'Empieza por el café y la leche: son los que más se mueven.'
                }
                accion={
                  aplicados.length > 0 ? (
                    <Button tono="contorno" onClick={limpiarFiltros}>
                      Quitar los filtros
                    </Button>
                  ) : (
                    <Button tono="primary" onClick={() => setEnFormulario('nuevo')}>
                      Añadir el primero
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
        titulo={enFormulario === 'nuevo' ? 'Nuevo producto' : 'Editar producto'}
      >
        {enFormulario !== null && (
          <ProductoForm
            {...(enFormulario === 'nuevo' ? {} : { producto: enFormulario })}
            categorias={categorias}
            unidades={unidades}
            posiblesPadres={posiblesPadres}
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
        titulo="Dar de baja el producto"
        mensaje={`«${porDarDeBaja?.nombre ?? ''}» dejará de aparecer en la despensa y en la carta.`}
        advertencia="El histórico de movimientos se conserva, pero no podrás usarlo en recetas nuevas."
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
