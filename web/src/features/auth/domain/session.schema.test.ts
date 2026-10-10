import { describe, expect, it } from 'vitest';
import { credentialsSchema } from './session.schema';

describe('credentialsSchema', () => {
  it('sends the email the way the accounts store it', () => {
    expect(credentialsSchema.parse({ email: ' Admin@Kaffehaus.BO ', password: 'x' }).email).toBe('admin@kaffehaus.bo');
  });

  it('asks for a valid email and a password', () => {
    const result = credentialsSchema.safeParse({ email: 'admin', password: '' });
    expect(result.success ? [] : result.error.issues.map((issue) => issue.message)).toEqual([
      'Escribe un correo válido.',
      'Escribe la contraseña.',
    ]);
  });
});
