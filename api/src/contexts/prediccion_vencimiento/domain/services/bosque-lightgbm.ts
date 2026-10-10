/**
 * Evaluates a LightGBM binary model from its JSON dump (`dump_model()`).
 *
 * Why not call Python: the service would need a second runtime in production
 * and a process boundary per request. The dump is the exact set of trees
 * Python uses, so evaluating it here gives the same probability; the parity
 * test proves it to 1e-12 on the exported rows.
 *
 * Split semantics, from LightGBM's `Tree::NumericalDecision`:
 * - `missing_type = None`: NaN is treated as 0 and compared.
 * - `missing_type = NaN`: NaN goes to the default side.
 * - `missing_type = Zero`: NaN and zero go to the default side.
 * - Otherwise: left if `value <= threshold`.
 */
export type NodoLightGbm = NodoDivision | HojaLightGbm;

export interface NodoDivision {
  split_feature: number;
  threshold: number;
  decision_type: string;
  default_left: boolean;
  missing_type: 'None' | 'NaN' | 'Zero';
  left_child: NodoLightGbm;
  right_child: NodoLightGbm;
}

export interface HojaLightGbm {
  leaf_value: number;
}

const UMBRAL_CERO = 1e-35;

export class BosqueLightGbm {
  private readonly sigmoide: number;

  constructor(
    private readonly arboles: readonly NodoLightGbm[],
    objetivo: string,
  ) {
    const coincidencia = /^binary sigmoid:([0-9.]+)$/.exec(objetivo);
    if (!coincidencia) throw new Error(`Objetivo de LightGBM no soportado: «${objetivo}»`);
    this.sigmoide = Number(coincidencia[1]);
    arboles.forEach(validarArbol);
  }

  get numArboles(): number {
    return this.arboles.length;
  }

  probabilidad(caracteristicas: readonly number[]): number {
    let bruto = 0;
    for (const arbol of this.arboles) bruto += valorDeHoja(arbol, caracteristicas);
    return 1 / (1 + Math.exp(-this.sigmoide * bruto));
  }
}

function valorDeHoja(raiz: NodoLightGbm, x: readonly number[]): number {
  let nodo = raiz;
  while (!esHoja(nodo)) {
    let valor = x[nodo.split_feature];
    if (nodo.missing_type === 'None' && Number.isNaN(valor)) valor = 0;

    const faltante =
      (nodo.missing_type === 'NaN' && Number.isNaN(valor)) ||
      (nodo.missing_type === 'Zero' && (Number.isNaN(valor) || Math.abs(valor) <= UMBRAL_CERO));

    if (faltante) nodo = nodo.default_left ? nodo.left_child : nodo.right_child;
    else nodo = valor <= nodo.threshold ? nodo.left_child : nodo.right_child;
  }
  return nodo.leaf_value;
}

function esHoja(nodo: NodoLightGbm): nodo is HojaLightGbm {
  return 'leaf_value' in nodo;
}

/** Fails at load time, not at the first request, if the dump has a split this evaluator does not implement. */
function validarArbol(nodo: NodoLightGbm): void {
  if (esHoja(nodo)) return;
  if (nodo.decision_type !== '<=') {
    throw new Error(`Tipo de división no soportado: «${nodo.decision_type}» (¿variable categórica?)`);
  }
  validarArbol(nodo.left_child);
  validarArbol(nodo.right_child);
}
