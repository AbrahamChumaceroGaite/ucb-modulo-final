'use client';

import { useCallback } from 'react';
import { driver, type DriveStep } from 'driver.js';

/**
 * Recorridos guiados sobre la pantalla.
 *
 * La librería se configura **una sola vez y aquí**: textos de botones, clase
 * del popover y comportamiento. Ninguna pantalla importa `driver.js`
 * directamente ni reajusta sus opciones, o acabaríamos con dos estilos de tour
 * distintos en la misma aplicación.
 *
 * Los pasos de cada pantalla viven en su feature: el tour habla del dominio,
 * `shared` solo aporta el motor.
 *
 * No hay `olvidar()` ni `yaSeVio()` porque todavía no existe el botón que los
 * llamaría. Auditamos un servicio de tours con esos dos métodos escritos,
 * documentados y sin un solo consumidor.
 */
export type PasoTour = {
  /** Selector CSS del elemento a señalar. */
  elemento: string;
  titulo: string;
  descripcion: string;
  lado?: 'top' | 'right' | 'bottom' | 'left';
};

export function useTour() {
  return useCallback((pasos: readonly PasoTour[]) => {
    if (pasos.length === 0) return;

    const recorrido = driver({
      showProgress: true,
      progressText: 'Paso {{current}} de {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      doneBtnText: 'Entendido',
      popoverClass: 'kh-tour',
      stagePadding: 6,
      stageRadius: 12,
      overlayOpacity: 0.65,
      steps: pasos.map<DriveStep>((paso) => ({
        element: paso.elemento,
        popover: {
          title: paso.titulo,
          description: paso.descripcion,
          side: paso.lado ?? 'bottom',
          align: 'start',
        },
      })),
    });

    recorrido.drive();
  }, []);
}
