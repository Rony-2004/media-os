import assert from 'node:assert/strict';
import test from 'node:test';
import { LINKEDIN_OAUTH_SCOPES } from './oauth';

test('requests only LinkedIn scopes available without restricted feed access', () => {
  const authorizationUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authorizationUrl.searchParams.set('scope', LINKEDIN_OAUTH_SCOPES.join(' '));

  assert.deepEqual(authorizationUrl.searchParams.get('scope')?.split(' '), [
    'openid',
    'profile',
    'email',
    'w_member_social',
  ]);
});
