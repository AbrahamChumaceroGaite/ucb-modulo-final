/**
 * Calcula qué cambió entre el registro original y lo que el formulario devuelve.
 *
 * Existe una sola vez porque el cálculo es idéntico para todos los dominios: lo
 * que cambia es el tipo, no la lógica. En el proyecto Angular auditado esto
 * estaba reescrito en cada feature, con tres políticas distintas conviviendo.
 *
 * ## La distinción que importa
 *
 * - `undefined` → «no se tocó». No viaja.
 * - `null` → «bórralo». **Sí viaja.**
 *
 * Mezclarlas es el bug más caro que encontramos auditando: allí el filtro era
 * `if (nuevo && ...)`, así que vaciar una fecha nunca llegaba al servidor. Son
 * siete fechas por registro que se podían poner y jamás quitar, sin ni un test
 * que lo cubriera.
 */
export function toPatch<T extends Record<string, unknown>>(
  original: T,
  actual: Partial<T>,
): Partial<T> {
  const cambios: Partial<T> = {};

  for (const clave of Object.keys(actual) as Array<keyof T>) {
    const nuevo = actual[clave];
    if (nuevo === undefined) continue; // no se tocó

    if (!sonIguales(original[clave], nuevo)) {
      cambios[clave] = nuevo; // incluye `null`, que significa «bórralo»
    }
  }

  return cambios;
}

/**
 * Comparación por valor, hasta donde llegan los valores de un formulario.
 *
 * `Object.is` distingue `null` de `undefined`, que es justo lo que aquí no se
 * puede perder. Los arrays se comparan elemento a elemento porque un selector
 * múltiple devuelve un array nuevo en cada render.
 *
 * ## Por qué entra en los objetos
 *
 * Hasta que llegaron las recetas, todos los formularios eran planos y bastaba
 * con comparar los elementos por referencia. Una receta lleva **listas de
 * objetos** —ingredientes y pasos—, y el formulario los reconstruye en cada
 * render: comparados por referencia, dos listas idénticas salían siempre como
 * cambiadas y el PATCH mandaba las dos listas enteras **en cada guardado**,
 * incluso sin tocar nada. Lo cazó la prueba «sin cambios no manda nada».
 *
 * La recursión es la mínima que hace falta: arrays y objetos planos. No maneja
 * fechas, mapas ni ciclos, porque un formulario no produce nada de eso — y el
 * día que lo produzca, esto tiene que fallar de forma visible y no adivinar.
 */
function sonIguales(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((valor, i) => sonIguales(valor, b[i]));
  }

  if (esObjetoPlano(a) && esObjetoPlano(b)) {
    const clavesA = Object.keys(a);
    const clavesB = Object.keys(b);
    return (
      clavesA.length === clavesB.length &&
      clavesA.every((clave) => sonIguales(a[clave], b[clave]))
    );
  }

  return false;
}

/** `null` no es un objeto plano, y una instancia de clase tampoco. */
function esObjetoPlano(valor: unknown): valor is Record<string, unknown> {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    !Array.isArray(valor) &&
    Object.getPrototypeOf(valor) === Object.prototype
  );
}
