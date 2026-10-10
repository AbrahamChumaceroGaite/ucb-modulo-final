import type { EvaluateLotDto } from '../dto/evaluate-lot.dto';

/** A query and not a command: evaluating a typed lot changes nothing. */
export class EvaluateLotQuery {
  constructor(public readonly dto: EvaluateLotDto) {}
}
