'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, AtSign, Plus, ShieldCheck, UserRound, Users } from 'lucide-react';
import {
  Button,
  Dialog,
  DrawerPush,
  FilterChips,
  Pagination,
  SegmentedControl,
  Tag,
  type OpcionFiltro,
} from '@/shared/ui/primitives';
import {
  AddCard,
  CardGrid,
  ConfirmDialog,
  chipsDeLista,
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
import { ROLES } from '@/shared/config/roles';
import { nombreCompleto } from '../domain/persona.schema';
import type { Cliente } from '../domain/cliente.schema';
import type { Usuario } from '../domain/usuario.schema';
import { clienteAActualizacion, usuarioAActualizacion } from '../domain/personal.mapper';
import { esUsuario, filtrarPersonal, type FiltrosDePersonal } from '../domain/personal.filtros';
import { useUsuarioList } from '../application/use-usuario-list';
import { useCreateUsuario } from '../application/use-create-usuario';
import { useUpdateUsuario } from '../application/use-update-usuario';
import { useDeleteUsuario } from '../application/use-delete-usuario';
import { useClienteList } from '../application/use-cliente-list';
import { useCreateCliente } from '../application/use-create-cliente';
import { useUpdateCliente } from '../application/use-update-cliente';
import { useDeleteCliente } from '../application/use-delete-cliente';
import { PASOS_TOUR_PERSONAL } from './personal.tour';
import { PersonaCard } from './components/persona-card';
import { PersonalTabla } from './components/personal-tabla';
import { PersonaDetalle } from './components/persona-detalle';
import { UsuarioForm } from './components/usuario-form';
import { ClienteForm } from './components/cliente-form';

/**
 * Personal: las cuentas del equipo y la libreta de clientes.
 *
 * Es la **plantilla de la que salen todas las pantallas de listado**, así que
 * conviene leer el orden con el que está montada:
 *
 * 1. `<PageHeader>` con migas, marca del dominio y la acción de alta.
 * 2. `<FilterBar>` con lo que acota, lo que está acotando y cómo se mira.
 * 3. La rejilla de tarjetas, su vacío y el hueco para crear.
 * 4. El paginador, cuando hay más de una página.
 *
 * Todo eso lo ordena `<ListLayout>`: esta vista no decide separaciones.
 *
 * ## Todo el estado vive en la URL
 *
 * Pestaña, búsqueda, página, vista y filtros. Así una lista filtrada se
 * comparte por enlace, sobrevive a una recarga y no existe en dos sitios.
 * Auditamos un panel donde eso vivía en un store: compartir una vista
 * filtrada era imposible.
 *
 * La búsqueda llega de la **cabecera**, que escribe `?search=`. Esta pantalla
 * solo la lee, igual que cualquier otra.
 *
 * ## Qué hace y qué delega
 *
 * Compone y coordina. No pinta una tarjeta —de eso se encarga
 * `<PersonaCard>`—, no arma un formulario y no habla con la API: para eso
 * están los casos de uso.
 */
type Tipo = 'usuarios' | 'clientes';
type EnFormulario =
  | { tipo: 'nuevo' }
  | { tipo: 'editar'; usuario: Usuario }
  | { tipo: 'editarCliente'; cliente: Cliente }
  | null;

export function PersonalView() {
  const router = useRouter();
  const parametros = useSearchParams();

  const tipo: Tipo = parametros.get('tipo') === 'clientes' ? 'clientes' : 'usuarios';
  const busqueda = parametros.get('search') ?? '';
  const skip = Number(parametros.get('skip') ?? 0);
  const limit = Number(parametros.get('limit') ?? LIMITE_POR_DEFECTO);
  // Memorizado porque es la dependencia de `filas`: un objeto nuevo en cada
  // render invalidaría el filtrado aunque la URL no haya cambiado.
  const filtros: FiltrosDePersonal = useMemo(
    () => ({
      estado: leerLista(parametros, 'estado'),
      roles: leerLista(parametros, 'rol'),
    }),
    [parametros],
  );
  // La URL manda; si no dice nada, la última vista que se eligió aquí.
  const vista = useVistaPreferida('personal', parametros.get('vista'));

  const params = { skip, limit, search: busqueda || undefined };
  const usuarios = useUsuarioList(params, tipo === 'usuarios');
  const clientes = useClienteList(params, tipo === 'clientes');
  const consulta = tipo === 'usuarios' ? usuarios : clientes;

  const crearUsuario = useCreateUsuario();
  const editarUsuario = useUpdateUsuario();
  const borrarUsuario = useDeleteUsuario();
  const crearCliente = useCreateCliente();
  const editarCliente = useUpdateCliente();
  const borrarCliente = useDeleteCliente();

  const [enDetalle, setEnDetalle] = useState<Usuario | Cliente | null>(null);
  const [enFormulario, setEnFormulario] = useState<EnFormulario>(null);
  const [porDarDeBaja, setPorDarDeBaja] = useState<{
    id: string;
    nombre: string;
  } | null>(null);

  const cambiarParametros = (cambios: Record<string, string | number | null>) => {
    const siguientes = new URLSearchParams(parametros.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === null || valor === '') siguientes.delete(clave);
      else siguientes.set(clave, String(valor));
    }
    const consultaUrl = siguientes.toString();
    router.replace(consultaUrl ? `/usuarios?${consultaUrl}` : '/usuarios', {
      scroll: false,
    });
  };

  /**
   * Los filtros que la API todavía no entiende se aplican sobre la página que
   * llegó. La regla vive en `domain/personal.filtros.ts` —con su motivo y sus
   * pruebas—; aquí solo se le pasan los valores de la URL.
   */
  const filas = useMemo(
    () => filtrarPersonal(consulta.data?.data ?? [], filtros),
    [consulta.data, filtros],
  );

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
      texto: (valor) => (valor === 'activos' ? 'Activos' : 'Dados de baja'),
      alCambiar: (valores) => cambiarLista('estado', valores),
    }),
    ...chipsDeLista({
      clave: 'rol',
      etiqueta: 'Rol',
      valores: filtros.roles,
      texto: (id) => ROLES.find((rol) => rol.id === id)?.nombre ?? id,
      alCambiar: (valores) => cambiarLista('rol', valores),
    }),
  ];

  const opcionesDeRol: OpcionFiltro[] = [
    { valor: '', etiqueta: 'Todos los roles' },
    ...ROLES.map((rol) => ({ valor: rol.id, etiqueta: rol.nombre })),
  ];

  const opcionesDeEstado: OpcionFiltro[] = [
    { valor: '', etiqueta: 'Todos' },
    { valor: 'activos', etiqueta: 'Activos' },
    { valor: 'baja', etiqueta: 'Dados de baja' },
  ];

  const guardandoUsuario = crearUsuario.isPending || editarUsuario.isPending;
  const guardandoCliente = crearCliente.isPending || editarCliente.isPending;

  const cerrarFormulario = () => setEnFormulario(null);

  const confirmarBaja = () => {
    if (!porDarDeBaja) return;
    const accion = tipo === 'usuarios' ? borrarUsuario : borrarCliente;
    accion.mutate(porDarDeBaja.id, { onSuccess: () => setPorDarDeBaja(null) });
  };

  return (
    <ListLayout
      cabecera={
        <PageHeader
          migas={[
            { etiqueta: 'Inicio', href: '/productos' },
            { etiqueta: 'Personal', href: '/usuarios' },
            { etiqueta: tipo === 'usuarios' ? 'Usuarios' : 'Clientes' },
          ]}
          titulo={tipo === 'usuarios' ? 'Usuarios' : 'Clientes'}
          descripcion={
            tipo === 'usuarios'
              ? 'Quién entra al panel y con qué permisos.'
              : 'La gente que compra. Sin cuenta ni acceso: solo sus datos.'
          }
          icono={tipo === 'usuarios' ? <ShieldCheck /> : <Users />}
          acciones={
            <>
              <HelpButton pasos={PASOS_TOUR_PERSONAL} />

              {/* El ancla va en un envoltorio y no como prop: `SegmentedControl`
                  no reenvía atributos sueltos al DOM, así que `data-tour` se
                  perdía en silencio y el paso del recorrido señalaba a nada.
                  El fuente lo tenía; el navegador, no. */}
              <span data-tour="coleccion-personal">
                <SegmentedControl<Tipo>
                  etiquetaGrupo="Qué lista se mira"
                  valor={tipo}
                  onCambiar={(siguiente) =>
                    cambiarParametros({
                      tipo: siguiente,
                      skip: null,
                      rol: null,
                      estado: null,
                    })
                  }
                  opciones={[
                    {
                      valor: 'usuarios',
                      etiqueta: 'Usuarios',
                      icono: <ShieldCheck className="size-4" aria-hidden />,
                    },
                    {
                      valor: 'clientes',
                      etiqueta: 'Clientes',
                      icono: <Users className="size-4" aria-hidden />,
                    },
                  ]}
                />
              </span>

              <Button
                tono="primary"
                icono={<Plus className="size-4" />}
                onClick={() => setEnFormulario({ tipo: 'nuevo' })}
                data-tour="alta"
              >
                {tipo === 'usuarios' ? 'Nueva cuenta' : 'Nuevo cliente'}
              </Button>
            </>
          }
        />
      }
      filtros={
        <div data-tour="filtros">
          <FilterBar
            aplicados={aplicados}
            onLimpiar={() =>
              cambiarParametros({
                search: null,
                rol: null,
                estado: null,
                skip: null,
              })
            }
            vista={
              <span data-tour="vistas">
                <ViewSwitcher
                  vista={vista}
                  opciones={VISTAS}
                  onCambiar={(siguiente) => {
                    recordarVista('personal', siguiente);
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

            {tipo === 'usuarios' && (
              <FilterChips
                opciones={opcionesDeRol}
                valores={filtros.roles}
                etiquetaGrupo="Filtrar por rol"
                onCambiar={(valores) => cambiarLista('rol', valores)}
              />
            )}

            <FiltroDeFecha que="una persona" />
          </FilterBar>
        </div>
      }
    >
      {consulta.isError ? (
        <EmptyState
          icono={<AlertTriangle className="size-5 text-error" />}
          titulo="No pudimos traer la lista"
          mensaje={mensajeDe(consulta.error)}
          accion={
            <Button tono="contorno" onClick={() => void consulta.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <DrawerPush
          abierto={enDetalle !== null}
          alCerrar={() => setEnDetalle(null)}
          titulo={enDetalle ? nombreCompleto(enDetalle.persona) : ''}
          subtitulo={enDetalle && esUsuario(enDetalle) ? enDetalle.rol.nombre : 'Cliente'}
          marca={enDetalle && esUsuario(enDetalle) ? <ShieldCheck /> : <UserRound />}
          panel={
            enDetalle && (
              <PersonaDetalle
                persona={enDetalle.persona}
                dadaDeBaja={enDetalle.borrado}
                extras={
                  esUsuario(enDetalle)
                    ? [
                        { etiqueta: 'Correo', valor: enDetalle.correo },
                        {
                          etiqueta: 'Rol',
                          valor: <Tag tono="primary">{enDetalle.rol.nombre}</Tag>,
                        },
                      ]
                    : []
                }
              />
            )
          }
        >
          <div className="flex flex-col gap-4" data-tour="coleccion">
            {/* `tabla` no son tarjetas: la pantalla monta otra cosa. Las
                acciones son las mismas tres, para que cambiar de vista no
                cambie lo que se puede hacer. */}
            {vista === 'tabla' ? (
              <PersonalTabla
                filas={filas}
                cargando={consulta.isPending}
                onVer={setEnDetalle}
                onEditar={(fila) =>
                  setEnFormulario(
                    esUsuario(fila)
                      ? { tipo: 'editar', usuario: fila }
                      : { tipo: 'editarCliente', cliente: fila },
                  )
                }
                onEliminar={(fila) =>
                  setPorDarDeBaja({
                    id: fila.id,
                    nombre: nombreCompleto(fila.persona),
                  })
                }
              />
            ) : (
              <CardGrid vista={vista}>
                {filas.map((fila) =>
                  esUsuario(fila) ? (
                    <PersonaCard
                      key={fila.id}
                      persona={fila.persona}
                      categoria={fila.rol.nombre}
                      tono="primary"
                      marca={<ShieldCheck />}
                      dadaDeBaja={fila.borrado}
                      vista={vista}
                      onVer={() => setEnDetalle(fila)}
                      onEditar={() => setEnFormulario({ tipo: 'editar', usuario: fila })}
                      onEliminar={() =>
                        setPorDarDeBaja({
                          id: fila.id,
                          nombre: nombreCompleto(fila.persona),
                        })
                      }
                      pie={
                        <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-on-surface-variant">
                          <AtSign className="size-3.5 shrink-0" aria-hidden />
                          <span className="truncate">{fila.correo}</span>
                        </span>
                      }
                    />
                  ) : (
                    <PersonaCard
                      key={fila.id}
                      persona={fila.persona}
                      categoria="Cliente"
                      tono="secondary"
                      marca={<UserRound />}
                      dadaDeBaja={fila.borrado}
                      vista={vista}
                      onVer={() => setEnDetalle(fila)}
                      onEditar={() =>
                        setEnFormulario({
                          tipo: 'editarCliente',
                          cliente: fila,
                        })
                      }
                      onEliminar={() =>
                        setPorDarDeBaja({
                          id: fila.id,
                          nombre: nombreCompleto(fila.persona),
                        })
                      }
                    />
                  ),
                )}

                {/* El hueco de crear cierra la rejilla. Solo cuando ya hay algo:
                  con la lista vacía manda el estado vacío, que explica. */}
                {filas.length > 0 && (
                  <AddCard
                    titulo={tipo === 'usuarios' ? 'Nueva cuenta' : 'Nuevo cliente'}
                    descripcion={
                      tipo === 'usuarios'
                        ? 'Da de alta a alguien del equipo.'
                        : 'Añade a alguien a la libreta.'
                    }
                    onClick={() => setEnFormulario({ tipo: 'nuevo' })}
                  />
                )}
              </CardGrid>
            )}

            {/* Un fallo de carga no se muestra como «no hay nada», y «no hay
                nada» no se muestra igual que «tu filtro no encontró nada». */}
            {!consulta.isPending && filas.length === 0 && (
              <EmptyState
                icono={<Users className="size-5" />}
                titulo={
                  aplicados.length > 0
                    ? 'Nada coincide con este filtro'
                    : tipo === 'usuarios'
                      ? 'Todavía no hay cuentas'
                      : 'La libreta está vacía'
                }
                mensaje={
                  aplicados.length > 0
                    ? 'Prueba a quitar alguno de los filtros de arriba.'
                    : tipo === 'usuarios'
                      ? 'Crea la primera para que alguien pueda entrar al panel.'
                      : 'Añade al primer cliente para poder asociarle pedidos.'
                }
                accion={
                  aplicados.length > 0 ? (
                    <Button
                      tono="contorno"
                      onClick={() =>
                        cambiarParametros({
                          search: null,
                          rol: null,
                          estado: null,
                          skip: null,
                        })
                      }
                    >
                      Quitar los filtros
                    </Button>
                  ) : (
                    <Button tono="primary" onClick={() => setEnFormulario({ tipo: 'nuevo' })}>
                      {tipo === 'usuarios' ? 'Crear la primera' : 'Añadir al primero'}
                    </Button>
                  )
                }
              />
            )}

            {/* Siempre que haya datos, aunque quepan en una página: el
                contador dice cuántos hay en total y el selector deja cambiar
                el tamaño de página. Esconderlo con pocos registros obliga a
                adivinar si la lista está completa. */}
            {consulta.data && consulta.data.total > 0 && (
              <Pagination
                skip={consulta.data.skip}
                limit={consulta.data.limit}
                total={consulta.data.total}
                onCambiar={(siguiente) => cambiarParametros(siguiente)}
              />
            )}
          </div>
        </DrawerPush>
      )}

      <Dialog
        abierto={enFormulario !== null}
        alCerrar={() => !guardandoUsuario && !guardandoCliente && cerrarFormulario()}
        titulo={tituloDelFormulario(enFormulario, tipo)}
      >
        {enFormulario?.tipo === 'editarCliente' || (enFormulario && tipo === 'clientes') ? (
          <ClienteForm
            {...(enFormulario.tipo === 'editarCliente' ? { cliente: enFormulario.cliente } : {})}
            guardando={guardandoCliente}
            onCancelar={cerrarFormulario}
            onGuardar={(valores) => {
              if (enFormulario.tipo === 'editarCliente') {
                const cambios = clienteAActualizacion(enFormulario.cliente, valores);
                if (Object.keys(cambios).length === 0) return cerrarFormulario();
                return editarCliente.mutate(
                  { id: enFormulario.cliente.id, cambios },
                  { onSuccess: cerrarFormulario },
                );
              }
              return crearCliente.mutate(valores, {
                onSuccess: cerrarFormulario,
              });
            }}
          />
        ) : (
          enFormulario && (
            <UsuarioForm
              {...(enFormulario.tipo === 'editar' ? { usuario: enFormulario.usuario } : {})}
              guardando={guardandoUsuario}
              onCancelar={cerrarFormulario}
              onGuardar={(valores) => {
                if (enFormulario.tipo === 'editar') {
                  const cambios = usuarioAActualizacion(enFormulario.usuario, valores);
                  // Sin cambios no se llama: el aviso de éxito cantaría algo
                  // que no pasó.
                  if (Object.keys(cambios).length === 0) return cerrarFormulario();
                  return editarUsuario.mutate(
                    { id: enFormulario.usuario.id, cambios },
                    { onSuccess: cerrarFormulario },
                  );
                }
                return crearUsuario.mutate(valores, {
                  onSuccess: cerrarFormulario,
                });
              }}
            />
          )
        )}
      </Dialog>

      <ConfirmDialog
        abierto={porDarDeBaja !== null}
        alCerrar={() => setPorDarDeBaja(null)}
        titulo={tipo === 'usuarios' ? 'Dar de baja la cuenta' : 'Dar de baja al cliente'}
        mensaje={`«${porDarDeBaja?.nombre ?? ''}» dejará de aparecer en la lista.`}
        advertencia={
          tipo === 'usuarios'
            ? 'No podrá volver a entrar al panel. Su histórico se conserva.'
            : 'Sus pedidos anteriores se conservan; no podrás asociarle nuevos.'
        }
        textoConfirmar="Dar de baja"
        procesando={borrarUsuario.isPending || borrarCliente.isPending}
        onConfirmar={confirmarBaja}
      />
    </ListLayout>
  );
}

/** El título del diálogo. Fuera del JSX porque son cuatro casos, no dos. */
function tituloDelFormulario(estado: EnFormulario, tipo: Tipo): string {
  if (estado?.tipo === 'editar') return 'Editar la cuenta';
  if (estado?.tipo === 'editarCliente') return 'Editar el cliente';
  return tipo === 'usuarios' ? 'Nueva cuenta' : 'Nuevo cliente';
}
