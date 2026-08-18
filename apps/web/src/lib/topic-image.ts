/**
 * Topic → illustrative image.
 *
 * Scored on whole-word matches rather than substrings: the previous
 * `includes('ai')` check fired on "email", "detail", and "available".
 *
 * The library is deliberately small and each entry is a verified URL. When
 * nothing scores, the result is `null` and the post simply carries no image —
 * an unrelated stock photo is worse than none.
 */

export interface TopicImage {
  key: string;
  url: string;
  keywords: string[];
}

export const TOPIC_IMAGES: TopicImage[] = [
  {
    key: 'security',
    url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    keywords: [
      'security', 'secure', 'bcrypt', 'hash', 'hashing', 'auth', 'authentication',
      'authorization', 'oauth', 'jwt', 'encryption', 'encrypted', 'cryptography',
      'tls', 'ssl', 'vulnerability', 'cve', 'password', 'passwords', 'token',
      'tokens', 'breach', 'exploit', 'firewall', 'zero-trust',
    ],
  },
  {
    key: 'ai',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    keywords: [
      'ai', 'llm', 'llms', 'model', 'models', 'inference', 'gpu', 'gpus',
      'embedding', 'embeddings', 'transformer', 'transformers', 'neural',
      'ml', 'machine-learning', 'anthropic', 'claude', 'openai', 'gemini',
      'prompt', 'prompts', 'rag', 'fine-tuning', 'training', 'tokenizer',
      'agent', 'agents', 'inference-latency',
    ],
  },
  {
    key: 'database',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    keywords: [
      'postgres', 'postgresql', 'database', 'databases', 'sql', 'nosql', 'mvcc',
      'index', 'indexes', 'indexing', 'query', 'queries', 'migration',
      'migrations', 'replication', 'sharding', 'redis', 'cache', 'caching',
      'transaction', 'transactions', 'acid', 'mongodb', 'mysql', 'schema',
    ],
  },
  {
    key: 'systems',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    keywords: [
      'kubernetes', 'docker', 'container', 'containers', 'serverless', 'latency',
      'throughput', 'distributed', 'network', 'networking', 'architecture',
      'scaling', 'scalability', 'cpu', 'memory', 'concurrency', 'observability',
      'cloud', 'infrastructure', 'microservices', 'queue', 'streaming', 'kafka',
      'runtime', 'compiler', 'kernel', 'rust', 'systems',
    ],
  },
];

/** Lowercased word tokens, keeping intra-word hyphens. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .map((token) => token.replace(/^-+|-+$/g, ''))
    .filter(Boolean);
}

export interface ImageMatch {
  key: string;
  url: string;
  score: number;
}

/** Returns the best-scoring image, or null when nothing meaningfully matches. */
export function matchTopicImage(trend: string, category: string): ImageMatch | null {
  const tokens = new Set(tokenize(`${trend} ${category}`));

  let best: ImageMatch | null = null;

  for (const image of TOPIC_IMAGES) {
    let score = 0;
    for (const keyword of image.keywords) {
      if (tokens.has(keyword)) score += 1;
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { key: image.key, url: image.url, score };
    }
  }

  return best;
}

/** Convenience wrapper: the URL, or null when no image is relevant. */
export function getTopicImageUrl(trend: string, category: string): string | null {
  return matchTopicImage(trend, category)?.url ?? null;
}
