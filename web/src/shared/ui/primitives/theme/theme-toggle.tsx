'use client';

import { Moon, Sun } from 'lucide-react';
import { IconAction } from '../actions/icon-action';

const CLAVE = 'kaffehaus.tema';

/**
 * Interruptor de tema.
 *
 * Escribe `data-tema` en `<html>`, que es lo que lee `globals.css`. Una sola
 * fuente de verdad: no hay una clase `.dark` compitiendo con un atributo.
 *
 * ## Sin estado de React
 *
 * Qué icono se ve lo decide el CSS con el mismo atributo, y el estado vive en
 * el DOM. Guardarlo además en un `useState` obligaría a leer el DOM dentro de
 * un efecto —lo que provoca un render en cascada— y abriría la puerta a que la
 * marca del servidor y la del cliente no coincidieran.
 */
export function ThemeToggle() {
  const alternar = () => {
    const raiz = document.documentElement;
    const siguiente = raiz.dataset['tema'] === 'oscuro' ? 'claro' : 'oscuro';
    raiz.dataset['tema'] = siguiente;

    try {
      localStorage.setItem(CLAVE, siguiente);
    } catch {
      // Modo privado o almacenamiento bloqueado: el tema vale para esta sesión.
    }
  };

  return (
    <IconAction
      accion="destacar"
      // Estática a propósito: describe lo que el botón hace, no en qué estado
      // está. Así no depende de un valor que el servidor no puede conocer.
      etiqueta="Cambiar entre tema claro y oscuro"
      icono={
        <>
          <Moon className="size-4 dark:hidden" aria-hidden />
          <Sun className="hidden size-4 dark:block" aria-hidden />
        </>
      }
      onClick={alternar}
    />
  );
}

/**
 * Script que aplica el tema antes del primer pintado.
 *
 * Va en línea en el `<head>`: si esperara a React, la página aparecería en
 * claro y saltaría a oscuro un instante después.
 */
export const SCRIPT_TEMA = `
(function () {
  try {
    var guardado = localStorage.getItem('${CLAVE}');
    var oscuro = guardado
      ? guardado === 'oscuro'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.tema = oscuro ? 'oscuro' : 'claro';
  } catch (e) {
    document.documentElement.dataset.tema = 'claro';
  }
})();
`;
