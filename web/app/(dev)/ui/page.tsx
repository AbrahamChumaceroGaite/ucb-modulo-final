import { PageHeader } from '@/shared/ui/patterns';
import { SeccionBotones } from './_sections/seccion-botones';
import { SeccionDatos } from './_sections/seccion-datos';
import { SeccionEntradas } from './_sections/seccion-entradas';
import { SeccionEstados } from './_sections/seccion-estados';
import { SeccionFormularios } from './_sections/seccion-formularios';
import { SeccionGraficos } from './_sections/seccion-graficos';
import { SeccionNavegacion } from './_sections/seccion-navegacion';
import { SeccionSuperposiciones } from './_sections/seccion-superposiciones';
import { SeccionTarjetas } from './_sections/seccion-tarjetas';
import { SeccionTokens } from './_sections/seccion-tokens';
import { SECCIONES } from './_data/secciones';

/**
 * Catálogo del sistema de diseño.
 *
 * Esta página **compone y nada más**: cada sección vive en su propio archivo
 * bajo `_sections/`. Un catálogo de 2.000 líneas en un solo componente es
 * imposible de revisar y acaba siendo el primer sitio donde alguien duplica.
 *
 * Y no tiene componentes propios: todo lo que se ve aquí sale de
 * `shared/ui`. Si el catálogo necesitara algo que el producto no usa, ese algo
 * no debería existir todavía.
 */
export default function DemoUiPage() {
  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        titulo="Sistema de diseño"
        descripcion="Todo lo que Kaffehaus usa para pintarse, con la razón de cada decisión al lado. Si algo no está aquí, no existe."
      />

      {/* Índice pegajoso: en un catálogo largo, bajar a buscar la sección que
          interesa es el gesto más repetido.

          Sin bordes rectos arriba y abajo: la franja es una superficie de
          cristal —translúcida y desenfocada— con las esquinas curvas, como
          todo lo que flota en este sistema. Dos líneas de 1px de lado a lado
          cortaban la página en tres. */}
      <nav
        aria-label="Secciones del catálogo"
        className="sticky top-14 z-10 flex gap-1.5 overflow-x-auto rounded-full bg-surface/70 px-2 py-1.5 backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SECCIONES.map((seccion) => (
          <a
            key={seccion.id}
            href={`#${seccion.id}`}
            className="shrink-0 rounded-full bg-surface-container px-2.5 py-1 text-[0.6875rem] leading-4 font-semibold tracking-wide text-on-surface-variant uppercase transition-colors hover:bg-surface-container-highest hover:text-on-surface"
          >
            {seccion.etiqueta}
          </a>
        ))}
      </nav>

      <SeccionTokens />
      <SeccionBotones />
      <SeccionEntradas />
      <SeccionFormularios />
      <SeccionTarjetas />
      <SeccionDatos />
      <SeccionEstados />
      <SeccionSuperposiciones />
      <SeccionNavegacion />
      <SeccionGraficos />
    </div>
  );
}
