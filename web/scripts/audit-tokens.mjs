import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/**
 * Comprueba que todo token de diseño que el código usa esté declarado.
 *
 * Nació de una auditoría: una librería de componentes usaba 34 variables CSS
 * que no existían en ningún sitio —209 usos en total— y su botón primario se
 * renderizaba transparente sobre texto blanco, en su propia página de botones.
 * Nadie lo vio porque nada lo comprobaba.
 *
 * Comprueba tres cosas:
 *   1. Cada `var(--x)` del código está declarado en `globals.css`.
 *   2. Cada clase de color de Tailwind apunta a un token declarado.
 *   3. No se usan radios ni medidas prohibidos por las reglas de diseño.
 */
const RAIZ = process.cwd();
const CSS = join(RAIZ, 'app', 'globals.css');
const CARPETAS = ['app', 'src'];

const css = readFileSync(CSS, 'utf8');

// Tokens declarados: los de `@theme` y los de los bloques de tema.
const declarados = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((coincidencia) => coincidencia[1]));

// Prefijos de color declarados, para validar clases como `bg-primary`.
const colores = new Set(
  [...declarados]
    .filter((token) => token.startsWith('--color-'))
    .map((token) => token.replace('--color-', '')),
);

const RADIOS_VALIDOS = new Set(['xs', 'sm', 'md', 'xl', 'full']);
const UTILIDADES_COLOR = ['bg', 'text', 'border', 'ring', 'fill', 'stroke', 'from', 'to', 'via'];

const archivos = [];
for (const carpeta of CARPETAS) recorrer(join(RAIZ, carpeta));

function recorrer(ruta) {
  for (const entrada of readdirSync(ruta)) {
    if (entrada === 'node_modules' || entrada.startsWith('.')) continue;
    const completa = join(ruta, entrada);
    if (statSync(completa).isDirectory()) recorrer(completa);
    else if (['.ts', '.tsx', '.css'].includes(extname(entrada))) archivos.push(completa);
  }
}

const fallos = [];

/**
 * Nombres que Tailwind ya usa en sus escalas con nombre (`max-w-md`, `w-sm`…).
 *
 * Declarar `--spacing-md` los sombrea: `max-w-md` deja de valer 28rem y pasa a
 * valer lo que diga el token. Nos costó un párrafo partido en una palabra por
 * línea en la portada, y no se ve leyendo el CSS — solo en pantalla.
 */
const NOMBRES_RESERVADOS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
for (const nombre of NOMBRES_RESERVADOS) {
  if (declarados.has(`--spacing-${nombre}`)) {
    fallos.push(
      `globals.css: --spacing-${nombre} sombrea la escala de Tailwind (max-w-${nombre}, w-${nombre}…). Usa la escala numérica.`,
    );
  }
}

for (const archivo of archivos) {
  const contenido = readFileSync(archivo, 'utf8');
  const relativo = archivo.replace(RAIZ, '').replace(/\\/g, '/');

  // 1. var(--x) sin declarar. Se ignora `globals.css`, que es quien declara.
  if (!archivo.endsWith('globals.css')) {
    for (const uso of contenido.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
      const token = uso[1];
      // Las fuentes las inyecta next/font en tiempo de ejecución.
      if (token.startsWith('--fuente-')) continue;
      if (!declarados.has(token)) fallos.push(`${relativo}: usa ${token}, que no está declarado`);
    }
  }

  // 2. Clases de color apuntando a un token inexistente.
  for (const uso of contenido.matchAll(
    new RegExp(`\\b(${UTILIDADES_COLOR.join('|')})-([a-z][a-z0-9-]*)\\b`, 'g'),
  )) {
    const [, utilidad, nombre] = uso;
    // Solo interesan los nombres que parecen nuestros tokens semánticos.
    if (!/^(surface|on-surface|primary|secondary|outline|success|warning|error|on-)/.test(nombre)) continue;
    if (!colores.has(nombre)) {
      fallos.push(`${relativo}: la clase ${utilidad}-${nombre} no corresponde a ningún token`);
    }
  }

  // 3. Radios y medidas prohibidos por las reglas de diseño.
  for (const uso of contenido.matchAll(/\brounded-(none|lg|2xl|3xl)\b/g)) {
    fallos.push(`${relativo}: ${uso[0]} está prohibido (solo ${[...RADIOS_VALIDOS].join(', ')})`);
  }
  for (const uso of contenido.matchAll(/\bmedida="(lg|xl)"/g)) {
    fallos.push(`${relativo}: medida="${uso[1]}" está prohibida (solo sm y md)`);
  }
  for (const uso of contenido.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    if (archivo.endsWith('globals.css')) continue;
    fallos.push(`${relativo}: color literal ${uso[0]}; usa un token`);
  }
}

if (fallos.length > 0) {
  console.error(`\n  ${fallos.length} problema(s) de tokens:\n`);
  for (const fallo of fallos) console.error(`   · ${fallo}`);
  console.error('');
  process.exit(1);
}

console.log(
  `  Tokens en orden: ${declarados.size} declarados, ${archivos.length} archivos revisados.`,
);
