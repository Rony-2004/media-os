/**
 * Scheduler core — decides what happens to each due post.
 *
 * Deliberately free of Prisma, LinkedIn, and clock access: the caller supplies
 * a repository and a publish function, which keeps the retry policy testable
 * and lets the same logic run from a cron route, a queue worker, or a script.
 */

export class PublishError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = 'PublishError';
    this.retryable = retryable;
  }
}

export interface DuePost {
  id: string;
  content: string;
  retryCount: number;
  accessToken: string | null;
  image?: {
    dataUrl: string;
    altText: string;
    title: string;
  } | null;
}

export interface PublishOutcome {
  platformPostId: string | null;
  platformPostUrl: string | null;
}

export interface ScheduledPostRepository {
  findDuePosts(now?: Date): Promise<DuePost[]>;
  /**
   * Atomically take ownership of a post. Returns false when another run got
   * there first, which is what stops overlapping cron invocations from
   * double-publishing.
   */
  claim(id: string): Promise<boolean>;
  markPublished(id: string, outcome: PublishOutcome): Promise<void>;
  markRetry(id: string, message: string): Promise<void>;
  markFailed(id: string, message: string): Promise<void>;
}

export interface ProcessOptions {
  publish: (post: DuePost) => Promise<PublishOutcome>;
  maxRetries?: number;
  now?: Date;
}

export interface ProcessSummary {
  found: number;
  claimed: number;
  published: number;
  retried: number;
  failed: number;
  skipped: number;
}

export const DEFAULT_MAX_RETRIES = 3;

export async function processDuePosts(
  repository: ScheduledPostRepository,
  options: ProcessOptions,
): Promise<ProcessSummary> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const posts = await repository.findDuePosts(options.now);

  const summary: ProcessSummary = {
    found: posts.length,
    claimed: 0,
    published: 0,
    retried: 0,
    failed: 0,
    skipped: 0,
  };

  // Sequential on purpose: publishing is rate-limited, and ordering makes the
  // run reproducible when something goes wrong.
  for (const post of posts) {
    const claimed = await repository.claim(post.id);
    if (!claimed) {
      summary.skipped += 1;
      continue;
    }
    summary.claimed += 1;

    try {
      const outcome = await options.publish(post);
      await repository.markPublished(post.id, outcome);
      summary.published += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publishing failed';
      // Unknown failures are treated as transient; only an explicit
      // PublishError can declare itself permanent.
      const retryable = error instanceof PublishError ? error.retryable : true;

      if (retryable && post.retryCount < maxRetries) {
        await repository.markRetry(post.id, message);
        summary.retried += 1;
      } else {
        await repository.markFailed(post.id, message);
        summary.failed += 1;
      }
    }
  }

  return summary;
}
