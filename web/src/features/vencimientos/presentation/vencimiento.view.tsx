'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Hourglass, Plus } from 'lucide-react';
import {
  Button,
  Dialog,
  DrawerPush,
  FilterChips,
  Pagination,
  SkeletonForm,
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
import { mensajeDe } from '@/shared/api/api-error';
import { formatearIntervalo } from '@/shared/lib/format';
import { aTextoDeFecha } from '@/shared/lib/fecha-local';
import { escribirLista, leerLista } from '@/shared/lib/params-lista';
import { aParametrosDeApi, type FiltrosDeEvaluacion } from '../domain/evaluacion.filtros';
import { nombreDeCategoria, TEXTO_POR_NIVEL } from '../domain/evaluacion.lectura';
import { aRevisionNueva } from '../domain/evaluacion.mapper';
import type { Evaluacion, NivelDeRiesgo, RegistrarEvaluacion } from '../domain/evaluacion.schema';
import { useEvaluacionList } from '../application/use-evaluacion-list';
import { useModeloRiesgo } from '../application/use-modelo-riesgo';
import { useCreateEvaluacion } from '../application/use-create-evaluacion';
import { useDeleteEvaluacion } from '../application/use-delete-evaluacion';
import { EvaluacionCard } from './components/evaluacion-card';
import { EvaluacionTabla } from './components/evaluacion-tabla';
import { EvaluacionDetalle } from './components/evaluacion-detalle';
import { EvaluacionForm } from './components/evaluacion-form';
import { ModeloResumen } from './components/modelo-resumen';
import { PASOS_TOUR_VENCIMIENTOS } from './vencimiento.tour';

const RUTA = '/inventario';

/** Lo que tiene abierto el diálogo: un lote nuevo o revisar uno que ya está. */
type Formulario = { hoy: string; valores?: RegistrarEvaluacion };

/**
 * Riesgo de vencimiento de los lotes de la despensa.
 *
 * Montada con **las mismas piezas y en el mismo orden** que las otras
 * pantallas de lista —`audit-pantallas.mjs` lo comprueba—: lo que se repite es
 * la composición, no el código.
 *
 * ## Lo propio de esta pantalla
 *
 * - **Los filtros van al servidor.** El servicio de predicción acepta riesgo,
 *   categoría e intervalo de vencimiento, así que el total y el paginador
 *   hablan de lo filtrado. El filtro de fecha funciona y acota por
 *   **vencimiento**, que es la fecha que importa aquí.
 * - **No hay datos falsos.** Si `ml-api` no responde, la pantalla lo dice; no
 *   enseña probabilidades inventadas (ver `vencimiento.puertos.ts`).
 * - **No se edita.** Una evaluación es lo que el modelo dijo un día. Lo que sí
 *   se puede es revisar el mismo lote otra vez: la nueva evaluación reemplaza
 *   a la anterior en la lista (una por lote, la más reciente).
 * - **Al evaluar, se abre la ficha del resultado.** Es lo que la persona vino
 *   a saber; dejarla buscando su lote en la lista sería esconderle la respuesta.
 * - **La ficha del modelo va arriba**, con su recall y sus falsas alarmas: una
 *   predicción sin su tasa de acierto al lado se lee como una certeza.
 */
export function VencimientoView() {
  const router = useRouter();
  const parametros = useSearchParams();

  const busqueda = parametros.get('search') ?? '';
  const skip = Number(parametros.get('skip') ?? 0);
  const limit = Number(parametros.get('limit') ?? LIMITE_POR_DEFECTO);
  const vista = useVistaPreferida('vencimientos', parametros.get('vista'));

  const filtros: FiltrosDeEvaluacion = useMemo(
    () => ({
      riesgo: leerLista(parametros, 'riesgo'),
      categoria: leerLista(parametros, 'categoria'),
      desde: parametros.get('desde') ?? '',
      hasta: parametros.get('hasta') ?? '',
    }),
    [parametros],
  );

  const params = useMemo(
    () => aParametrosDeApi({ skip, limit, ...(busqueda ? { search: busqueda } : {}) }, filtros),
    [skip, limit, busqueda, filtros],
  );

  const lista = useEvaluacionList(params);
  const modelo = useModeloRiesgo();
  const evaluar = useCreateEvaluacion();
  const quitar = useDeleteEvaluacion();

  const [enDetalle, setEnDetalle] = useState<Evaluacion | null>(null);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [porQuitar, setPorQuitar] = useState<Evaluacion | null>(null);

  const cambiarParametros = (cambios: Record<string, string | number | null>) => {
    const siguientes = new URLSearchParams(parametros.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === null || valor === '') siguientes.delete(clave);
      else siguientes.set(clave, String(valor));
    }
    const consulta = siguientes.toString();
    router.replace(consulta ? `${RUTA}?${consulta}` : RUTA, { scroll: false });
  };

  const cambiarLista = (clave: string, valores: string[]) =>
    cambiarParametros({ [clave]: escribirLista(valores), skip: null });

  // «Hoy» se calcula al abrir, no al pintar: así el servidor y el navegador
  // no discrepan si la página se renderizó antes de medianoche.
  const hoy = () => aTextoDeFecha(new Date()) ?? '';
  const evaluarNuevo = () => setFormulario({ hoy: hoy() });
  const revisar = (evaluacion: Evaluacion) => {
    const fecha = hoy();
    setFormulario({ hoy: fecha, valores: aRevisionNueva(evaluacion, fecha) });
  };

  const filas = lista.data?.data ?? [];

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
      clave: 'riesgo',
      etiqueta: 'Riesgo',
      valores: filtros.riesgo,
      texto: (valor) => TEXTO_POR_NIVEL[valor as NivelDeRiesgo] ?? valor,
      alCambiar: (valores) => cambiarLista('riesgo', valores),
    }),
    ...chipsDeLista({
      clave: 'categoria',
      etiqueta: 'Categoría',
      valores: filtros.categoria,
      texto: nombreDeCategoria,
      alCambiar: (valores) => cambiarLista('categoria', valores),
    }),
    ...(filtros.desde || filtros.hasta
      ? [
          {
            clave: 'fechas',
            etiqueta: 'Vence',
            valor: formatearIntervalo(filtros.desde, filtros.hasta),
            quitar: () => cambiarParametros({ desde: null, hasta: null, skip: null }),
          },
        ]
      : []),
  ];

  const opcionesDeRiesgo: OpcionFiltro[] = [
    { valor: '', etiqueta: 'Todos' },
    { valor: 'alto', etiqueta: TEXTO_POR_NIVEL.alto },
    { valor: 'vigilar', etiqueta: TEXTO_POR_NIVEL.vigilar },
    { valor: 'bajo', etiqueta: TEXTO_POR_NIVEL.bajo },
  ];

  /** Las categorías que el modelo conoce, no una lista escrita aquí. */
  const opcionesDeCategoria: OpcionFiltro[] = useMemo(() => {
    const categorias = [...new Set((modelo.data?.insumos ?? []).map((insumo) => insumo.categoria))];
    return [
      { valor: '', etiqueta: 'Todas' },
      ...categorias.map((categoria) => ({ valor: categoria, etiqueta: nombreDeCategoria(categoria) })),
    ];
  }, [modelo.data]);

  const cerrarFormulario = () => setFormulario(null);
  const limpiarFiltros = () =>
    cambiarParametros({ search: null, riesgo: null, categoria: null, desde: null, hasta: null, skip: null });

  return (
    <ListLayout
      cabecera={
        <PageHeader
          migas={[
            { etiqueta: 'Inicio', href: '/productos' },
            { etiqueta: 'Inventario' },
            { etiqueta: 'Vencimientos' },
          ]}
          titulo="Riesgo de vencimiento"
          descripcion="Qué lotes conviene usar primero para que no terminen en la basura."
          icono={<Hourglass />}
          acciones={
            <>
              <HelpButton pasos={PASOS_TOUR_VENCIMIENTOS} />
              <Button
                tono="primary"
                icono={<Plus className="size-4" />}
                onClick={evaluarNuevo}
                data-tour="alta"
              >
                Evaluar un lote
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
                    recordarVista('vencimientos', siguiente);
                    cambiarParametros({ vista: siguiente });
                  }}
                />
              </span>
            }
          >
            <FilterChips
              opciones={opcionesDeRiesgo}
              valores={filtros.riesgo}
              etiquetaGrupo="Filtrar por riesgo"
              onCambiar={(valores) => cambiarLista('riesgo', valores)}
            />
            <FilterChips
              opciones={opcionesDeCategoria}
              valores={filtros.categoria}
              etiquetaGrupo="Filtrar por categoría"
              onCambiar={(valores) => cambiarLista('categoria', valores)}
            />
            <FiltroDeFecha
              que="un vencimiento"
              desde={filtros.desde}
              hasta={filtros.hasta}
              onCambiar={(rango) => cambiarParametros({ desde: rango.desde, hasta: rango.hasta, skip: null })}
            />
          </FilterBar>
        </div>
      }
    >
      <ModeloResumen
        modelo={modelo.data}
        cargando={modelo.isPending}
        error={modelo.isError ? mensajeDe(modelo.error) : null}
      />

      {lista.isError ? (
        <EmptyState
          icono={<AlertTriangle className="size-5 text-error" />}
          titulo="No pudimos traer las evaluaciones"
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
          titulo={enDetalle?.insumo ?? ''}
          subtitulo={enDetalle ? nombreDeCategoria(enDetalle.categoria) : ''}
          marca={<Hourglass />}
          panel={enDetalle && <EvaluacionDetalle evaluacion={enDetalle} />}
        >
          <div className="flex flex-col gap-4" data-tour="coleccion">
            {vista === 'tabla' ? (
              <EvaluacionTabla
                filas={filas}
                cargando={lista.isPending}
                onVer={setEnDetalle}
                onRevisar={revisar}
                onQuitar={setPorQuitar}
              />
            ) : (
              <CardGrid vista={vista}>
                {filas.map((evaluacion) => (
                  <EvaluacionCard
                    key={evaluacion.id}
                    evaluacion={evaluacion}
                    vista={vista}
                    onVer={() => setEnDetalle(evaluacion)}
                    onRevisar={() => revisar(evaluacion)}
                    onQuitar={() => setPorQuitar(evaluacion)}
                  />
                ))}

                {filas.length > 0 && (
                  <AddCard
                    titulo="Evaluar un lote"
                    descripcion="Pregúntale al modelo por uno que no está en la lista."
                    onClick={evaluarNuevo}
                  />
                )}
              </CardGrid>
            )}

            {!lista.isPending && filas.length === 0 && (
              <EmptyState
                icono={<Hourglass className="size-5" />}
                titulo={aplicados.length > 0 ? 'Nada coincide con este filtro' : 'No hay lotes evaluados'}
                mensaje={
                  aplicados.length > 0
                    ? 'Prueba a quitar alguno de los filtros de arriba.'
                    : 'Evalúa los perecederos que entraron esta semana: leche, frutas y fiambres primero.'
                }
                accion={
                  aplicados.length > 0 ? (
                    <Button tono="contorno" onClick={limpiarFiltros}>
                      Quitar los filtros
                    </Button>
                  ) : (
                    <Button tono="primary" onClick={evaluarNuevo}>
                      Evaluar el primero
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
        abierto={formulario !== null}
        alCerrar={() => !evaluar.isPending && cerrarFormulario()}
        titulo={formulario?.valores ? 'Revisar el lote de nuevo' : 'Evaluar un lote'}
      >
        {formulario !== null &&
          (modelo.data ? (
            <EvaluacionForm
              {...(formulario.valores ? { valores: formulario.valores } : {})}
              hoy={formulario.hoy}
              insumos={modelo.data.insumos}
              guardando={evaluar.isPending}
              onCancelar={cerrarFormulario}
              onEvaluar={(valores) =>
                evaluar.mutate(valores, {
                  // Guardar → confirmar → cerrar, y luego enseñar la respuesta.
                  onSuccess: (evaluacion) => {
                    cerrarFormulario();
                    setEnDetalle(evaluacion);
                  },
                })
              }
            />
          ) : modelo.isError ? (
            <p role="status" className="text-xs text-error">
              Sin la ficha del modelo no se sabe qué insumos puede evaluar: {mensajeDe(modelo.error)}
            </p>
          ) : (
            <SkeletonForm />
          ))}
      </Dialog>

      <ConfirmDialog
        abierto={porQuitar !== null}
        alCerrar={() => setPorQuitar(null)}
        titulo="Quitar de la lista"
        mensaje={`La evaluación de «${porQuitar?.insumo ?? ''}» dejará de aparecer aquí.`}
        advertencia="El lote no se toca: solo se olvida lo que dijo el modelo ese día."
        textoConfirmar="Quitar"
        procesando={quitar.isPending}
        onConfirmar={() => {
          if (!porQuitar) return;
          quitar.mutate(porQuitar.id, {
            onSuccess: () => {
              if (enDetalle?.id === porQuitar.id) setEnDetalle(null);
              setPorQuitar(null);
            },
          });
        }}
      />
    </ListLayout>
  );
}
