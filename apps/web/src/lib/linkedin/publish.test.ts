import assert from 'node:assert/strict';
import test from 'node:test';
import { publishLinkedInPost } from './publish';
import * as publishModule from './publish';

test('recovers a persisted AI image for immediate and scheduled publishing', () => {
  const getLinkedInPostImage = (
    publishModule as unknown as {
      getLinkedInPostImage?: (post: {
        mediaUrls: string[];
        metadata: unknown;
      }) => { dataUrl: string; altText: string; title: string } | null;
    }
  ).getLinkedInPostImage;

  assert.equal(typeof getLinkedInPostImage, 'function');
  assert.deepEqual(
    getLinkedInPostImage!({
      mediaUrls: ['data:image/png;base64,iVBORw=='],
      metadata: {
        trend: 'Reliable event processing',
        imageAltText: 'A queue feeding an idempotent worker',
      },
    }),
    {
      dataUrl: 'data:image/png;base64,iVBORw==',
      altText: 'A queue feeding an idempotent worker',
      title: 'Reliable event processing',
    },
  );
});

test('uploads and attaches the generated image before publishing to LinkedIn', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const request: typeof fetch = async (input, init) => {
    const url = String(input);
    requests.push({ url, init });

    if (url.endsWith('/v2/userinfo')) {
      return new Response(JSON.stringify({ sub: 'profile-123' }), { status: 200 });
    }

    if (url.includes('/v2/assets?action=registerUpload')) {
      return new Response(
        JSON.stringify({
          value: {
            asset: 'urn:li:digitalmediaAsset:image-789',
            uploadMechanism: {
              'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
                uploadUrl: 'https://uploads.linkedin.test/image-789',
              },
            },
          },
        }),
        { status: 200 },
      );
    }

    if (url === 'https://uploads.linkedin.test/image-789') {
      return new Response(null, { status: 201 });
    }

    return new Response(JSON.stringify({ id: 'urn:li:ugcPost:456' }), { status: 201 });
  };

  const publishWithOptions = publishLinkedInPost as unknown as (
    accessToken: string,
    content: string,
    options: {
      request: typeof fetch;
      image: { dataUrl: string; altText: string; title: string };
    },
  ) => ReturnType<typeof publishLinkedInPost>;

  await publishWithOptions('test-token', 'Scheduled content', {
    request,
    image: {
      dataUrl: 'data:image/png;base64,iVBORw==',
      altText: 'System diagram for reliable event processing',
      title: 'Reliable event processing',
    },
  });

  assert.equal(requests.length, 4);
  assert.equal(requests[1]?.url, 'https://api.linkedin.com/v2/assets?action=registerUpload');
  assert.equal(requests[2]?.url, 'https://uploads.linkedin.test/image-789');
  assert.equal(requests[2]?.init?.method, 'PUT');
  assert.equal(
    requests[2]?.init?.headers &&
      (requests[2].init?.headers as Record<string, string>)['Content-Type'],
    'image/png',
  );

  const postBody = JSON.parse(String(requests[3]?.init?.body));
  assert.equal(
    postBody.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory,
    'IMAGE',
  );
  assert.deepEqual(postBody.specificContent['com.linkedin.ugc.ShareContent'].media, [
    {
      status: 'READY',
      description: { text: 'System diagram for reliable event processing' },
      media: 'urn:li:digitalmediaAsset:image-789',
      title: { text: 'Reliable event processing' },
    },
  ]);
});

test('converts an already-scheduled SVG card to PNG before uploading it', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const request: typeof fetch = async (input, init) => {
    const url = String(input);
    requests.push({ url, init });

    if (url.endsWith('/v2/userinfo')) {
      return new Response(JSON.stringify({ sub: 'profile-123' }), { status: 200 });
    }
    if (url.includes('/v2/assets?action=registerUpload')) {
      return new Response(
        JSON.stringify({
          value: {
            asset: 'urn:li:digitalmediaAsset:legacy-image',
            uploadMechanism: {
              'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
                uploadUrl: 'https://uploads.linkedin.test/legacy-image',
              },
            },
          },
        }),
        { status: 200 },
      );
    }
    if (url === 'https://uploads.linkedin.test/legacy-image') {
      return new Response(null, { status: 201 });
    }
    return new Response(JSON.stringify({ id: 'urn:li:ugcPost:legacy' }), { status: 201 });
  };

  const publishLegacyImage = publishLinkedInPost as unknown as (
    accessToken: string,
    content: string,
    options: {
      request: typeof fetch;
      rasterize: (svg: string) => Promise<Uint8Array>;
      image: { dataUrl: string; altText: string; title: string };
    },
  ) => ReturnType<typeof publishLinkedInPost>;

  await publishLegacyImage('test-token', 'Scheduled content', {
    request,
    rasterize: async (svg) => {
      assert.equal(svg, '<svg><rect/></svg>');
      return new Uint8Array([137, 80, 78, 71]);
    },
    image: {
      dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg><rect/></svg>')}`,
      altText: 'Legacy system diagram',
      title: 'Legacy post',
    },
  });

  const upload = requests.find((entry) => entry.url.includes('/legacy-image'));
  assert.equal(
    upload?.init?.headers && (upload.init.headers as Record<string, string>)['Content-Type'],
    'image/png',
  );
});

test('publishes LinkedIn content using the account profile and returns the post URL', async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const request: typeof fetch = async (input, init) => {
    const url = String(input);
    requests.push({ url, init });

    if (url.endsWith('/v2/userinfo')) {
      return new Response(JSON.stringify({ sub: 'profile-123' }), { status: 200 });
    }

    return new Response(JSON.stringify({ id: 'urn:li:ugcPost:456' }), { status: 201 });
  };

  const result = await publishLinkedInPost('test-token', 'Scheduled content', request);

  assert.deepEqual(result, {
    platformPostId: 'urn:li:ugcPost:456',
    platformPostUrl: 'https://www.linkedin.com/feed/update/urn:li:ugcPost:456',
  });
  assert.equal(requests.length, 2);
  assert.equal(requests[0].init?.headers && (requests[0].init?.headers as Record<string, string>).Authorization, 'Bearer test-token');
  assert.deepEqual(JSON.parse(String(requests[1].init?.body)), {
    author: 'urn:li:person:profile-123',
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: 'Scheduled content' },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  });
});

test('classifies LinkedIn authentication failures as permanent', async () => {
  const request: typeof fetch = async () => new Response('{}', { status: 401 });

  await assert.rejects(
    () => publishLinkedInPost('expired-token', 'Scheduled content', request),
    (error: unknown) => {
      assert.equal((error as { retryable?: boolean }).retryable, false);
      assert.match((error as Error).message, /token expired/i);
      return true;
    },
  );
});
