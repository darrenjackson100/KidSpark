// Ordered handwriting stroke paths for lowercase letters, used by the
// "Trace the Letter" game for REAL path-based tracing (not pixel coverage).
//
// Coordinates are normalised to a 0..1 box (x → right, y → down) so the tracing
// canvas can scale them to any size. Each letter is an array of *strokes*; each
// stroke is an ordered list of points the child should trace through in order
// (pen lifts happen between strokes). The order encodes the correct formation
// direction, so the start dot / arrow and the checkpoint sequence all follow the
// natural way the letter is written.
//
// Shapes are deliberately simple, rounded, infant-style forms. The letter "a"
// is a single-storey handwritten 'a' (round body + straight leaf on the right),
// matching the rhyme "Around the apple and down the leaf".

export type Pt = { x: number; y: number };
export type Stroke = Pt[];

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function line(a: Pt, b: Pt, n = 14): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n; out.push({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }); }
  return out;
}

// Elliptical arc; angles in radians (y-down: 0 = east, +PI/2 = south).
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 48): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); out.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) }); }
  return out;
}

function quad(p0: Pt, c: Pt, p1: Pt, n = 22): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push({ x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y });
  }
  return out;
}

// Concatenate point lists into one stroke, dropping duplicate joins.
function join(...parts: Pt[][]): Pt[] {
  const out: Pt[] = [];
  for (const part of parts) for (const pt of part) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.x - pt.x) < 1e-6 && Math.abs(last.y - pt.y) < 1e-6) continue;
    out.push(pt);
  }
  return out;
}

// Lowercase metrics.
const ASC = 0.16;   // ascender top
const XT = 0.40;    // x-height top
const BASE = 0.80;  // baseline
const DESC = 0.95;  // descender bottom

const LETTER_STROKES: Record<string, Stroke[]> = {
  // single-storey a: round body (anticlockwise from upper-right) + leaf stem
  a: [
    arc(0.47, 0.60, 0.15, 0.20, -0.15 * Math.PI, -0.15 * Math.PI - TAU),
    line({ x: 0.62, y: 0.45 }, { x: 0.62, y: BASE }),
  ],
  b: [
    line({ x: 0.34, y: ASC }, { x: 0.34, y: BASE }),
    arc(0.50, 0.66, 0.16, 0.14, Math.PI, Math.PI + TAU),
  ],
  c: [arc(0.51, 0.60, 0.17, 0.20, -0.25 * Math.PI, -0.25 * Math.PI - 1.5 * Math.PI)],
  d: [
    arc(0.46, 0.62, 0.15, 0.18, -0.15 * Math.PI, -0.15 * Math.PI - TAU),
    line({ x: 0.61, y: ASC }, { x: 0.61, y: BASE }),
  ],
  e: [
    join(
      line({ x: 0.35, y: 0.60 }, { x: 0.66, y: 0.60 }),
      arc(0.50, 0.60, 0.16, 0.20, 0, -1.45 * Math.PI),
    ),
  ],
  f: [
    join(quad({ x: 0.62, y: 0.24 }, { x: 0.40, y: 0.18 }, { x: 0.40, y: 0.34 }), line({ x: 0.40, y: 0.34 }, { x: 0.40, y: BASE })),
    line({ x: 0.30, y: 0.46 }, { x: 0.58, y: 0.46 }),
  ],
  g: [
    arc(0.47, 0.55, 0.15, 0.15, -0.15 * Math.PI, -0.15 * Math.PI - TAU),
    join(line({ x: 0.62, y: 0.42 }, { x: 0.62, y: 0.84 }), quad({ x: 0.62, y: 0.84 }, { x: 0.54, y: DESC }, { x: 0.38, y: 0.90 })),
  ],
  h: [
    line({ x: 0.34, y: ASC }, { x: 0.34, y: BASE }),
    join(quad({ x: 0.34, y: 0.52 }, { x: 0.50, y: 0.42 }, { x: 0.66, y: 0.52 }), line({ x: 0.66, y: 0.52 }, { x: 0.66, y: BASE })),
  ],
  i: [
    line({ x: 0.50, y: XT }, { x: 0.50, y: BASE }),
    arc(0.50, 0.24, 0.02, 0.02, 0, TAU, 10),
  ],
  j: [
    join(line({ x: 0.54, y: XT }, { x: 0.54, y: 0.84 }), quad({ x: 0.54, y: 0.84 }, { x: 0.48, y: DESC }, { x: 0.34, y: 0.90 })),
    arc(0.54, 0.24, 0.02, 0.02, 0, TAU, 10),
  ],
  k: [
    line({ x: 0.36, y: ASC }, { x: 0.36, y: BASE }),
    line({ x: 0.62, y: 0.44 }, { x: 0.36, y: 0.62 }),
    line({ x: 0.45, y: 0.56 }, { x: 0.64, y: BASE }),
  ],
  l: [line({ x: 0.50, y: ASC }, { x: 0.50, y: BASE })],
  m: [
    line({ x: 0.30, y: 0.42 }, { x: 0.30, y: BASE }),
    join(quad({ x: 0.30, y: 0.50 }, { x: 0.40, y: 0.40 }, { x: 0.50, y: 0.50 }), line({ x: 0.50, y: 0.50 }, { x: 0.50, y: BASE })),
    join(quad({ x: 0.50, y: 0.50 }, { x: 0.60, y: 0.40 }, { x: 0.70, y: 0.50 }), line({ x: 0.70, y: 0.50 }, { x: 0.70, y: BASE })),
  ],
  n: [
    line({ x: 0.34, y: 0.42 }, { x: 0.34, y: BASE }),
    join(quad({ x: 0.34, y: 0.50 }, { x: 0.50, y: 0.40 }, { x: 0.66, y: 0.50 }), line({ x: 0.66, y: 0.50 }, { x: 0.66, y: BASE })),
  ],
  o: [arc(0.50, 0.60, 0.17, 0.20, -0.5 * Math.PI, -0.5 * Math.PI - TAU)],
  p: [
    line({ x: 0.34, y: XT }, { x: 0.34, y: DESC }),
    arc(0.50, 0.55, 0.16, 0.13, Math.PI, Math.PI + TAU),
  ],
  q: [
    arc(0.46, 0.55, 0.15, 0.15, -0.15 * Math.PI, -0.15 * Math.PI - TAU),
    join(line({ x: 0.61, y: 0.42 }, { x: 0.61, y: 0.90 }), quad({ x: 0.61, y: 0.90 }, { x: 0.66, y: DESC }, { x: 0.72, y: 0.92 })),
  ],
  r: [
    line({ x: 0.38, y: XT }, { x: 0.38, y: BASE }),
    quad({ x: 0.38, y: 0.50 }, { x: 0.50, y: 0.40 }, { x: 0.62, y: 0.46 }),
  ],
  s: [
    join(
      quad({ x: 0.62, y: 0.46 }, { x: 0.40, y: 0.40 }, { x: 0.40, y: 0.52 }),
      quad({ x: 0.40, y: 0.52 }, { x: 0.62, y: 0.60 }, { x: 0.58, y: 0.70 }),
      quad({ x: 0.58, y: 0.70 }, { x: 0.40, y: 0.80 }, { x: 0.34, y: 0.72 }),
    ),
  ],
  t: [
    line({ x: 0.50, y: 0.24 }, { x: 0.50, y: BASE }),
    line({ x: 0.36, y: 0.42 }, { x: 0.64, y: 0.42 }),
  ],
  u: [
    join(line({ x: 0.34, y: XT }, { x: 0.34, y: 0.68 }), quad({ x: 0.34, y: 0.68 }, { x: 0.50, y: 0.84 }, { x: 0.66, y: 0.68 }), line({ x: 0.66, y: 0.68 }, { x: 0.66, y: XT })),
    line({ x: 0.66, y: XT }, { x: 0.66, y: BASE }),
  ],
  v: [join(line({ x: 0.34, y: XT }, { x: 0.50, y: BASE }), line({ x: 0.50, y: BASE }, { x: 0.66, y: XT }))],
  w: [
    join(
      line({ x: 0.28, y: XT }, { x: 0.40, y: BASE }),
      line({ x: 0.40, y: BASE }, { x: 0.50, y: 0.50 }),
      line({ x: 0.50, y: 0.50 }, { x: 0.60, y: BASE }),
      line({ x: 0.60, y: BASE }, { x: 0.72, y: XT }),
    ),
  ],
  x: [
    line({ x: 0.36, y: XT }, { x: 0.64, y: BASE }),
    line({ x: 0.64, y: XT }, { x: 0.36, y: BASE }),
  ],
  y: [
    line({ x: 0.34, y: XT }, { x: 0.50, y: 0.64 }),
    line({ x: 0.66, y: XT }, { x: 0.40, y: DESC }),
  ],
  z: [
    join(
      line({ x: 0.34, y: 0.42 }, { x: 0.64, y: 0.42 }),
      line({ x: 0.64, y: 0.42 }, { x: 0.34, y: 0.78 }),
      line({ x: 0.34, y: 0.78 }, { x: 0.66, y: 0.78 }),
    ),
  ],
};

// Squeeze a letter's strokes into one half of the box (for digraphs).
function transform(strokes: Stroke[], scaleX: number, centerX: number): Stroke[] {
  return strokes.map(s => s.map(p => ({ x: (p.x - 0.5) * scaleX + centerX, y: p.y })));
}

function fallbackStrokes(ch: string): Stroke[] {
  return LETTER_STROKES[ch] ?? [line({ x: 0.5, y: XT }, { x: 0.5, y: BASE })];
}

function composeDigraph(left: string, right: string): Stroke[] {
  return [
    ...transform(fallbackStrokes(left), 0.5, 0.28),
    ...transform(fallbackStrokes(right), 0.5, 0.72),
  ];
}

const DIGRAPHS: Record<string, [string, string]> = {
  sh: ["s", "h"], ch: ["c", "h"], th: ["t", "h"],
  ng: ["n", "g"], nk: ["n", "k"], qu: ["q", "u"],
};

// Ordered strokes for a display letter ("a", "sh", ...). Digraphs are composed
// from their two single letters placed side by side.
export function getLetterPath(letter: string): Stroke[] {
  const key = letter.toLowerCase();
  if (LETTER_STROKES[key]) return LETTER_STROKES[key];
  const combo = DIGRAPHS[key];
  if (combo) return composeDigraph(combo[0], combo[1]);
  if (key.length === 2) return composeDigraph(key[0], key[1]);
  return [line({ x: 0.5, y: XT }, { x: 0.5, y: BASE })];
}
