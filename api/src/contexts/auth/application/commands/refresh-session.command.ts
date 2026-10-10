import type { RefreshSessionDto } from '../dto/refresh-session.dto';

export class RefreshSessionCommand {
  constructor(public readonly dto: RefreshSessionDto) {}
}
