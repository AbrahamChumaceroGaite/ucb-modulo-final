import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/** Marks a route that does not require a token: login, refresh and health. */
export const Public = () => SetMetadata(IS_PUBLIC, true);
