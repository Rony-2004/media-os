import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';
import { callAI, getModel } from '@/lib/ai';
import { z } from 'zod';

const generateSchema = z.object({
  topic: z.string().min(1),
  platform: z.string().default('linkedin'),
  tone: z.string().default('Professional'),
  format: z.string().default('Auto'),
  length: z.string().default('Medium'),
  includeHashtags: z.boolean().default(true),
});

const lengthGuide: Record<string, string> = {
  Short:  'under 300 characters',
  Medium: '300 to 800 characters',
  Long:   '800 to 1500 characters',
};

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const body = await req.json();
  const parsed = generateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } },
      { status: 400 }
    );
  }

  const { topic, platform, tone, format, length, includeHashtags } = parsed.data;

  const systemPrompt = `You are a Principal Software Engineer & Systems Architect writing deep, technical, highly educational LinkedIn content.
Focus on low-level mechanics, computer science principles, database internals, security/cryptography, and real architectural trade-offs.
NEVER use corporate marketing buzzwords like "game-changer", "paradigm shift", "synergy", or surface-level summaries.
Write from a hands-on engineer's perspective.`;

  const userPrompt = `Write 3 different LinkedIn post variants about this topic: "${topic}"

Requirements for ALL variants:
- Tone: ${tone}
- Format: ${format === 'Auto' ? 'choose the most engaging format (story, list, opinion, how-to, or question)' : format}
- Length: ${lengthGuide[length] || '300-800 characters'}
- ${includeHashtags ? 'Include 3-4 relevant hashtags at the end' : 'No hashtags'}
- First line must be a strong hook (question, bold statement, surprising fact, or story opener)
- Short paragraphs with line breaks for readability
- End with a question or clear call to action

Format your response EXACTLY like this:
---VARIANT 1---
[post content here]
SCORE: [1-10 engagement estimate]

---VARIANT 2---
[post content here]
SCORE: [1-10 engagement estimate]

---VARIANT 3---
[post content here]
SCORE: [1-10 engagement estimate]`;

  try {
    const raw = await callAI({
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      maxTokens: 1500,
    });

    // Parse variants
    const variantBlocks = raw.split(/---VARIANT \d+---/).filter((v) => v.trim());

    const variants = variantBlocks.map((block, i) => {
      const scoreMatch = block.match(/SCORE:\s*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 7;
      const content = block.replace(/SCORE:\s*\d+/gi, '').trim();
      const hashtags = content.match(/#\w+/g) || [];

      return {
        id: `v${i + 1}`,
        content,
        characterCount: content.length,
        estimatedEngagement: Math.min(10, Math.max(1, score)),
        hashtags,
      };
    });

    return NextResponse.json({
      data: {
        variants: variants.slice(0, 3),
        model: getModel(),
      },
    });
  } catch (error) {
    const msg = (error as Error).message;
    console.error('AI generate error:', msg);

    return NextResponse.json(
      { error: { code: 'AI_ERROR', message: msg } },
      { status: 500 }
    );
  }
}
