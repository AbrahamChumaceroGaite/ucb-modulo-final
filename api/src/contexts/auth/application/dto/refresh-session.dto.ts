import { IsJWT } from 'class-validator';

export class RefreshSessionDto {
  @IsJWT({ message: 'La sesión no es válida. Vuelve a entrar.' })
  refreshToken!: string;
}
