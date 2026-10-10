'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Botón que solo muestra su icono hasta que se le presta atención.
 *
 * Sirve para acciones secundarias en barras apretadas: en reposo es un
 * **círculo exacto** y al enfocarlo o pasar el cursor despliega su texto. El
 * texto **existe siempre** en el DOM, solo se colapsa su ancho, así que un
 * lector de pantalla lo anuncia aunque visualmente esté recogido.
 *
 * ## Por qué el círculo salía ovalado
 *
 * Tenía `gap-2` entre el icono y el texto. Al colapsar el texto a `max-w-0` el
 * hueco del `gap` **seguía ahí**: 8 px de más sobre un alto de 32 hacían un
 * rectángulo redondeado, no un círculo.
 *
 * Pasar ese hueco a `padding-left` del propio texto tampoco valía, y medirlo
 * fue la única forma de verlo: `max-width: 0` **no puede reducir una caja por
 * debajo de su relleno**, ni siquiera con `border-box`. El botón seguía
 * midiendo 42×32.
 *
 * Lo que funciona es lo que hay ahora: el elemento que colapsa no tiene
 * relleno ninguno, y el hueco vive en un `<span>` interior que queda recortado
 * con el texto. Colapsado mide exactamente lo que mide de alto.
 *
 * En pantallas táctiles no hay «pasar el cursor», así que allí aparece
 * expandido desde el principio.
 */
export function ExpandableButton({
  icono,
  children,
  onClick,
  medida = 'sm',
  className,
}: {
  icono: ReactNode;
  children: string;
  onClick?: () => void;
  medida?: 'sm' | 'md';
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
      onFocus={() => setAbierto(true)}
      onBlur={() => setAbierto(false)}
      className={cn(
        'group inline-flex items-center rounded-full border border-outline-variant',
        'bg-surface-container-high text-on-surface',
        'transition-[background-color,border-color] duration-150 hover:border-primary hover:bg-surface-container-highest',
        // Relleno = (alto − icono − bordes) / 2, para que colapsado el ancho
        // iguale exactamente al alto. El icono mide 16 px en las dos medidas y
        // el borde suma 2 px que hay que descontar: con `px-2` el botón medía
        // 34×32 y se notaba. Medido, no calculado a ojo.
        medida === 'sm' ? 'h-8 px-[0.4375rem] text-xs' : 'h-10 px-[0.6875rem] text-sm',
        className,
      )}
    >
      <span className="flex shrink-0 text-primary">{icono}</span>
      <span
        className={cn(
          'overflow-hidden transition-[max-width,opacity] duration-200 ease-[var(--ease-suave)]',
          // Táctil: siempre visible. Con puntero: se despliega al atender.
          'max-w-40 opacity-100 [@media(hover:hover)]:max-w-0 [@media(hover:hover)]:opacity-0',
          abierto && '[@media(hover:hover)]:max-w-40 [@media(hover:hover)]:opacity-100',
        )}
      >
        <span className="block pl-2 whitespace-nowrap">{children}</span>
      </span>
    </button>
  );
}
