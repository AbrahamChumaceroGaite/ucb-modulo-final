import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '@libs/infrastructure';
import type { IOpenLotRepository, OpenLot } from '../../domain/repositories/IOpenLotRepository.interface';
import { dayNumber } from '../../domain/services/iso-date';

/**
 * Reads the open perishable lots straight from the cafeteria database.
 *
 * It rebuilds, for one morning, the same raw inputs that
 * `training/src/build_dataset.py` builds for every morning of the history:
 * the same movement kinds, the same lot content, the same balance and FEFO
 * queue, the same usage windows and the same 4-decimal rounding. The two are
 * written in different languages, so `test/database.db-spec.ts` checks this
 * class against the lots training exported for the snapshot date.
 */
const USAGE = ['Consumo venta', 'Consumo produccion', 'Venta'];
const WASTE = ['Merma', 'Ajuste negativo'];
const EXPIRY = 'Vencimiento';
const RETURNS = ['Devolucion venta', 'Ajuste positivo'];
const ENTRY = ['Apertura', 'Ingreso produccion'];
const EMPTY = 1e-6;

const LOTS_SQL = `
WITH lines AS (
  SELECT dl.id AS lot_id, dl.id_producto AS product_id,
         l.fecha_compra::date AS received_on, dl.fecha_vencimiento AS expires_on,
         l.es_produccion AS produced, dl.cantidad_inicial AS units
  FROM detalle_lote dl
  JOIN lote l ON l.id = dl.id_lote
  WHERE NOT dl.borrado AND NOT l.borrado
    AND dl.id_producto = ANY($2::uuid[])
    AND l.fecha_compra::date <= $1::date
    AND dl.fecha_vencimiento >= $1::date
),
lot_moves AS (
  SELECT e.id_detalle_lote AS lot_id, m.cantidad AS quantity, m.fecha_movimiento AS moved_at, tm.nombre AS kind
  FROM lines
  JOIN existencias e ON e.id_detalle_lote = lines.lot_id AND NOT e.borrado
  JOIN movimientos m ON m.id_existencia = e.id AND NOT m.borrado
  JOIN tipo_movimiento tm ON tm.id = m.id_tipo_movimiento
),
unit_content AS (
  -- What a freshly opened container of each product holds: 1000 ml, 12 units...
  SELECT dl.id_producto AS product_id, mode() WITHIN GROUP (ORDER BY e.contenido_inicial) AS content
  FROM existencias e
  JOIN detalle_lote dl ON dl.id = e.id_detalle_lote AND NOT dl.borrado
  JOIN movimientos m ON m.id_existencia = e.id AND NOT m.borrado
  JOIN tipo_movimiento tm ON tm.id = m.id_tipo_movimiento AND tm.nombre = 'Apertura'
  WHERE NOT e.borrado AND dl.id_producto = ANY($2::uuid[])
  GROUP BY dl.id_producto
),
content AS (
  -- Production lots get a single container with whatever was produced.
  SELECT lines.lot_id,
         CASE WHEN lines.produced
              THEN coalesce((SELECT sum(lm.quantity) FROM lot_moves lm
                             WHERE lm.lot_id = lines.lot_id AND lm.kind = ANY($5::text[])), 0)
              ELSE lines.units * uc.content
         END AS content
  FROM lines
  LEFT JOIN unit_content uc ON uc.product_id = lines.product_id
),
gone AS (
  SELECT lot_id,
         sum(CASE WHEN kind = ANY($3::text[]) THEN quantity
                  WHEN kind = ANY($4::text[]) THEN -quantity
                  ELSE 0 END) AS quantity
  FROM lot_moves
  WHERE moved_at < $1::date
  GROUP BY lot_id
)
SELECT lines.lot_id, lines.product_id, lines.received_on::text, lines.expires_on::text,
       content.content::float8 AS content,
       greatest(content.content - coalesce(gone.quantity, 0), 0)::float8 AS balance
FROM lines
JOIN content USING (lot_id)
LEFT JOIN gone USING (lot_id)
WHERE content.content > 0`;

const USAGE_SQL = `
SELECT dl.id_producto AS product_id, m.fecha_movimiento::date::text AS day, sum(m.cantidad)::float8 AS quantity
FROM movimientos m
JOIN existencias e ON e.id = m.id_existencia AND NOT e.borrado
JOIN detalle_lote dl ON dl.id = e.id_detalle_lote AND NOT dl.borrado
JOIN tipo_movimiento tm ON tm.id = m.id_tipo_movimiento
WHERE NOT m.borrado
  AND dl.id_producto = ANY($2::uuid[])
  AND tm.nombre = ANY($3::text[])
  AND m.fecha_movimiento >= $1::date - 28
  AND m.fecha_movimiento < $1::date
GROUP BY 1, 2`;

const FIRST_PURCHASE_SQL = `
SELECT dl.id_producto AS product_id, min(l.fecha_compra::date)::text AS day
FROM detalle_lote dl
JOIN lote l ON l.id = dl.id_lote
WHERE NOT dl.borrado AND NOT l.borrado AND dl.id_producto = ANY($1::uuid[])
GROUP BY 1`;

interface LotRow {
  lot_id: string;
  product_id: string;
  received_on: string;
  expires_on: string;
  content: number;
  balance: number;
}

@Injectable()
export class OpenLotPostgresRepository implements IOpenLotRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async latestDataDay(): Promise<string | null> {
    const { rows } = await this.pool.query<{ day: string | null }>(
      'SELECT max(fecha_movimiento)::date::text AS day FROM movimientos WHERE NOT borrado',
    );
    return rows[0]?.day ?? null;
  }

  async findOpen(reviewedOn: string, productIds: readonly string[]): Promise<OpenLot[]> {
    const ids = [...productIds];
    const [lots, usage, firstPurchase] = await Promise.all([
      this.pool.query<LotRow>(LOTS_SQL, [reviewedOn, ids, [...USAGE, ...WASTE, EXPIRY], RETURNS, ENTRY]),
      this.pool.query<{ product_id: string; day: string; quantity: number }>(USAGE_SQL, [reviewedOn, ids, USAGE]),
      this.pool.query<{ product_id: string; day: string }>(FIRST_PURCHASE_SQL, [ids]),
    ]);

    const averages = usageAverages(reviewedOn, usage.rows, firstPurchase.rows);
    const open = lots.rows.filter((lot) => lot.balance > EMPTY);
    const ahead = stockAhead(open);

    return open.map((lot) => ({
      lotId: lot.lot_id,
      productId: lot.product_id,
      receivedOn: lot.received_on,
      expiresOn: lot.expires_on,
      reviewedOn,
      initialQuantity: round4(lot.content),
      remainingQuantity: round4(lot.balance),
      stockAhead: round4(ahead.get(lot.lot_id) ?? 0),
      usage7d: averages.get(lot.product_id)?.usage7d ?? null,
      usage28d: averages.get(lot.product_id)?.usage28d ?? null,
    }));
  }
}

/**
 * Average daily usage over the 7 and 28 days before the review morning.
 * Days with no usage count as zero; a product without a full window yet gets
 * `null`, as in training (pandas `rolling(n, min_periods=n)`).
 */
function usageAverages(
  reviewedOn: string,
  usage: { product_id: string; day: string; quantity: number }[],
  firstPurchase: { product_id: string; day: string }[],
): Map<string, { usage7d: number | null; usage28d: number | null }> {
  const today = dayNumber(reviewedOn);
  const result = new Map<string, { usage7d: number | null; usage28d: number | null }>();

  for (const { product_id: productId, day: first } of firstPurchase) {
    const daily = new Map(
      usage.filter((row) => row.product_id === productId).map((row) => [dayNumber(row.day), row.quantity]),
    );
    const window = (days: number): number | null => {
      if (today - days < dayNumber(first)) return null;
      let sum = 0;
      for (let day = today - days; day < today; day += 1) sum += daily.get(day) ?? 0;
      return round4(sum / days);
    };
    result.set(productId, { usage7d: window(7), usage28d: window(28) });
  }
  return result;
}

/** FEFO queue: lots of the same product that expire earlier (then received earlier, then by id). */
function stockAhead(lots: LotRow[]): Map<string, number> {
  const ordered = [...lots].sort(
    (a, b) =>
      a.product_id.localeCompare(b.product_id) ||
      a.expires_on.localeCompare(b.expires_on) ||
      a.received_on.localeCompare(b.received_on) ||
      (a.lot_id < b.lot_id ? -1 : a.lot_id > b.lot_id ? 1 : 0),
  );
  const ahead = new Map<string, number>();
  let product = '';
  let queue = 0;
  for (const lot of ordered) {
    if (lot.product_id !== product) {
      product = lot.product_id;
      queue = 0;
    }
    ahead.set(lot.lot_id, queue);
    queue += lot.balance;
  }
  return ahead;
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
