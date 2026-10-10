import { DomainException } from '@libs/domain';
import { testConfig } from '@libs/testing/test-config';
import { JwtTokenService } from '../../../infrastructure/tokens/jwt-token.service';
import { BARISTA, FakeUserRepository } from '../../../testing/fake-users';
import type { RefreshResponse } from '../../types/session.types';
import { RefreshSessionCommand } from '../refresh-session.command';
import { RefreshSessionHandler } from './refresh-session.handler';

const tokens = new JwtTokenService(testConfig());
const refreshToken = tokens.issue(BARISTA).refreshToken;

const refresh = (users: FakeUserRepository, token = refreshToken) =>
  new RefreshSessionHandler(users, tokens).execute(new RefreshSessionCommand({ refreshToken: token }));

describe('RefreshSessionHandler', () => {
  it('issues a new access token for an active user', async () => {
    const result = (await refresh(new FakeUserRepository())) as RefreshResponse;
    expect(result.accessToken.split('.')).toHaveLength(3);
    // It is an access token: it cannot be used to refresh again.
    expect(tokens.userIdFromRefresh(result.accessToken)).toBeNull();
  });

  it('stops a user deleted after signing in', async () => {
    const result = await refresh(new FakeUserRepository([]));
    expect(DomainException.isDomainException(result) && result.status).toBe(401);
  });

  it('rejects an access token passed as a refresh token', async () => {
    const result = await refresh(new FakeUserRepository(), tokens.accessFor(BARISTA));
    expect(DomainException.isDomainException(result) && result.status).toBe(401);
  });
});
