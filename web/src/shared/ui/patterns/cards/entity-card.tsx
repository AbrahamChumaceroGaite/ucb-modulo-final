import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { TONO_CLASES, type Tone } from '@/shared/config/variants';
import { CategoryLabel } from '../../primitives/display/tag';
import { IconActionGroup } from '../../primitives/actions/icon-action';
import type { Vista } from './view';

/**
 * Tarjeta de registro. Es la pieza con más carga visual del sistema y la que
 * hace que una pantalla se reconozca como de Kaffehaus.
 *
 * ## Su anatomía, y por qué
 *
 * 1. **Banda de medio** arriba, opcional: una foto o un icono grande. Se funde
 *    con la tarjeta por un degradado, en vez de cortar a filo.
 * 2. **Insignia** sobre esa banda, arriba a la derecha: dificultad, estado, lo
 *    que clasifique de un vistazo.
 * 3. **Acciones** sobre la banda, **arriba a la izquierda**, en la misma línea
 *    que la insignia. Aparecen al atender la tarjeta.
 * 4. **Icono de fondo** grande, girado y al 7 % de opacidad, cuando no hay
 *    foto. Identifica el tipo de registro sin gastar una etiqueta de texto.
 * 5. **Acento de 2px a la izquierda**, del color del estado. Permite barrer
 *    una rejilla entera y ver qué está mal sin leer nada.
 * 6. **Categoría, título y descripción** de dos líneas como mucho: la tercera
 *    nunca se lee y descuadra la rejilla.
 * 7. **Fila de datos** con iconos pequeños —tiempo, unidades, lo que mida ese
 *    registro—, separada del texto por su tamaño, no por una línea más.
 *
 * ## Dónde van las acciones, y por qué no en el pie
 *
 * Estuvieron en el pie, reveladas al pasar el cursor. Para que la tarjeta no
 * cambiara de alto había que **reservarles el sitio**, así que en reposo todas
 * las tarjetas cargaban con una franja vacía de 44 px que no decía nada.
 *
 * Ahora se superponen a lo que ya está pintado —la banda, o la esquina del
 * cuerpo—, así que no ocupan sitio propio y no hay nada que reservar. Es lo
 * mismo que hace la fila de una tabla.
 *
 * Es de presentación pura: recibe todo por props y no sabe qué es un producto.
 * Por eso vive en `shared/ui/patterns` y no en una feature.
 *
 * ## Por qué la tarjeta entera no es pulsable
 *
 * Tuvo una prop `onActivar` que ponía un `onClick` sobre el `<article>`. Eso
 * rompe la regla 11.8: un elemento no interactivo con manejador de clic no se
 * alcanza con el teclado ni se anuncia como pulsable. Además nadie la usaba.
 *
 * Si algún día hace falta, la forma correcta es que el **título** sea un
 * `<button>` o un `<a>` con una capa que cubra la tarjeta — no un clic suelto
 * en el contenedor.
 */
export function EntityCard({
  categoria,
  titulo,
  descripcion,
  estado,
  tono = 'neutral',
  marca,
  medio,
  imagen,
  insignia,
  datos,
  acciones,
  pie,
  vista = 'rejilla',
  className,
}: {
  categoria?: string;
  titulo: string;
  /** Dos líneas como mucho. Se recorta sola. */
  descripcion?: string;
  /** Línea corta bajo el título, con el color del tono: «Nivel crítico». */
  estado?: string;
  tono?: Tone;
  /** Icono de fondo. Se pinta girado y tenue, solo cuando no hay `imagen`. */
  marca?: ReactNode;
  /** Miniatura o icono a la izquierda del título. */
  medio?: ReactNode;
  /** Banda superior: una foto, una ilustración o un icono a tamaño grande. */
  imagen?: ReactNode;
  /** Se posa sobre la banda superior, arriba a la derecha. Suele ser un `Tag`. */
  insignia?: ReactNode;
  /** Cifras cortas con icono: duración, unidades, existencias. */
  datos?: readonly { icono: ReactNode; texto: string }[];
  /** Se revelan al atender la tarjeta. No ocupan sitio propio. */
  acciones?: ReactNode;
  /** Contenido fijo del pie: siempre visible. Para datos, no para botones. */
  pie?: ReactNode;
  /** La misma que decide el `<CardGrid>` que la contiene. */
  vista?: Vista;
  className?: string;
}) {
  const clases = TONO_CLASES[tono];
  const enLinea = vista === 'lista';
  const compacta = vista === 'compacta';
  // En lista y en compacta la banda estorba: la primera es una fila y la
  // segunda existe justamente para que quepan más en pantalla.
  const conBanda = Boolean(imagen) && vista === 'rejilla';

  return (
    <article
      className={cn(
        'group relative flex overflow-hidden rounded-xl',
        'border border-outline-variant bg-surface-container',
        'transition-colors duration-200 hover:border-outline',
        enLinea ? 'flex-row items-stretch' : 'flex-col',
        className,
      )}
    >
      {/* Acento del estado. `aria-hidden` porque el color no es la única señal:
          el texto de `estado` dice lo mismo. */}
      <span className={cn('absolute inset-y-0 left-0 z-10 w-0.5', clases.solido)} aria-hidden />

      {conBanda && (
        <div className="relative h-32 w-full shrink-0 overflow-hidden bg-surface-container-high">
          {imagen}

          {/* Funde la foto con la tarjeta. Cortar a filo deja una costura que
              se nota en cuanto hay tres tarjetas seguidas. */}
          <span
            className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-surface-container to-transparent"
            aria-hidden
          />

          {/* Acciones e insignia comparten línea: una a cada extremo. */}
          {acciones && <Acciones className="top-2 left-3">{acciones}</Acciones>}
          {insignia && <div className="absolute top-2 right-2">{insignia}</div>}
        </div>
      )}

      {/* En lista la imagen se convierte en una franja lateral estrecha: la
          proporción de una foto apaisada dentro de una fila de 96 px de alto no
          deja ver nada, pero una columna de color sí ancla la fila. */}
      {enLinea && imagen && (
        <div className="relative w-24 shrink-0 overflow-hidden bg-surface-container-high sm:w-32">
          {imagen}
        </div>
      )}

      {marca && !conBanda && (
        <span
          className={cn(
            'marca-fondo -right-5 -bottom-6 rotate-[-14deg] opacity-[0.07]',
            '[&>svg]:size-28',
            clases.texto,
          )}
          aria-hidden
        >
          {marca}
        </span>
      )}

      <div
        className={cn(
          'relative flex min-w-0 flex-1 items-start gap-3',
          compacta ? 'p-3 pl-4' : 'p-4 pl-5',
          conBanda && 'pt-2',
        )}
      >
        {medio && !compacta && (
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-container-high text-on-surface-variant">
            {medio}
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              {categoria && <CategoryLabel>{categoria}</CategoryLabel>}
              <h3 className="mt-0.5 truncate text-sm font-semibold text-on-surface">{titulo}</h3>
              {estado && <p className={cn('mt-0.5 text-xs font-medium', clases.texto)}>{estado}</p>}
            </div>

            {/* Sin banda, las acciones se posan en la esquina del cuerpo, que
                es donde no hay texto que tapar. La insignia va con ellas. */}
            {insignia && !conBanda && <div className="shrink-0">{insignia}</div>}
            {acciones && !conBanda && (
              <Acciones className="top-3 right-3">{acciones}</Acciones>
            )}
          </div>

          {descripcion && !compacta && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-on-surface-variant">
              {descripcion}
            </p>
          )}

          {datos && datos.length > 0 && (
            <dl className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              {datos.map((dato) => (
                <div
                  key={dato.texto}
                  className="flex items-center gap-1.5 text-[0.6875rem] text-on-surface-variant"
                >
                  <dt className="flex text-secondary [&>svg]:size-3.5" aria-hidden>
                    {dato.icono}
                  </dt>
                  <dd data-tabular>{dato.texto}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* En lista el pie no puede ser una franja de ancho completo: iría
              debajo de la miniatura y partiría la fila en dos. */}
          {pie && enLinea && <div className="mt-2.5">{pie}</div>}
        </div>
      </div>

      {pie && !enLinea && (
        <div
          className={cn(
            'relative border-t border-outline-variant/60 px-4',
            compacta ? 'py-2' : 'py-3',
          )}
        >
          {pie}
        </div>
      )}
    </article>
  );
}

/**
 * Las acciones, posadas donde toque.
 *
 * El revelado al atender —y su vuelta con el foco del teclado y en táctil— lo
 * pone `<IconActionGroup>`, que ya lo hacía para las filas de tabla. Aquí solo
 * se le añade la posición.
 *
 * Tuvo su propia copia de esas tres clases durante media hora. Reimplementar
 * un comportamiento que ya existe «porque además necesito posicionarlo» es
 * exactamente cómo empiezan las divergencias que auditamos.
 */
function Acciones({ children, className }: { children: ReactNode; className?: string }) {
  return <IconActionGroup className={cn('absolute z-10', className)}>{children}</IconActionGroup>;
}
