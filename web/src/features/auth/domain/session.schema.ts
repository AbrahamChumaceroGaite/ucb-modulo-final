import { z } from 'zod';

/** What the sign-in form sends. The API only checks that the password is not empty. */
export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email({ error: 'Escribe un correo válido.' })),
  password: z.string().min(1, 'Escribe la contraseña.'),
});

/** `user` in the API's `POST /auth/login` response. */
export const sessionUserSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  roleId: z.string(),
  roleName: z.string(),
});

export const loginResponseSchema = z.object({
  user: sessionUserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const refreshResponseSchema = z.object({ accessToken: z.string() });

export type Credentials = z.infer<typeof credentialsSchema>;
export type SessionUser = z.infer<typeof sessionUserSchema>;
