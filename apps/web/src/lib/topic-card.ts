import { matchTopicImage } from '@/lib/topic-image';
import { callClaude, type AICallOptions } from '@/lib/ai';
import { ImageResponse } from 'next/og';
import { createElement, type CSSProperties, type ReactElement } from 'react';
import { z } from 'zod';

/**
 * Generates the visual that accompanies a draft.
 *
 * Stock photography was the previous approach and it failed on its own terms:
 * a small library means the same circuit board lands on unrelated posts. A
 * generated card is instead always about *this* topic, never repeats, cannot
 * 404, needs no API key, and matches the product's monochrome + red language.
 *
 * Returned as an SVG data URI so it renders anywhere an <img> does.
 */

const WIDTH = 1200;
const HEIGHT = 630;
const INK = '#0B0A0A';
const PAPER = '#F5F3EF';
const SIGNAL = '#ED2C35';

function limitedText(maxLength: number) {
  return z
    .string()
    .trim()
    .min(1)
    .transform((value) =>
      value.length <= maxLength
        ? value
        : `${value.slice(0, maxLength - 1).trimEnd()}…`,
    );
}

export const topicCardDesignSchema = z.object({
  eyebrow: limitedText(28),
  headline: limitedText(64),
  diagram: z.enum(['flow', 'layers', 'network', 'cycle']),
  nodes: z.array(limitedText(18)).min(3).transform((nodes) => nodes.slice(0, 5)),
  caption: limitedText(56),
});

export type TopicCardDesign = z.infer<typeof topicCardDesignSchema>;

interface ClaudePostImageInput {
  trend: string;
  category: string;
  content: string;
}

interface ImageGenerationDependencies {
  generate?: (options: AICallOptions) => Promise<string>;
  rasterize?: (svg: string) => Promise<Uint8Array>;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Stable hash so a given topic always produces the same card. */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

/** Greedy word wrap; long words are left intact rather than broken mid-word. */
export function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }

  if (lines.length < maxLines && current) lines.push(current);

  if (lines.length === maxLines) {
    const consumed = lines.join(' ').split(/\s+/).length;
    if (consumed < words.length) {
      lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:]$/, '')}…`;
    }
  }

  return lines;
}

/** A distinct motif per subject area, drawn rather than photographed. */
function motif(key: string | null, seed: number): string {
  const x = 830;
  const y = 250;

  switch (key) {
    case 'security':
      return `
        <rect x="${x}" y="${y}" width="180" height="140" rx="10" fill="none" stroke="${PAPER}" stroke-width="6" opacity="0.85"/>
        <path d="M${x + 40} ${y} v-42 a50 50 0 0 1 100 0 v42" fill="none" stroke="${SIGNAL}" stroke-width="6"/>
        <circle cx="${x + 90}" cy="${y + 66}" r="16" fill="${SIGNAL}"/>`;
    case 'database':
      return [0, 1, 2]
        .map(
          (i) => `
        <ellipse cx="${x + 90}" cy="${y + 20 + i * 52}" rx="92" ry="26" fill="none" stroke="${
          i === 1 ? SIGNAL : PAPER
        }" stroke-width="6" opacity="${i === 1 ? 1 : 0.8}"/>`,
        )
        .join('');
    case 'ai': {
      const nodes = [
        [x, y + 10],
        [x, y + 100],
        [x + 90, y + 55],
        [x + 180, y + 10],
        [x + 180, y + 100],
      ];
      const edges = nodes
        .slice(0, 2)
        .flatMap((from) =>
          nodes.slice(3).map(
            () =>
              `<line x1="${from[0]}" y1="${from[1]}" x2="${nodes[2][0]}" y2="${nodes[2][1]}" stroke="${PAPER}" stroke-width="4" opacity="0.6"/>`,
          ),
        )
        .join('');
      const links = nodes
        .slice(3)
        .map(
          (to) =>
            `<line x1="${nodes[2][0]}" y1="${nodes[2][1]}" x2="${to[0]}" y2="${to[1]}" stroke="${PAPER}" stroke-width="4" opacity="0.6"/>`,
        )
        .join('');
      const dots = nodes
        .map(
          (n, i) =>
            `<circle cx="${n[0]}" cy="${n[1]}" r="${i === 2 ? 22 : 15}" fill="${i === 2 ? SIGNAL : PAPER}"/>`,
        )
        .join('');
      return edges + links + dots;
    }
    default: {
      // Systems / fallback: a routed-trace motif, varied by the topic hash.
      const rows = [0, 1, 2, 3];
      return rows
        .map((i) => {
          const yy = y - 10 + i * 44;
          const len = 80 + ((seed >> (i * 3)) % 5) * 26;
          const accent = i === seed % 4;
          return `
        <line x1="${x}" y1="${yy}" x2="${x + len}" y2="${yy}" stroke="${accent ? SIGNAL : PAPER}" stroke-width="6" opacity="${accent ? 1 : 0.75}"/>
        <circle cx="${x + len + 16}" cy="${yy}" r="9" fill="${accent ? SIGNAL : PAPER}" opacity="${accent ? 1 : 0.75}"/>`;
        })
        .join('');
    }
  }
}

function diagram(plan: TopicCardDesign): string {
  const nodes = plan.nodes.slice(0, 5);
  const box = (label: string, x: number, y: number, accent = false) => `
    <rect x="${x}" y="${y}" width="190" height="54" rx="8" fill="${accent ? SIGNAL : INK}" stroke="${accent ? SIGNAL : PAPER}" stroke-width="3"/>
    <text x="${x + 95}" y="${y + 34}" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="16" font-weight="700" fill="${PAPER}">${escapeXml(label.toUpperCase())}</text>`;

  if (plan.diagram === 'layers') {
    return nodes
      .map((label, index) => box(label, 840 - index * 10, 150 + index * 70, index === nodes.length - 1))
      .join('');
  }

  if (plan.diagram === 'network') {
    const positions = [
      [790, 145],
      [980, 145],
      [885, 250],
      [790, 355],
      [980, 355],
    ];
    const centerX = 980;
    const centerY = 277;
    const links = positions
      .slice(0, nodes.length)
      .map(([x, y]) => `<line x1="${x + 95}" y1="${y + 27}" x2="${centerX}" y2="${centerY}" stroke="${PAPER}" stroke-width="3" opacity="0.32"/>`)
      .join('');
    return links + nodes.map((label, index) => box(label, positions[index][0], positions[index][1], index === 2)).join('');
  }

  if (plan.diagram === 'cycle') {
    const positions = [
      [790, 155],
      [990, 155],
      [990, 330],
      [790, 330],
      [890, 245],
    ];
    const arrows = `<path d="M980 182 h20 M1085 209 v110 M990 357 h-10 M885 330 V219" fill="none" stroke="${SIGNAL}" stroke-width="4" stroke-linecap="round"/>`;
    return arrows + nodes.map((label, index) => box(label, positions[index][0], positions[index][1], index === nodes.length - 1)).join('');
  }

  return nodes
    .map((label, index) => {
      const y = 145 + index * 72;
      const connector =
        index < nodes.length - 1
          ? `<line x1="935" y1="${y + 54}" x2="935" y2="${y + 72}" stroke="${SIGNAL}" stroke-width="4"/>`
          : '';
      return box(label, 840, y, index === nodes.length - 1) + connector;
    })
    .join('');
}

export function buildTopicCardSvg(
  trend: string,
  category: string,
  plan?: TopicCardDesign,
): string {
  const seed = hashString(`${trend}|${category}`);
  const key = matchTopicImage(trend, category)?.key ?? null;
  const headline = plan?.headline ?? trend;
  const lines = wrapText(headline, 22, 4);
  const lineHeight = 74;
  const startY = 300 - ((lines.length - 1) * lineHeight) / 2;

  const title = lines
    .map(
      (line, i) =>
        `<text x="90" y="${startY + i * lineHeight}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="60" font-weight="700" letter-spacing="-2" fill="${PAPER}">${escapeXml(
          line,
        )}</text>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img">
  <defs>
    <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="1.6" cy="1.6" r="1.6" fill="${PAPER}" opacity="0.13"/>
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${INK}"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#dots)"/>
  <rect x="0" y="0" width="10" height="${HEIGHT}" fill="${SIGNAL}"/>
  <text x="90" y="96" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="22" letter-spacing="5" fill="${SIGNAL}">${escapeXml(
    (plan?.eyebrow ?? category).toUpperCase(),
  )}</text>
  ${title}
  <line x1="90" y1="474" x2="${WIDTH - 90}" y2="474" stroke="${PAPER}" stroke-width="2" opacity="0.18"/>
  <text x="90" y="524" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="20" letter-spacing="2" fill="${PAPER}" opacity="0.55">${escapeXml(plan?.caption ?? 'SOCIALFLOW')}</text>
  ${plan ? diagram(plan) : motif(key, seed)}
</svg>`;
}

/** SVG data URI, safe to drop straight into an img src. */
export function buildTopicCard(trend: string, category: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(buildTopicCardSvg(trend, category))}`;
}

function element(
  type: string,
  style: CSSProperties,
  children: ReactElement | ReactElement[] | string | number,
  key?: string,
): ReactElement {
  return createElement(type, { style, key }, children);
}

type CardTheme = {
  background: string;
  panel: string;
  node: string;
  text: string;
  muted: string;
  line: string;
  accent: string;
  dark: boolean;
};

function cardTheme(plan: TopicCardDesign): CardTheme {
  const seed = hashString(`${plan.headline}|${plan.caption}`);
  const dark = seed % 2 === 1;
  const accents = dark
    ? ['#E31B72', '#7C5CFC', '#00B8A9', '#FF8A3D']
    : ['#357A68', '#557A3E', '#B86A38', '#4169A1'];

  return dark
    ? {
        background: '#151515',
        panel: '#1D1D1D',
        node: '#242424',
        text: '#F7F5F1',
        muted: '#B9B6B0',
        line: '#F7F5F1',
        accent: accents[seed % accents.length],
        dark,
      }
    : {
        background: '#FAFAF7',
        panel: '#EAF2DF',
        node: '#E2F3EE',
        text: '#183129',
        muted: '#65726B',
        line: '#708276',
        accent: accents[seed % accents.length],
        dark,
      };
}

function architectureNode(
  label: string,
  theme: CardTheme,
  style: CSSProperties,
  key: string,
): ReactElement {
  return element(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 62,
      padding: '10px 18px',
      border: `2px solid ${theme.accent}`,
      borderRadius: 14,
      backgroundColor: theme.node,
      color: theme.text,
      fontSize: 19,
      fontWeight: 700,
      textAlign: 'center',
      ...style,
    },
    label,
    key,
  );
}

function flowDiagram(nodes: string[], theme: CardTheme): ReactElement {
  const children = nodes.flatMap((label, index) => {
    const node = architectureNode(label, theme, { width: 175 }, `flow-node-${index}`);
    if (index === nodes.length - 1) return [node];
    return [
      node,
      element(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 38,
          color: theme.accent,
          fontSize: 28,
          fontWeight: 700,
        },
        '→',
        `flow-arrow-${index}`,
      ),
    ];
  });

  return element(
    'div',
    {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      padding: '38px 30px',
    },
    children,
    'flow-diagram',
  );
}

function layersDiagram(nodes: string[], theme: CardTheme): ReactElement {
  return element(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      padding: '22px 130px',
    },
    nodes.map((label, index) =>
      architectureNode(
        label,
        theme,
        {
          width: `${72 + index * 5}%`,
          minHeight: 48,
          marginTop: index === 0 ? 0 : 8,
          backgroundColor: index === nodes.length - 1 ? theme.accent : theme.node,
          color: index === nodes.length - 1 ? '#FFFFFF' : theme.text,
        },
        `layer-${index}`,
      ),
    ),
    'layers-diagram',
  );
}

function connectedDiagram(
  nodes: string[],
  theme: CardTheme,
  cycle: boolean,
): ReactElement {
  const networkPositions = [
    [35, 35],
    [35, 205],
    [440, 120],
    [845, 35],
    [845, 205],
  ];
  const cyclePositions = [
    [80, 115],
    [305, 30],
    [715, 30],
    [895, 180],
    [505, 220],
  ];
  const positions = cycle ? cyclePositions : networkPositions;
  const centers = positions.slice(0, nodes.length).map(([x, y]) => [x + 95, y + 31]);
  const lines = cycle
    ? centers.map((from, index) => {
        const to = centers[(index + 1) % centers.length];
        return createElement('line', {
          key: `cycle-line-${index}`,
          x1: from[0],
          y1: from[1],
          x2: to[0],
          y2: to[1],
          stroke: theme.accent,
          strokeWidth: 3,
        });
      })
    : centers.slice(1).map((to, index) =>
        createElement('line', {
          key: `network-line-${index}`,
          x1: centers[0][0],
          y1: centers[0][1],
          x2: to[0],
          y2: to[1],
          stroke: theme.line,
          strokeWidth: 3,
          opacity: 0.72,
        }),
      );

  const connector = createElement(
    'svg',
    {
      key: 'connectors',
      width: '100%',
      height: '100%',
      viewBox: '0 0 1080 310',
      style: { position: 'absolute', inset: 0 },
    },
    lines,
  );

  return element(
    'div',
    {
      display: 'flex',
      position: 'relative',
      width: '100%',
      height: '100%',
    },
    [
      connector,
      ...nodes.map((label, index) =>
        architectureNode(
          label,
          theme,
          {
            position: 'absolute',
            left: positions[index][0],
            top: positions[index][1],
            width: 190,
          },
          `connected-node-${index}`,
        ),
      ),
    ],
    cycle ? 'cycle-diagram' : 'network-diagram',
  );
}

function renderArchitecture(plan: TopicCardDesign, theme: CardTheme): ReactElement {
  const nodes = plan.nodes.slice(0, 5);
  switch (plan.diagram) {
    case 'layers':
      return layersDiagram(nodes, theme);
    case 'network':
      return connectedDiagram(nodes, theme, false);
    case 'cycle':
      return connectedDiagram(nodes, theme, true);
    case 'flow':
      return flowDiagram(nodes, theme);
  }
}

/**
 * Renders varied architecture visuals with Next's embedded Noto font, so the
 * result stays readable without fonts installed in the Vercel runtime.
 */
export async function renderLinkedInCardPng(plan: TopicCardDesign): Promise<Uint8Array> {
  const theme = cardTheme(plan);
  const card = element(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      padding: '34px 48px 30px',
      backgroundColor: theme.background,
      color: theme.text,
      fontFamily: 'sans-serif',
    },
    [
      element(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        [
          element(
            'div',
            {
              display: 'flex',
              color: theme.accent,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 3,
            },
            plan.eyebrow.toUpperCase(),
            'eyebrow',
          ),
          element(
            'div',
            {
              display: 'flex',
              padding: '7px 12px',
              border: `1px solid ${theme.line}`,
              borderRadius: 20,
              color: theme.muted,
              fontSize: 13,
              letterSpacing: 2,
            },
            plan.diagram.toUpperCase(),
            'diagram-label',
          ),
        ],
        'topline',
      ),
      element(
        'div',
        {
          display: 'flex',
          marginTop: 10,
          fontSize: 39,
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: -1.2,
        },
        plan.headline,
        'headline',
      ),
      element(
        'div',
        {
          display: 'flex',
          position: 'relative',
          width: '100%',
          height: 320,
          marginTop: 18,
          overflow: 'hidden',
          border: `2px solid ${theme.dark ? '#44413E' : '#9EB48E'}`,
          borderRadius: 24,
          backgroundColor: theme.panel,
        },
        renderArchitecture(plan, theme),
        'diagram',
      ),
      element(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          marginTop: 16,
          fontSize: 18,
          fontWeight: 600,
        },
        [
          element(
            'div',
            { display: 'flex', color: theme.accent, marginRight: 12, fontWeight: 700 },
            'WHY IT MATTERS',
            'takeaway',
          ),
          element('div', { display: 'flex', color: theme.muted }, plan.caption, 'caption'),
        ],
        'footer',
      ),
    ],
  );

  const response = new ImageResponse(card, { width: WIDTH, height: HEIGHT });
  return new Uint8Array(await response.arrayBuffer());
}

/**
 * Claude designs the visual; the local renderer only turns that constrained
 * design into a LinkedIn-compatible PNG. No other AI provider is consulted.
 */
export async function generateClaudePostImage(
  input: ClaudePostImageInput,
  dependencies: ImageGenerationDependencies = {},
): Promise<string> {
  const generate = dependencies.generate ?? callClaude;
  const raw = await generate({
    system:
      'You are a senior LinkedIn information designer. Design a real architecture visual, not a generic numbered list. Return only valid JSON. Never return markdown or SVG.',
    messages: [
      {
        role: 'user',
        content: `Design one visual for this professional post.

Topic: ${input.trend}
Category: ${input.category}
Post:
${input.content}

Return exactly one JSON object:
{
  "eyebrow": "2-4 word technical label, max 28 characters",
  "headline": "the post's central technical insight, max 64 characters",
  "diagram": "flow for pipelines | layers for stacks | network for communicating services | cycle for feedback loops",
  "nodes": ["3 to 5 concrete components from this post, each max 18 characters"],
  "caption": "concise takeaway, max 56 characters"
}

Choose the diagram that best explains the specific mechanics. Use component names, services, stores, decisions, or stages—not vague concepts.`,
      },
    ],
    maxTokens: 350,
    temperature: 0.2,
  });

  const cleaned = raw.replace(/```(?:json)?|```/gi, '').trim();
  const plan = topicCardDesignSchema.parse(JSON.parse(cleaned));
  const png = dependencies.rasterize
    ? await dependencies.rasterize(buildTopicCardSvg(input.trend, input.category, plan))
    : await renderLinkedInCardPng(plan);
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
}
