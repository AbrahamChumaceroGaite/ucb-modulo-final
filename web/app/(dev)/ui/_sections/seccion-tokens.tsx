import { Seccion, Muestra } from '../_components/showcase';
import { ACENTOS, RADIOS, SUPERFICIES } from '../_data/tokens';

/**
 * Los tokens, pintados con los propios tokens.
 *
 * Esta sección es la prueba de que existen: si una variable no estuviera
 * declarada en `@theme`, su muestra saldría transparente y se vería aquí. Es el
 * mismo fallo que encontramos auditando una librería con 34 tokens usados y
 * nunca definidos, cuyo botón primario se renderizaba sin fondo.
 */
export function SeccionTokens() {
  return (
    <Seccion
      id="tokens"
      titulo="Tokens"
      descripcion="Todo el color, el radio y la tipografía salen de aquí. Ningún componente escribe un hex ni un píxel suelto."
    >
      <Muestra titulo="Superficies" nota="La jerarquía se hace por capas de fondo, no por sombras.">
        <div className="grid w-full gap-2 sm:grid-cols-5">
          {SUPERFICIES.map((superficie) => (
            <div key={superficie.nombre} className="rounded-md border border-outline-variant p-1">
              <div className={`${superficie.clase} h-12 rounded-sm`} />
              <p className="mt-1.5 px-1 text-[0.6875rem] font-medium text-on-surface">
                {superficie.nombre}
              </p>
              <p className="px-1 pb-1 text-[0.625rem] text-on-surface-variant">{superficie.uso}</p>
            </div>
          ))}
        </div>
      </Muestra>

      <Muestra titulo="Acentos" nota="Cada color trae su par legible: nunca se adivina el texto encima.">
        <div className="grid w-full gap-2 sm:grid-cols-5">
          {ACENTOS.map((acento) => (
            <div key={acento.nombre} className={`${acento.clase} rounded-md p-3`}>
              <p className="text-xs font-semibold">{acento.nombre}</p>
              <p className="mt-0.5 text-[0.625rem] opacity-80">{acento.uso}</p>
            </div>
          ))}
        </div>
      </Muestra>

      <Muestra
        titulo="Radios"
        nota="No existe `lg` y no existe `none`: nada en Kaffehaus es cuadrado."
      >
        <div className="grid w-full gap-2 sm:grid-cols-4">
          {RADIOS.map((radio) => (
            <div key={radio.nombre} className="text-center">
              <div className={`${radio.clase} h-16 border-2 border-primary bg-primary-container`} />
              <p className="mt-1.5 text-[0.6875rem] font-medium text-on-surface">{radio.nombre}</p>
              <p className="text-[0.625rem] text-on-surface-variant">{radio.uso}</p>
            </div>
          ))}
        </div>
      </Muestra>

      <Muestra titulo="Tipografía" nota="Playfair solo en portada. Inter para trabajar." className="block">
        <p className="font-display text-3xl font-bold text-on-surface">Kaffehaus</p>
        <p className="mt-1 text-[0.6875rem] text-on-surface-variant">
          Playfair Display · portada y títulos de nivel display
        </p>

        <p className="mt-4 text-base text-on-surface">Flat white doble, para llevar</p>
        <p className="mt-1 text-[0.6875rem] text-on-surface-variant">Inter · cuerpo</p>

        <p className="label-caps mt-4 text-on-surface-variant">Etiqueta de categoría</p>
        <p className="mt-1 text-[0.6875rem] text-on-surface-variant">
          12px, semibold, mayúsculas y tracking amplio
        </p>

        <p className="mt-4 text-sm text-on-surface" data-tabular>
          1 240,50 · 18 L / 20 L · 2,5 kg
        </p>
        <p className="mt-1 text-[0.6875rem] text-on-surface-variant">
          Cifras tabulares: en una tabla, las columnas alinean
        </p>
      </Muestra>
    </Seccion>
  );
}
