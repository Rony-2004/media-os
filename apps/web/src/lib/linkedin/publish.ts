import { PublishError } from '@/lib/scheduler';

export interface LinkedInPublishResult {
  platformPostId: string | null;
  platformPostUrl: string | null;
}

export interface LinkedInPublishImage {
  dataUrl: string;
  altText: string;
  title: string;
}

export interface LinkedInPublishOptions {
  image?: LinkedInPublishImage | null;
  request?: typeof fetch;
  rasterize?: (svg: string) => Promise<Uint8Array>;
}

interface PersistedPostMedia {
  mediaUrls?: readonly string[];
  metadata?: unknown;
}

const USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';
const UGC_POSTS_URL = 'https://api.linkedin.com/v2/ugcPosts';
const ASSETS_URL = 'https://api.linkedin.com/v2/assets?action=registerUpload';

function asMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Restores the generated image from a Prisma post for any publish entry point. */
export function getLinkedInPostImage(post: PersistedPostMedia): LinkedInPublishImage | null {
  const metadata = asMetadata(post.metadata);
  const metadataUrl = typeof metadata.imageUrl === 'string' ? metadata.imageUrl : null;
  const dataUrl =
    post.mediaUrls?.find((url) => url.startsWith('data:image/')) ?? metadataUrl;
  if (!dataUrl?.startsWith('data:image/')) return null;

  const trend = typeof metadata.trend === 'string' ? metadata.trend : 'Technical insight';
  const altText =
    typeof metadata.imageAltText === 'string'
      ? metadata.imageAltText
      : `System design diagram for ${trend}`;
  return { dataUrl, altText, title: trend };
}

/**
 * Maps a LinkedIn HTTP status onto whether retrying could ever succeed.
 * Anything permission- or token-shaped is permanent: retrying it just burns
 * quota and hides the real fix from the user.
 */
function classify(status: number, body: string): PublishError {
  if (status === 401) {
    return new PublishError(
      'LinkedIn token expired or was revoked. Reconnect the account from the Accounts page.',
      false,
    );
  }

  if (status === 403) {
    return new PublishError(
      'LinkedIn refused the post. The account is missing the w_member_social permission, or the ' +
        'developer app does not have the "Share on LinkedIn" product enabled. Enable it, then reconnect.',
      false,
    );
  }

  if (status === 422) {
    return new PublishError(`LinkedIn rejected the post content: ${body.slice(0, 300)}`, false);
  }

  if (status === 429) {
    return new PublishError('LinkedIn rate limit reached. This will be retried.', true);
  }

  if (status >= 500) {
    return new PublishError(`LinkedIn is unavailable (${status}). This will be retried.`, true);
  }

  return new PublishError(`LinkedIn API error (${status}): ${body.slice(0, 300)}`, false);
}

async function rasterizeSvg(svg: string): Promise<Uint8Array> {
  const { default: sharp } = await import('sharp');
  return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer());
}

async function decodeImage(
  dataUrl: string,
  rasterize: (svg: string) => Promise<Uint8Array>,
): Promise<{ blob: Blob; mimeType: string }> {
  const svgMatch = /^data:image\/svg\+xml;(?:utf8|charset=utf-8),(.+)$/i.exec(dataUrl);
  if (svgMatch) {
    const png = await rasterize(decodeURIComponent(svgMatch[1]));
    const arrayBuffer = new ArrayBuffer(png.byteLength);
    new Uint8Array(arrayBuffer).set(png);
    return { blob: new Blob([arrayBuffer], { type: 'image/png' }), mimeType: 'image/png' };
  }

  const match = /^data:(image\/(?:png|jpeg|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) {
    throw new PublishError('The generated image is not a supported PNG, JPEG, or GIF.', false);
  }

  const mimeType = match[1];
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length === 0) throw new PublishError('The generated image is empty.', false);
  return { blob: new Blob([bytes], { type: mimeType }), mimeType };
}

async function uploadImage(
  accessToken: string,
  author: string,
  image: LinkedInPublishImage,
  request: typeof fetch,
  rasterize: (svg: string) => Promise<Uint8Array>,
): Promise<string> {
  const registerRes = await request(ASSETS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: author,
        serviceRelationships: [
          {
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          },
        ],
        supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD'],
      },
    }),
  });

  if (!registerRes.ok) {
    throw classify(registerRes.status, await registerRes.text().catch(() => ''));
  }

  const registered = (await registerRes.json()) as {
    value?: {
      asset?: string;
      uploadMechanism?: {
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'?: { uploadUrl?: string };
      };
    };
  };
  const asset = registered.value?.asset;
  const uploadUrl =
    registered.value?.uploadMechanism?.[
      'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
    ]?.uploadUrl;
  if (!asset || !uploadUrl) {
    throw new PublishError('LinkedIn did not return an image upload destination.', true);
  }

  const { blob, mimeType } = await decodeImage(image.dataUrl, rasterize);
  const uploadRes = await request(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': mimeType,
    },
    body: blob,
  });
  if (!uploadRes.ok) {
    throw classify(uploadRes.status, await uploadRes.text().catch(() => ''));
  }

  return asset;
}

/**
 * Publishes one post to LinkedIn as the authenticated member.
 *
 * `request` is injectable so the flow can be tested without network access.
 */
export async function publishLinkedInPost(
  accessToken: string,
  content: string,
  optionsOrRequest: LinkedInPublishOptions | typeof fetch = {},
): Promise<LinkedInPublishResult> {
  const options: LinkedInPublishOptions =
    typeof optionsOrRequest === 'function' ? { request: optionsOrRequest } : optionsOrRequest;
  const request = options.request ?? fetch;
  const profileRes = await request(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileRes.ok) {
    throw classify(profileRes.status, await profileRes.text().catch(() => ''));
  }

  const profile = (await profileRes.json()) as { sub?: string };
  if (!profile.sub) {
    throw new PublishError('LinkedIn did not return a member id for this token.', false);
  }

  const author = `urn:li:person:${profile.sub}`;
  const asset = options.image
    ? await uploadImage(accessToken, author, options.image, request, options.rasterize ?? rasterizeSvg)
    : null;

  const postRes = await request(UGC_POSTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: asset ? 'IMAGE' : 'NONE',
          ...(asset && options.image
            ? {
                media: [
                  {
                    status: 'READY',
                    description: { text: options.image.altText },
                    media: asset,
                    title: { text: options.image.title },
                  },
                ],
              }
            : {}),
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  });

  if (!postRes.ok) {
    throw classify(postRes.status, await postRes.text().catch(() => ''));
  }

  const body = (await postRes.json().catch(() => ({}))) as { id?: string };
  const platformPostId = body.id || postRes.headers.get('x-restli-id');

  return {
    platformPostId,
    platformPostUrl: platformPostId
      ? `https://www.linkedin.com/feed/update/${platformPostId}`
      : null,
  };
}
