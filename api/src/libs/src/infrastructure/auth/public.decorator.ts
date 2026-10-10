import { SetMetadata } from '@nestjs/common';

export const ES_PUBLICA = 'esPublica';

/** Marks a route that does not require a token (only the health check). */
export const Public = () => SetMetadata(ES_PUBLICA, true);
