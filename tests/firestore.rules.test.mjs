import { before, after, beforeEach, describe, it } from 'mocha';
import assert from 'node:assert/strict';
import {
  setupTestEnvironment,
  clearTestData,
  teardownTestEnvironment,
  assertFails,
  assertSucceeds,
} from './firestore-test-env.mjs';

let testEnv;

function postPayload({ postId, businessId, caption = 'Updated caption' }) {
  return {
    id: postId,
    businessId,
    businessName: 'Compass Cafe',
    businessAvatar: 'https://example.com/avatar.png',
    caption,
    imageUrl: 'https://example.com/post.png',
    createdAt: new Date(),
    likes: 0,
    verified: false,
  };
}

describe('Firestore security rules', () => {
  before(async () => {
    testEnv = await setupTestEnvironment();
  });

  beforeEach(async () => {
    await clearTestData(testEnv);

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      await db.doc('users/owner-1').set({
        id: 'owner-1',
        name: 'Owner One',
        email: 'owner1@example.com',
        role: 'owner',
        businessId: 'biz-1',
      });

      await db.doc('users/user-1').set({
        id: 'user-1',
        name: 'User One',
        email: 'user1@example.com',
        role: 'user',
      });

      await db.doc('posts/post-1').set(postPayload({ postId: 'post-1', businessId: 'biz-1', caption: 'Seed post' }));
      await db.doc('posts/post-2').set(postPayload({ postId: 'post-2', businessId: 'biz-2', caption: 'Other business post' }));
    });
  });

  after(async () => {
    await teardownTestEnvironment(testEnv);
  });

  it('prevents a standard user from writing directly to /users/{userId}', async () => {
    const userDb = testEnv.authenticatedContext('user-1').firestore();

    await assertFails(
      userDb.doc('users/user-1').set({
        id: 'user-1',
        name: 'Tampered User',
        email: 'tamper@example.com',
        role: 'owner',
      }),
    );
  });

  it('allows owners to update only posts tied to their businessId', async () => {
    const ownerDb = testEnv.authenticatedContext('owner-1').firestore();

    await assertSucceeds(
      ownerDb.doc('posts/post-1').update({
        ...postPayload({ postId: 'post-1', businessId: 'biz-1' }),
      }),
    );

    await assertFails(
      ownerDb.doc('posts/post-2').update({
        ...postPayload({ postId: 'post-2', businessId: 'biz-2', caption: 'Unauthorized update' }),
      }),
    );
  });

  it('allows admin claim to bypass restrictions', async () => {
    const adminDb = testEnv.authenticatedContext('admin-1', { admin: true }).firestore();

    await assertSucceeds(
      adminDb.doc('users/user-1').set({
        id: 'user-1',
        name: 'Admin Override',
        email: 'override@example.com',
        role: 'owner',
        businessId: 'biz-999',
      }),
    );

    await assertSucceeds(
      adminDb.doc('posts/post-2').update({
        ...postPayload({ postId: 'post-2', businessId: 'biz-999', caption: 'Admin updated this freely' }),
      }),
    );

    assert.ok(true);
  });
});
