'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

/**
 * Buscador con respiro.
 *
 * Emite 300 ms después de la última tecla: buscar en cada pulsación dispara una
 * petición por letra y las respuestas se pisan entre sí. `Enter` no espera —si
 * alguien lo pulsa, ya terminó de escribir— y el botón de limpiar emite vacío
 * al momento.
 *
 * El valor aplicado llega por prop: el componente no es la fuente de verdad de
 * la búsqueda, lo es la URL. Solo guarda lo que se está tecleando.
 */
export function SearchInput({
  valor,
  onBuscar,
  marcador = 'Buscar…',
  className,
}: {
  valor: string;
  onBuscar: (termino: string) => void;
  marcador?: string;
  className?: string;
}) {
  const [texto, setTexto] = useState(valor);
  const [valorAplicado, setValorAplicado] = useState(valor);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Si la búsqueda cambia desde fuera —se quita un chip, se navega atrás— el
  // campo se pone al día. Se ajusta **durante el render** comparando con el
  // valor anterior, que es el patrón que React documenta para esto: hacerlo en
  // un efecto provoca un render en cascada y un parpadeo del texto.
  if (valor !== valorAplicado) {
    setValorAplicado(valor);
    setTexto(valor);
  }

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  const emitirConRespiro = (siguiente: string) => {
    setTexto(siguiente);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => onBuscar(siguiente.trim()), 300);
  };

  const emitirYa = (siguiente: string) => {
    if (temporizador.current) clearTimeout(temporizador.current);
    setTexto(siguiente);
    onBuscar(siguiente.trim());
  };

  return (
    <div className={cn('relative flex w-full items-center', className)}>
      <Search
        className="pointer-events-none absolute left-2.5 size-4 text-on-surface-variant"
        aria-hidden
      />

      <input
        type="search"
        value={texto}
        placeholder={marcador}
        aria-label={marcador}
        onChange={(evento) => emitirConRespiro(evento.target.value)}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter') emitirYa(evento.currentTarget.value);
        }}
        className={cn(
          // Sin borde: el buscador vive **dentro** de la cabecera, que ya
          // tiene el suyo. Dos trazos concéntricos a dos píxeles de distancia
          // se leen como un error de maquetación, no como una caja.
          'h-9 w-full rounded-full border-0 bg-on-surface/6',
          'pl-9 pr-9 text-sm text-on-surface outline-none',
          'transition-colors duration-150 placeholder:text-on-surface-variant/60',
          'hover:bg-on-surface/10 focus:bg-on-surface/10',
          // El navegador pone su propia cruz en `type=search` y se solaparía
          // con la nuestra.
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />

      {texto && (
        <button
          type="button"
          onClick={() => emitirYa('')}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 flex size-6 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
