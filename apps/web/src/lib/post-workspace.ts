import { z } from 'zod';

const postUpdateSchema = z
  .object({
    content: z.string().trim().min(1).max(25000).optional(),
    status: z.enum(['draft', 'scheduled', 'cancelled']).optional(),
    scheduledAt: z.string().datetime().nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one post field is required.');

export function parsePostUpdate(input: unknown) {
  return postUpdateSchema.parse(input);
}

export function buildScheduledPostPayload(
  content: string,
  platform: string,
  scheduledAt: string,
) {
  const normalizedContent = content.trim();
  if (!normalizedContent) throw new Error('Post content is required.');

  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) throw new Error('Choose a valid schedule date.');

  return {
    content: normalizedContent,
    platform,
    status: 'scheduled' as const,
    scheduledAt: date.toISOString(),
  };
}

export function toDateTimeLocalValue(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function defaultScheduleValue(now = new Date()): string {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return toDateTimeLocalValue(tomorrow);
}

export function splitScheduleDateTime(value: string): { date: string; time: string } {
  const [date = '', time = ''] = value.split('T');
  return { date, time: time.slice(0, 5) };
}

export function combineScheduleDateTime(date: string, time: string): string {
  if (!date || !time) return '';
  return `${date}T${time.slice(0, 5)}`;
}
