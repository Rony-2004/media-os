import assert from 'node:assert/strict';
import test from 'node:test';
import { toAuthUser } from './auth-user';

test('maps a Better Auth user to the existing ConnectUs session shape', () => {
  const user = toAuthUser({
    id: 'user_123',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    image: 'https://example.com/ada.png',
    emailVerified: true,
    role: 'ADMIN',
    plan: 'PRO',
    weeklyPostLimit: 10,
    isBlocked: false,
    isActive: true,
  });

  assert.deepEqual(user, {
    id: 'user_123',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    avatar: 'https://example.com/ada.png',
    emailVerified: true,
    role: 'ADMIN',
    plan: 'PRO',
    weeklyPostLimit: 10,
    isBlocked: false,
    isActive: true,
  });
});
