'use client';

import { AlertTriangle } from 'lucide-react';
import { Dialog } from '../../primitives/overlays/dialog';
import { Button } from '../../primitives/actions/button';

/**
 * Confirmación de una acción que no se deshace.
 *
 * `advertencia` no es relleno: es donde se dice **la consecuencia real**. Un
 * diálogo que solo pregunta «¿Estás seguro?» no aporta nada; uno que dice «su
 * código de rastreo deja de funcionar y no vuelve al reactivarlo» sí.
 *
 * El botón de confirmar lleva el verbo de la acción («Dar de baja»), no un
 * «Aceptar» genérico: quien lo lee tiene que saber qué va a pasar sin releer
 * el mensaje.
 */
export function ConfirmDialog({
  abierto,
  alCerrar,
  onConfirmar,
  titulo,
  mensaje,
  advertencia,
  textoConfirmar = 'Confirmar',
  procesando = false,
}: {
  abierto: boolean;
  alCerrar: () => void;
  onConfirmar: () => void;
  titulo: string;
  mensaje: string;
  advertencia?: string;
  textoConfirmar?: string;
  procesando?: boolean;
}) {
  return (
    <Dialog
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={titulo}
      ancho="sm"
      pie={
        <>
          <Button tono="contorno" onClick={alCerrar} disabled={procesando}>
            Cancelar
          </Button>
          <Button tono="danger" onClick={onConfirmar} cargando={procesando}>
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <p className="text-sm text-on-surface">{mensaje}</p>

      {advertencia && (
        <div className="mt-3 flex gap-2.5 rounded-md border border-warning/40 bg-warning-container/50 p-3">
          <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
          <p className="text-xs text-on-surface">{advertencia}</p>
        </div>
      )}
    </Dialog>
  );
}
