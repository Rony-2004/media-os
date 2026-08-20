import { z } from 'zod';

export const polishSuggestionRequestSchema = z.object({
  action: z.literal('polish'),
  suggestion: z.object({
    trend: z.string().trim().min(1).max(300),
    content: z.string().trim().min(1).max(25000),
  }),
  prompt: z.string().trim().min(1).max(1000),
});

export type PolishSuggestionRequest = z.infer<typeof polishSuggestionRequestSchema>;

export function buildNewPostPolishRequest(content: string): PolishSuggestionRequest {
  const normalizedContent = content.trim();
  if (!normalizedContent) throw new Error('Write some post content before polishing it.');

  return {
    action: 'polish',
    suggestion: {
      trend: 'User-written LinkedIn post',
      content: normalizedContent,
    },
    prompt:
      'Improve clarity, structure, flow, and the opening hook. Keep the original meaning and professional voice. Do not invent facts or personal experiences.',
  };
}

export function buildSuggestionPolishPrompt(request: PolishSuggestionRequest): string {
  return `Polish this LinkedIn post about "${request.suggestion.trend}".

User's polishing instructions:
${request.prompt}

Original post:
${request.suggestion.content}

Preserve accurate technical meaning. Do not invent claims, statistics, or personal experiences. Return only the revised post text with no preamble, surrounding quotes, or markdown fence.`;
}
