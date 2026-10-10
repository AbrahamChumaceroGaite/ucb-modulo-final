import { readFileSync, readdirSync, existsSync } from 'node:fs';

/**
 * Las pantallas de lista están hechas igual.
 *
 * ## Por qué existe
 *
 * Productos tuvo recorrido guiado durante una entrega entera y Usuarios no.
 * Misma plantilla, mismos patrones, misma barra — y una con ayuda y otra sin.
 * La asimetría no se ve escribiendo una pantalla: se ve poniéndolas al lado, y
 * nadie las pone al lado a mano cada vez. Con una tercera pantalla —Recetas—
 * la probabilidad de que se separen deja de ser teórica.
 *
 * ## Por qué es un script y no una prueba
 *
 * Porque compara **features entre sí**, y ninguna capa puede hacer eso: el
 * dominio no conoce otra feature y `shared` no conoce ninguna. Una prueba
 * puesta en `shared` para poder importarlas sería justo la violación que
 * `eslint-plugin-boundaries` está ahí para impedir — lo intenté y saltó, que
 * es lo que tenía que pasar.
 *
 * Una auditoría del código fuente no importa nada: lee texto. Mismo criterio
 * que `audit-tokens` y `audit-muertos`, y por eso vive al lado de ellos.
 *
 * ## Lo que NO puede ver
 *
 * **Lee el fuente, no el DOM.** Si un `data-tour` está escrito pero el
 * componente al que se le pasa no reenvía atributos sueltos —le pasó a
 * `<SegmentedControl>`—, aquí sale verde y en el navegador el paso señala a
 * nada. Por eso el atributo va en un elemento del DOM o en un envoltorio, y
 * por eso el recorrido se abre una vez en el navegador antes de entregar.
 */

/** Lo que toda pantalla de lista monta. Si falta una, se separaron. */
const PIEZAS = [
  'ListLayout',
  'PageHeader',
  'FilterBar',
  'FiltroDeFecha',
  'HelpButton',
  'ViewSwitcher',
  'Pagination',
  'ConfirmDialog',
  'EmptyState',
  'DrawerPush',
];

/**
 * Los archivos que toda feature con pantalla de lista tiene, con su sufijo.
 *
 * No es burocracia: el sufijo dice en qué capa está cada cosa, y una feature a
 * la que le falta el `.filtros` suele tener el filtrado metido dentro de la
 * vista —que es de donde vino, y donde no se puede probar—.
 */
const ARCHIVOS = [
  ['domain', '.schema.ts'],
  ['domain', '.filtros.ts'],
  ['domain', '.mapper.ts'],
  ['infrastructure', '.keys.ts'],
  ['infrastructure', '.puertos.ts'],
  ['infrastructure', '.mock.ts'],
  ['infrastructure', '.api.ts'],
];

/**
 * Features que nacieron **con su servidor** y por eso no tienen datos falsos.
 *
 * La regla 9.1.b dice que los `*.mock.ts` existen mientras el endpoint no
 * existe y «se borran con el flag» el día que hay servidor. Una feature que
 * llega con el servidor ya levantado y probado no tiene nada que borrar, y
 * escribirle un mock sería escribir algo para borrarlo.
 *
 * `vencimientos` además no **puede** tenerlo: sus datos son predicciones de un
 * modelo, y un mock tendría que inventarse probabilidades. Su servidor es
 * `ml-api/`, con sus propias pruebas de extremo a extremo.
 *
 * Es una lista y no una excepción silenciosa para que entrar en ella se
 * discuta: está en RULES.md, §9.1.b.
 */
const CON_SERVIDOR_DESDE_EL_INICIO = new Set(['vencimientos']);

/**
 * Los cuatro componentes que toda pantalla de lista tiene, por su sufijo.
 *
 * El prefijo cambia con el dominio —`persona-card`, `producto-card`,
 * `receta-card`— y por eso se comprueba el sufijo y no el nombre entero. Lo que
 * importa es que las cuatro piezas existan: si falta `-detalle`, la ficha está
 * escrita dentro de la vista; si falta `-tabla`, la vista de tabla no es tal.
 *
 * Una feature puede tener **más** —`persona-fields`, `producto-stock-dot`—;
 * lo que no puede es tener menos.
 */
const COMPONENTES = ['-card.tsx', '-tabla.tsx', '-detalle.tsx', '-form.tsx'];

/** Los pasos que todo recorrido cubre. Uno propio de una pantalla no cuenta. */
const PROPIOS = new Set(['coleccion-personal']);

const RAIZ = 'src/features';

const pantallas = readdirSync(RAIZ, { withFileTypes: true })
  .filter((entrada) => entrada.isDirectory())
  .flatMap((entrada) => {
    const carpeta = `${RAIZ}/${entrada.name}/presentation`;
    if (!existsSync(carpeta)) return [];

    const vista = readdirSync(carpeta).find((archivo) => archivo.endsWith('.view.tsx'));
    const tour = readdirSync(carpeta).find((archivo) => archivo.endsWith('.tour.ts'));
    if (!vista) return [];

    return [
      {
        nombre: entrada.name,
        raiz: `${RAIZ}/${entrada.name}`,
        vista: `${carpeta}/${vista}`,
        tour: tour ? `${carpeta}/${tour}` : null,
      },
    ];
  });

const leer = (ruta) => readFileSync(ruta, 'utf8');

/**
 * ¿La vista monta esa pieza?
 *
 * Sin expresión regular a propósito. La primera versión usaba una, y el patrón
 * perdió una barra al escribirse dentro de una plantilla: quedó buscando la
 * letra «s» en vez de un espacio, y declaró que ninguna vista montaba nada.
 * Una auditoría que falla por su propio escapado es peor que no tenerla.
 */
const SEPARADORES = new Set([' ', '\n', '\r', '\t', '/', '>']);

const monta = (fuente, pieza) => {
  const donde = fuente.indexOf(`<${pieza}`);
  return donde !== -1 && SEPARADORES.has(fuente[donde + pieza.length + 1]);
};

const pasosDe = (fuente) =>
  [...fuente.matchAll(/elemento:\s*'\[data-tour="([a-z-]+)"\]'/g)].map((hallado) => hallado[1]);

const anclasDe = (fuente) =>
  new Set([...fuente.matchAll(/data-tour="([a-z-]+)"/g)].map((hallado) => hallado[1]));

const fallos = [];
const comunes = new Map();

for (const { nombre, raiz, vista, tour } of pantallas) {
  const fuente = leer(vista);

  for (const [capa, sufijo] of ARCHIVOS) {
    if (sufijo === '.mock.ts' && CON_SERVIDOR_DESDE_EL_INICIO.has(nombre)) continue;
    const carpeta = `${raiz}/${capa}`;
    const hay = existsSync(carpeta) && readdirSync(carpeta).some((a) => a.endsWith(sufijo));
    if (!hay) fallos.push(`${nombre}: no tiene ningún \`${capa}/*${sufijo}\``);
  }

  /*
   * El barril, idéntico en las tres: **solo la vista**.
   *
   * Dos de ellos reexportaban además un tipo que nadie importaba. No es código
   * muerto para `audit-muertos` —el tipo se usa dentro de la feature—, así que
   * solo se ve comparando los tres barriles, que es lo que hace esto.
   */
  const carpetaComponentes = `${raiz}/presentation/components`;
  const componentes = existsSync(carpetaComponentes) ? readdirSync(carpetaComponentes) : [];
  for (const sufijo of COMPONENTES) {
    if (!componentes.some((archivo) => archivo.endsWith(sufijo))) {
      fallos.push(`${nombre}: no tiene ningún componente \`*${sufijo}\``);
    }
  }

  const barril = `${raiz}/index.ts`;
  if (!existsSync(barril)) {
    fallos.push(`${nombre}: no tiene barril \`index.ts\``);
  } else {
    const exportaciones = [...leer(barril).matchAll(/^export .*$/gm)].map((linea) => linea[0]);
    if (exportaciones.length !== 1 || !exportaciones[0].includes('View')) {
      fallos.push(
        `${nombre}: el barril exporta ${exportaciones.length} cosa(s); debe exportar solo la vista`,
      );
    }
  }

  for (const pieza of PIEZAS) {
    if (!monta(fuente, pieza)) {
      fallos.push(`${nombre}: la vista no monta <${pieza}>`);
    }
  }

  if (!tour) {
    fallos.push(`${nombre}: no tiene recorrido guiado, y las demás sí`);
    continue;
  }

  const pasos = pasosDe(leer(tour));
  const anclas = anclasDe(fuente);

  if (pasos.length === 0) fallos.push(`${nombre}: el recorrido no tiene ningún paso`);

  for (const paso of pasos) {
    if (!anclas.has(paso)) {
      fallos.push(`${nombre}: el paso «${paso}» señala un elemento que la vista no pinta`);
    }
  }

  /*
   * Y al revés: un ancla que ningún paso usa es un resto. No rompe nada, y por
   * eso se acumula — apareció así, con `resumen` y `reporte` en ventas, puestos
   * «por si acaso» y sin paso que los señalara. Ni el lint ni `audit-muertos`
   * lo ven, porque es un atributo con una cadena.
   */
  for (const ancla of anclas) {
    if (!pasos.includes(ancla)) {
      fallos.push(`${nombre}: el ancla «${ancla}» no la usa ningún paso del recorrido`);
    }
  }

  comunes.set(
    nombre,
    pasos.filter((paso) => !PROPIOS.has(paso)),
  );
}

const [referencia, ...resto] = [...comunes.entries()];
if (referencia) {
  for (const [nombre, pasos] of resto) {
    const esperado = referencia[1].join(' → ');
    const obtenido = pasos.join(' → ');
    if (esperado !== obtenido) {
      fallos.push(
        `${nombre} y ${referencia[0]} no explican lo mismo: «${obtenido}» frente a «${esperado}»`,
      );
    }
  }
}

if (fallos.length > 0) {
  console.error(`\n  ${fallos.length} desviación(es) entre pantallas de lista:\n`);
  for (const fallo of fallos.sort()) console.error(`   · ${fallo}`);
  console.error('');
  process.exit(1);
}

console.log(
  `  Pantallas en orden: ${pantallas.length} vistas, ${PIEZAS.length} piezas comunes, ` +
    `${ARCHIVOS.length} archivos y ${COMPONENTES.length} componentes por feature, ` +
    `${referencia?.[1].length ?? 0} pasos de recorrido.`,
);
