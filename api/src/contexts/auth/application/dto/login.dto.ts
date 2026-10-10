import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Escribe un correo válido.' })
  @MaxLength(150, { message: 'El correo es demasiado largo.' })
  email!: string;

  @IsString({ message: 'Escribe la contraseña.' })
  @IsNotEmpty({ message: 'Escribe la contraseña.' })
  @MaxLength(200, { message: 'La contraseña es demasiado larga.' })
  password!: string;
}
