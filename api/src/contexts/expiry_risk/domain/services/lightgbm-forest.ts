/**
 * Evaluates the LightGBM model from its JSON dump (`dump_model()`), so the API
 * needs no Python. Probability = sigmoid(sum of the leaf reached in each tree);
 * it matches Python to 1e-12 on the exported rows.
 *
 * Split rules, from LightGBM's `Tree::NumericalDecision`:
 * - `missing_type = None`: NaN is treated as 0 and compared.
 * - `missing_type = NaN`: NaN goes to the default side.
 * - `missing_type = Zero`: NaN and zero go to the default side.
 * - Otherwise: left if `value <= threshold`.
 */
export type TreeNode = SplitNode | LeafNode;

export interface SplitNode {
  split_feature: number;
  threshold: number;
  decision_type: string;
  default_left: boolean;
  missing_type: 'None' | 'NaN' | 'Zero';
  left_child: TreeNode;
  right_child: TreeNode;
}

export interface LeafNode {
  leaf_value: number;
}

const ZERO_THRESHOLD = 1e-35;

export class LightGbmForest {
  private readonly sigmoid: number;

  constructor(
    private readonly trees: readonly TreeNode[],
    objective: string,
  ) {
    const match = /^binary sigmoid:([0-9.]+)$/.exec(objective);
    if (!match) throw new Error(`Objetivo de LightGBM no soportado: «${objective}»`);
    this.sigmoid = Number(match[1]);
    trees.forEach(assertSupported);
  }

  get treeCount(): number {
    return this.trees.length;
  }

  probability(features: readonly number[]): number {
    let raw = 0;
    for (const tree of this.trees) raw += leafValue(tree, features);
    return 1 / (1 + Math.exp(-this.sigmoid * raw));
  }
}

function leafValue(root: TreeNode, x: readonly number[]): number {
  let node = root;
  while (!isLeaf(node)) {
    let value = x[node.split_feature];
    if (node.missing_type === 'None' && Number.isNaN(value)) value = 0;

    const missing =
      (node.missing_type === 'NaN' && Number.isNaN(value)) ||
      (node.missing_type === 'Zero' && (Number.isNaN(value) || Math.abs(value) <= ZERO_THRESHOLD));

    if (missing) node = node.default_left ? node.left_child : node.right_child;
    else node = value <= node.threshold ? node.left_child : node.right_child;
  }
  return node.leaf_value;
}

function isLeaf(node: TreeNode): node is LeafNode {
  return 'leaf_value' in node;
}

/** Rejects at load time any split type this evaluator does not implement. */
function assertSupported(node: TreeNode): void {
  if (isLeaf(node)) return;
  if (node.decision_type !== '<=') {
    throw new Error(`Tipo de división no soportado: «${node.decision_type}» (¿variable categórica?)`);
  }
  assertSupported(node.left_child);
  assertSupported(node.right_child);
}
