import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, dirname, resolve } from 'node:path';

/**
 * Busca código que no sirve a nadie. Tres clases, y las tres se cobran igual:
 *
 *   1. **Huérfanos**: archivos de `src/` que nadie importa. Existen, compilan
 *      y no se ejecutan nunca.
 *   2. **Exportaciones muertas**: nombres exportados que ningún otro archivo
 *      menciona. El compilador no se queja porque exportar es legal.
 *   3. **Reexportaciones estériles**: lo que un barril saca fuera y nadie
 *      consume. El barril crece, la superficie pública crece, y no hay
 *      consumidor al otro lado.
 *   4. **Código que solo usan sus pruebas**: una prueba verde no justifica
 *      que algo exista. Si ninguna pantalla lo ejecuta, sobra — y la prueba
 *      con él.
 *
 * Nace de una auditoría: en un proyecto de 236 archivos encontramos 14 sin un
 * solo consumidor, incluido un caso de uso completo con su servicio. `tsc` los
 * daba por buenos uno a uno; nadie los miraba juntos.
 *
 * El análisis es textual a propósito —no hay grafo de TypeScript— porque el
 * coste de mantener eso no compensa para lo que busca: un nombre que no
 * aparece en ningún otro archivo no lo usa nadie, y punto.
 */
const RAIZ = process.cwd();
const CARPETAS = ['app', 'src'];

/**
 * Puntos de entrada que el marco carga por convención de nombre. Nadie los
 * importa y eso es correcto: los llama Next, no una línea de código.
 */
const ENTRADAS = /(^|\/)(page|layout|route|not-found|error|loading|template|proxy|instrumentation)\.tsx?$/;

/**
 * Los archivos de prueba los carga el runner por patrón, igual que Next carga
 * las páginas: que nadie los importe es lo correcto, no un síntoma.
 */
const PRUEBA = /\.test\.tsx?$/;

/**
 * El arnés de pruebas: lo único que puede vivir de las pruebas sin ser código
 * muerto, porque su trabajo ES servir a las pruebas.
 *
 * Es una excepción de una carpeta, no una categoría: `src/shared/testing/`.
 * Cualquier otra cosa que solo usen sus pruebas sigue siendo un resto. Si esta
 * puerta se abriera a `**\/testing\/**` acabaría habiendo una carpeta así en
 * cada feature, y con ella el sitio donde esconder lo que ya no se usa.
 */
const ARNES = /^src[\/]shared[\/]testing[\/]/;

/**
 * Nombres que el marco lee por convención desde un archivo de ruta. Nadie los
 * importa y así tiene que ser: los consume Next al construir la página.
 */
const EXPORTACIONES_DEL_MARCO = new Set([
  'metadata',
  'generateMetadata',
  'viewport',
  'generateViewport',
  'generateStaticParams',
  'dynamic',
  'revalidate',
  'runtime',
  'config',
]);

const archivos = [];
for (const carpeta of CARPETAS) recorrer(join(RAIZ, carpeta));

function recorrer(ruta) {
  for (const entrada of readdirSync(ruta)) {
    if (entrada === 'node_modules' || entrada.startsWith('.')) continue;
    const completa = join(ruta, entrada);
    if (statSync(completa).isDirectory()) recorrer(completa);
    else if (['.ts', '.tsx'].includes(extname(entrada))) archivos.push(completa);
  }
}

const rutaRelativa = (archivo) => relative(RAIZ, archivo).replace(/\\/g, '/');
const contenidos = new Map(archivos.map((archivo) => [archivo, readFileSync(archivo, 'utf8')]));

// ─── 1. Grafo de importaciones ───────────────────────────────────────────────
const importadoPor = new Map(archivos.map((archivo) => [archivo, new Set()]));

for (const archivo of archivos) {
  // Comillas simples o dobles. El proyecto usa simples, pero atarse a ellas
  // hacía que un archivo formateado con dobles apareciera entero como
  // huérfano: 14 falsos positivos de golpe, y ninguno cierto.
  for (const uso of contenidos.get(archivo).matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const destino = resolverEspecificador(uso[1], archivo);
    if (destino) importadoPor.get(destino).add(archivo);
  }
}

/** Traduce `@/x` y `./x` al archivo real, probando las extensiones de siempre. */
function resolverEspecificador(especificador, desde) {
  let base;
  if (especificador.startsWith('@/')) base = join(RAIZ, 'src', especificador.slice(2));
  else if (especificador.startsWith('.')) base = resolve(dirname(desde), especificador);
  else return null; // Paquete de node_modules.

  for (const candidato of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ]) {
    if (contenidos.has(candidato)) return candidato;
  }
  return null;
}

// ─── 2. Exportaciones declaradas ─────────────────────────────────────────────
const NOMBRE = '[A-Za-z_$][\\w$]*';
const DECLARACION = new RegExp(
  `export\\s+(?:declare\\s+)?(?:async\\s+)?(?:const|let|function|class|type|interface|enum)\\s+(${NOMBRE})`,
  'g',
);

const exportaciones = new Map(); // nombre -> archivos que lo declaran
for (const archivo of archivos) {
  // El barril solo reexporta; lo que declara no lo declara él.
  if (archivo.endsWith('index.ts')) continue;

  for (const uso of contenidos.get(archivo).matchAll(DECLARACION)) {
    if (EXPORTACIONES_DEL_MARCO.has(uso[1])) continue;
    if (!exportaciones.has(uso[1])) exportaciones.set(uso[1], new Set());
    exportaciones.get(uso[1]).add(archivo);
  }
}

// ─── 3. Veredicto ────────────────────────────────────────────────────────────
const fallos = [];

for (const archivo of archivos) {
  const relativo = rutaRelativa(archivo);
  if (!relativo.startsWith('src/')) continue;
  if (importadoPor.get(archivo).size > 0) continue;
  if (ENTRADAS.test(relativo) || PRUEBA.test(relativo)) continue;

  fallos.push(`huérfano · ${relativo}: no lo importa ningún archivo`);
}

/**
 * Un barril puede reexportar con otro nombre: `export { leerUsuario as X }`.
 * Sin esto, el nombre original parecería muerto aunque el alias se use en
 * media aplicación.
 */
const alias = new Map();
for (const archivo of archivos) {
  const reexporta = new RegExp(`(${NOMBRE})\\s+as\\s+(${NOMBRE})`, 'g');
  for (const uso of contenidos.get(archivo).matchAll(reexporta)) {
    if (!alias.has(uso[1])) alias.set(uso[1], new Set());
    alias.get(uso[1]).add(uso[2]);
  }
}

for (const [nombre, declarantes] of exportaciones) {
  const buscados = [nombre, ...(alias.get(nombre) ?? [])];
  const patron = new RegExp(`\\b(${buscados.join('|')})\\b`);
  const consumidores = archivos.filter(
    (archivo) => !declarantes.has(archivo) && patron.test(contenidos.get(archivo)),
  );

  if (consumidores.length === 0) {
    const donde = [...declarantes].map(rutaRelativa).join(', ');
    fallos.push(`muerto · ${nombre} (${donde}): lo exporta y no lo menciona nadie más`);
    continue;
  }

  const soloBarriles = consumidores.every((archivo) => archivo.endsWith('index.ts'));
  if (soloBarriles) {
    const donde = [...declarantes].map(rutaRelativa).join(', ');
    fallos.push(`estéril · ${nombre} (${donde}): solo lo menciona el barril que lo reexporta`);
    continue;
  }

  // Algo que solo usan sus pruebas no lo usa el producto: la prueba mantiene
  // vivo código que no se ejecuta en ninguna pantalla.
  const esArnes = [...declarantes].every((archivo) => ARNES.test(rutaRelativa(archivo)));
  const soloPruebas = !esArnes && consumidores.every((archivo) => PRUEBA.test(archivo));
  if (soloPruebas) {
    const donde = [...declarantes].map(rutaRelativa).join(', ');
    fallos.push(`solo-pruebas · ${nombre} (${donde}): lo único que lo usa es su propia prueba`);
  }
}

if (fallos.length > 0) {
  console.error(`\n  ${fallos.length} resto(s) de código sin consumidor:\n`);
  for (const fallo of fallos.sort()) console.error(`   · ${fallo}`);
  console.error('');
  process.exit(1);
}

console.log(`  Sin código muerto: ${archivos.length} archivos, ${exportaciones.size} exportaciones.`);
