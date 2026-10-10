import { DomainException } from '@libs/domain';
import { LoggerService } from '@libs/infrastructure/monitoring/logger.service';
import { testConfig } from '@libs/testing/test-config';
import { Pbkdf2PasswordHasher } from '../../../infrastructure/crypto/pbkdf2-password-hasher';
import { JwtTokenService } from '../../../infrastructure/tokens/jwt-token.service';
import { BARISTA, FakeUserRepository, TEST_PASSWORD } from '../../../testing/fake-users';
import type { SessionResponse } from '../../types/session.types';
import { LoginCommand } from '../login.command';
import { LoginHandler } from './login.handler';

const hasher = new Pbkdf2PasswordHasher();
const verify = jest.spyOn(hasher, 'verify');
const handler = new LoginHandler(new FakeUserRepository(), hasher, new JwtTokenService(testConfig()), new LoggerService());

const login = (email: string, password: string) => handler.execute(new LoginCommand({ email, password }));

describe('LoginHandler', () => {
  beforeEach(() => verify.mockClear());

  it('returns the user and both tokens for the right password', async () => {
    const session = (await login(BARISTA.email, TEST_PASSWORD)) as SessionResponse;
    expect(session.user).toEqual({ id: BARISTA.id, fullName: 'Ana Quispe', roleId: BARISTA.roleId, roleName: 'Barista' });
    expect(session.accessToken).toEqual(expect.any(String));
    expect(session.refreshToken).toEqual(expect.any(String));
  });

  it('gives the same answer for a wrong password and for an unknown email', async () => {
    const wrongPassword = await login(BARISTA.email, 'otra-cosa');
    const unknownEmail = await login('nadie@kaffehaus.test', TEST_PASSWORD);
    for (const result of [wrongPassword, unknownEmail]) {
      expect(DomainException.isDomainException(result) && [result.status, result.message]).toEqual([
        401,
        'Correo o contraseña incorrectos.',
      ]);
    }
  });

  it('still hashes when the email does not exist, so timing does not reveal accounts', async () => {
    await login('nadie@kaffehaus.test', TEST_PASSWORD);
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify.mock.calls[0][1]).toMatch(/^pbkdf2\$210000\$/);
  });
});
