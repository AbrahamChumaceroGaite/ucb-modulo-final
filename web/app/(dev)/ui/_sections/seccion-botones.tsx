'use client';

import { useState } from 'react';
import { ArrowRight, Download, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  Button,
  Dots,
  ExpandableButton,
  IconAction,
  IconActionGroup,
  Tooltip,
} from '@/shared/ui/primitives';
import { Muestra, Seccion } from '../_components/showcase';
import { TONOS } from '../_data/botones';

export function SeccionBotones() {
  const [guardando, setGuardando] = useState(false);

  const simularGuardado = () => {
    setGuardando(true);
    setTimeout(() => setGuardando(false), 1800);
  };

  return (
    <Seccion
      id="botones"
      titulo="Botones"
      descripcion="Seis tonos y dos medidas. No hay tamaño grande: la interfaz es densa y un botón enorme no aporta nada."
    >
      <Muestra titulo="Tonos">
        {TONOS.map((variante) => (
          <Button key={variante.tono} tono={variante.tono}>
            {variante.texto}
          </Button>
        ))}
      </Muestra>

      <Muestra titulo="Medidas" nota="`sm` para barras y tablas, `md` para todo lo demás.">
        <Button medida="sm" tono="primary">
          Pequeño
        </Button>
        <Button medida="md" tono="primary">
          Normal
        </Button>
        <Button medida="sm" tono="contorno" icono={<Plus className="size-3.5" />}>
          Con icono
        </Button>
        <Button tono="contorno" iconoFinal={<ArrowRight className="size-4" />}>
          Continuar
        </Button>
      </Muestra>

      <Muestra
        titulo="Guardando"
        nota="Puntos, nunca una ruleta. El contenido se sustituye sin desmontarse, así que el ancho del botón no salta."
      >
        <Button tono="primary" cargando={guardando} onClick={simularGuardado}>
          Guardar cambios
        </Button>
        <Button tono="secondary" cargando={guardando} onClick={simularGuardado}>
          Cobrar pedido
        </Button>
        <span className="inline-flex items-center gap-2 text-sm text-on-surface-variant">
          Sueltos: <Dots />
        </span>
      </Muestra>

      <Muestra
        titulo="Expandible"
        nota="Ocupa un icono y despliega su texto al atenderlo. En táctil aparece siempre abierto, porque allí no existe el cursor."
      >
        <ExpandableButton icono={<Download className="size-4" />}>Exportar</ExpandableButton>
        <ExpandableButton icono={<RotateCcw className="size-4" />}>Reponer</ExpandableButton>
      </Muestra>

      <Muestra
        titulo="Acciones de fila"
        nota="Neutras en reposo; toman color al atenderlas. Tres botones de colores permanentes en cada fila parecen un semáforo."
      >
        <div className="group flex items-center gap-3 rounded-md border border-outline-variant bg-surface-container px-3 py-2">
          <span className="text-sm text-on-surface">Pasa el cursor por aquí</span>
          <IconActionGroup>
            <IconAction accion="ver" etiqueta="Ver detalle" icono={<ArrowRight className="size-4" />} />
            <IconAction accion="editar" etiqueta="Editar" icono={<Pencil className="size-4" />} />
            <IconAction accion="eliminar" etiqueta="Dar de baja" icono={<Trash2 className="size-4" />} />
            <IconAction accion="restaurar" etiqueta="Restaurar" icono={<RotateCcw className="size-4" />} />
          </IconActionGroup>
        </div>
      </Muestra>

      <Muestra
        titulo="Con ayuda"
        nota="El tooltip responde al ratón y al teclado, y se enlaza con `aria-describedby`."
      >
        <Tooltip contenido="Descarga el inventario en CSV">
          <Button tono="contorno" soloIcono icono={<Download className="size-4" />} aria-label="Exportar" />
        </Tooltip>
        <Tooltip contenido="Añadir un insumo nuevo" lado="derecha">
          <Button tono="primary" soloIcono icono={<Plus className="size-4" />} aria-label="Añadir" />
        </Tooltip>
      </Muestra>
    </Seccion>
  );
}
