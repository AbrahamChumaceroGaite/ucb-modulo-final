'use client';

import { useState } from 'react';
import { Copy, Download, LogOut, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  Dialog,
  Drawer,
  DrawerPush,
  IconAction,
  MenuItem,
  MenuSeparator,
  Popover,
  ProgressBar,
  Tag,
  Tooltip,
} from '@/shared/ui/primitives';
import { ConfirmDialog, HelpButton } from '@/shared/ui/patterns';
import { Coffee } from 'lucide-react';
import { formatearCantidad } from '@/shared/lib/format';
import { Muestra, Seccion } from '../_components/showcase';
import { PASOS_DEMO } from '../_data/superposiciones';

/**
 * Todo lo que se abre por encima de la página.
 *
 * Comparten `useOverlay`, así que los cuatro comportamientos accesibles —foco
 * que entra y vuelve, `Escape`, tabulador atrapado y fondo bloqueado— se
 * implementan una vez. Auditamos una librería cuyo tooltip solo escuchaba el
 * ratón y quedaba fuera del alcance del teclado.
 *
 * Pruébalos con el teclado: `Tab` no se escapa y `Escape` cierra.
 */
export function SeccionSuperposiciones() {
  const [dialogo, setDialogo] = useState(false);
  const [panel, setPanel] = useState(false);
  const [empuje, setEmpuje] = useState(false);
  const [confirmacion, setConfirmacion] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const confirmarBaja = () => {
    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      setConfirmacion(false);
    }, 1200);
  };

  return (
    <Seccion
      id="superposiciones"
      titulo="Diálogos y paneles"
      descripcion="El diálogo interrumpe; el panel acompaña. El menú y el tooltip no bloquean nada."
    >
      <Muestra
        titulo="Abrir"
        nota="Con el teclado: Tab se queda dentro y Escape cierra. El diálogo NO se cierra al pulsar fuera —pruébalo—: lleva un formulario dentro y un clic desviado tiraría lo escrito."
      >
        <span data-tour="demo-dialogo">
          <Button tono="primary" onClick={() => setDialogo(true)}>
            Diálogo con formulario
          </Button>
        </span>
        <span data-tour="demo-panel">
          <Button tono="contorno" onClick={() => setPanel(true)}>
            Panel de detalle
          </Button>
        </span>
        <Button tono="danger" onClick={() => setConfirmacion(true)}>
          Confirmar una baja
        </Button>
        <HelpButton pasos={PASOS_DEMO} etiqueta="Ver el recorrido guiado" />
      </Muestra>

      <Muestra
        titulo="Panel que empuja"
        nota="El otro tipo de panel: en vez de velar el fondo, estrecha el contenido y se sienta a su lado. Sirve para comparar el detalle con la lista. Por debajo de 1024 px no hay ancho que repartir, así que se superpone."
        className="block"
      >
        <DrawerPush
          abierto={empuje}
          alCerrar={() => setEmpuje(false)}
          titulo="House Espresso"
          subtitulo="Café · Tueste medio"
          marca={<Coffee />}
          panel={
            <div className="flex flex-col gap-3 text-sm">
              <p className="text-on-surface-variant">
                La lista de la izquierda sigue viva y se puede recorrer con el panel abierto. Eso
                es lo que este tipo de panel compra y el superpuesto no.
              </p>
              <ProgressBar valor={2.5} maximo={10} tono="danger" etiqueta="Existencias" />
            </div>
          }
          pie={
            <Button tono="contorno" onClick={() => setEmpuje(false)}>
              Cerrar
            </Button>
          }
        >
          <div className="rounded-xl border border-outline-variant bg-surface-container p-4">
            <Button tono="primary" onClick={() => setEmpuje((abierto) => !abierto)}>
              {empuje ? 'Recoger el panel' : 'Abrir el panel que empuja'}
            </Button>
            <p className="mt-3 text-xs text-on-surface-variant">
              Este bloque es el contenido de la pantalla. Al abrir el panel se estrecha en lugar
              de quedar tapado.
            </p>
          </div>
        </DrawerPush>
      </Muestra>

      <Muestra titulo="Menú" nota="Cierra al pulsar fuera y con Escape. Lo destructivo va en rojo y al final.">
        <Popover
          alineacion="inicio"
          disparador={({ abierto, alternar }) => (
            <IconAction
              accion="ver"
              etiqueta="Más acciones"
              icono={<MoreVertical className="size-4" />}
              onClick={alternar}
              aria-expanded={abierto}
              aria-haspopup="menu"
            />
          )}
        >
          {({ cerrar }) => (
            <div role="menu" aria-label="Acciones del insumo">
              <MenuItem icono={<Pencil className="size-4" />} onClick={cerrar}>
                Editar
              </MenuItem>
              <MenuItem icono={<Copy className="size-4" />} onClick={cerrar}>
                Duplicar
              </MenuItem>
              <MenuItem icono={<Download className="size-4" />} onClick={cerrar}>
                Exportar movimientos
              </MenuItem>
              <MenuSeparator />
              <MenuItem icono={<Trash2 className="size-4" />} tono="danger" onClick={cerrar}>
                Dar de baja
              </MenuItem>
            </div>
          )}
        </Popover>

        <Popover
          alineacion="inicio"
          disparador={({ abierto, alternar }) => (
            <Button tono="contorno" onClick={alternar} aria-expanded={abierto}>
              Menú de la cuenta
            </Button>
          )}
        >
          {({ cerrar }) => (
            <div role="menu" aria-label="Cuenta">
              <div className="px-2.5 py-2">
                <p className="text-xs font-medium text-on-surface">Elena Rostova</p>
                <p className="text-[0.625rem] text-on-surface-variant">Administradora</p>
              </div>
              <MenuSeparator />
              <MenuItem icono={<LogOut className="size-4" />} tono="danger" onClick={cerrar}>
                Cerrar sesión
              </MenuItem>
            </div>
          )}
        </Popover>
      </Muestra>

      <Muestra titulo="Tooltip" nota="Responde al cursor y al foco, con role y aria-describedby.">
        <Tooltip contenido="Arriba">
          <Button tono="neutral" medida="sm">
            Arriba
          </Button>
        </Tooltip>
        <Tooltip contenido="A la derecha" lado="derecha">
          <Button tono="neutral" medida="sm">
            Derecha
          </Button>
        </Tooltip>
        <Tooltip contenido="Abajo" lado="abajo">
          <Button tono="neutral" medida="sm">
            Abajo
          </Button>
        </Tooltip>
      </Muestra>

      <Dialog
        abierto={dialogo}
        alCerrar={() => setDialogo(false)}
        titulo="Registrar una entrada"
        descripcion="Lo que llegó del proveedor y entra en la despensa."
        pie={
          <>
            <Button tono="contorno" onClick={() => setDialogo(false)}>
              Cancelar
            </Button>
            <Button tono="primary" onClick={() => setDialogo(false)}>
              Registrar
            </Button>
          </>
        }
      >
        <p className="text-sm text-on-surface-variant">
          En una pantalla real aquí va el formulario. Fíjate en que el diálogo sube desde abajo en
          móvil y se centra en escritorio, y en que el fondo no se desplaza detrás.
        </p>
      </Dialog>

      <Drawer
        abierto={panel}
        alCerrar={() => setPanel(false)}
        titulo="House Espresso"
        subtitulo="Café · Tueste medio"
        marca={<Coffee />}
        pie={
          <>
            <Button tono="contorno" onClick={() => setPanel(false)}>
              Cerrar
            </Button>
            <Button tono="primary">Editar</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-on-surface-variant">Existencias</span>
              <span data-tabular className="font-medium text-on-surface">
                {formatearCantidad(2.5, 'kg')} de {formatearCantidad(10, 'kg')}
              </span>
            </div>
            <ProgressBar className="mt-2" valor={2.5} maximo={10} tono="danger" etiqueta="Existencias" />
            <p className="mt-2 text-xs text-error">Por debajo del mínimo: conviene pedir hoy.</p>
          </div>

          <dl className="grid grid-cols-2 gap-3 border-t border-outline-variant pt-4 text-sm">
            {[
              ['Proveedor', 'Tostaduría Andina'],
              ['Último pedido', '14 ago 2026'],
              ['Precio por kg', '92,00 Bs'],
              ['Rinde', '~140 tazas'],
            ].map(([etiqueta, valor]) => (
              <div key={etiqueta}>
                <dt className="text-xs text-on-surface-variant">{etiqueta}</dt>
                <dd className="mt-0.5 font-medium text-on-surface">{valor}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-outline-variant pt-4">
            <p className="label-caps mb-2 text-on-surface-variant">Se usa en</p>
            <div className="flex flex-wrap gap-2">
              <Tag tono="secondary">Flat White</Tag>
              <Tag tono="secondary">Americano</Tag>
              <Tag tono="secondary">Cortado</Tag>
            </div>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        abierto={confirmacion}
        alCerrar={() => setConfirmacion(false)}
        onConfirmar={confirmarBaja}
        procesando={procesando}
        titulo="Dar de baja el insumo"
        mensaje="«House Espresso» dejará de aparecer en la despensa y en la carta."
        advertencia="Las recetas que lo usan quedarán incompletas hasta que elijas un sustituto."
        textoConfirmar="Dar de baja"
      />
    </Seccion>
  );
}
