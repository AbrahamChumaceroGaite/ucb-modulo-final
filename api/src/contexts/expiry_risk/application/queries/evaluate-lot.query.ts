import type { EvaluateLotDto } from '../dto/evaluate-lot.dto';

/** A query: evaluating a lot stores nothing. */
export class EvaluateLotQuery {
  constructor(public readonly dto: EvaluateLotDto) {}
}
