import { decode, sign } from 'jsonwebtoken';
import { testConfig } from '@libs/testing/test-config';
import { BARISTA } from '../../testing/fake-users';
import { JwtTokenService } from './jwt-token.service';

const config = testConfig();
const tokens = new JwtTokenService(config);

describe('JwtTokenService', () => {
  it('issues an access token and a refresh token for the user, with the role', () => {
    const { accessToken, refreshToken } = tokens.issue(BARISTA);
    expect(decode(accessToken)).toMatchObject({ sub: BARISTA.id, type: 'access', role: 'Barista', iss: 'kaffehaus-ml' });
    expect(decode(refreshToken)).toMatchObject({ sub: BARISTA.id, type: 'refresh' });
  });

  it('gives access tokens the configured lifetime', () => {
    const claims = decode(tokens.accessFor(BARISTA)) as { iat: number; exp: number };
    expect(claims.exp - claims.iat).toBe(15 * 60);
  });

  it('reads the user back from a refresh token', () => {
    expect(tokens.userIdFromRefresh(tokens.issue(BARISTA).refreshToken)).toBe(BARISTA.id);
  });

  it('does not accept an access token as a refresh token', () => {
    expect(tokens.userIdFromRefresh(tokens.accessFor(BARISTA))).toBeNull();
  });

  it('does not accept a token signed with another secret or issuer', () => {
    const forged = sign({ type: 'refresh' }, 'otro-secreto-de-al-menos-32-bytes!!', { subject: BARISTA.id, issuer: 'kaffehaus-ml' });
    const foreign = new JwtTokenService(testConfig({ jwtIssuer: 'otra-api' })).issue(BARISTA).refreshToken;
    expect(tokens.userIdFromRefresh(forged)).toBeNull();
    expect(tokens.userIdFromRefresh(foreign)).toBeNull();
  });

  it('does not accept an expired refresh token', () => {
    const expired = sign({ type: 'refresh', exp: Math.floor(Date.now() / 1000) - 1 }, config.jwtSecret, {
      subject: BARISTA.id,
      issuer: config.jwtIssuer,
    });
    expect(tokens.userIdFromRefresh(expired)).toBeNull();
  });
});
