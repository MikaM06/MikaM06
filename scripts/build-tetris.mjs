// Transforme la grille de contributions GitHub en partie de Tetris animée.
// Usage : node scripts/build-tetris.mjs <pseudo> <dossier de sortie> [page.html]
// Sans page.html, la page publique des contributions est téléchargée.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [user = 'MikaM06', outDir = 'dist', localFile] = process.argv.slice(2);

const THEMES = {
    dark: {
        card: '#1A0E10',
        line: '#F5E6E8',
        text: '#F5E6E8',
        muted: '#A88A8F',
        accent: '#E5484D',
        levels: ['#2A1A1D', '#6E1519', '#A8242A', '#E5484D', '#FF8A5B'],
    },
    light: {
        card: '#FFF6F5',
        line: '#2A1215',
        text: '#2A1215',
        muted: '#7A5A5E',
        accent: '#D4262E',
        levels: ['#F3DEDC', '#F4B4B0', '#E36B6E', '#D4262E', '#8C1A20'],
    },
};

const SANS = "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace";

// ─────────────────────────────────────────────────────────────── données

const html = localFile
    ? readFileSync(localFile, 'utf8')
    : await (await fetch(`https://github.com/users/${user}/contributions`)).text();

const grid = [];
let cols = 0;
for (const m of html.matchAll(/id="contribution-day-component-(\d+)-(\d+)"[^>]*data-level="(\d)"/g)) {
    const [r, c, level] = [Number(m[1]), Number(m[2]), Number(m[3])];
    grid[r] ??= [];
    grid[r][c] = level;
    cols = Math.max(cols, c + 1);
}
const ROWS = 7;
if (grid.length !== ROWS) {
    throw new Error(`grille de contributions introuvable pour ${user}`);
}
const total = (html.replace(/\s+/g, ' ').match(/([\d,]+) contributions? in the last year/) ?? [, '0'])[1];
const activeWeeks = Array.from({ length: cols }, (_, c) => grid.some((row) => (row[c] ?? 0) > 0)).filter(Boolean).length;

// ─────────────────────────────────────────────────────────────── pavage en pièces

const BASE = [
    [[0, 0], [0, 1], [0, 2], [0, 3]],
    [[0, 0], [0, 1], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [0, 2], [1, 1]],
    [[0, 1], [0, 2], [1, 0], [1, 1]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
    [[0, 2], [1, 0], [1, 1], [1, 2]],
];
const SMALL = [
    [[0, 0], [0, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1]],
    [[0, 0], [0, 1]],
    [[0, 0], [1, 0]],
    [[0, 0]],
];

const rotate = (cells) => cells.map(([r, c]) => [c, -r]);
const key = (cells) => cells.map(([r, c]) => `${r},${c}`).sort().join(' ');

// Toutes les orientations, exprimées depuis la case que le balayage atteint en premier
// (la plus basse, puis la plus à gauche).
const orientations = (shapes) => {
    const seen = new Set();
    const out = [];
    for (const shape of shapes) {
        let cells = shape;
        for (let i = 0; i < 4; i++) {
            const anchor = [...cells].sort((a, b) => b[0] - a[0] || a[1] - b[1])[0];
            const rel = cells.map(([r, c]) => [r - anchor[0], c - anchor[1]]);
            if (!seen.has(key(rel))) {
                seen.add(key(rel));
                out.push(rel);
            }
            cells = rotate(cells);
        }
    }
    return out;
};

const TETROMINOES = orientations(BASE);
const FALLBACK = orientations(SMALL).sort((a, b) => b.length - a.length);

let seed = 42;
const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
};
const shuffle = (list) => list
    .map((v) => [random(), v])
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);

const taken = Array.from({ length: ROWS }, () => []);
const free = (r, c) => r >= 0 && r < ROWS && grid[r][c] !== undefined && !taken[r][c];

const pieces = [];
for (let r = ROWS - 1; r >= 0; r--) {
    for (let c = 0; c < cols; c++) {
        if (!free(r, c)) {
            continue;
        }
        const shape = [...shuffle(TETROMINOES), ...FALLBACK]
            .find((s) => s.every(([dr, dc]) => free(r + dr, c + dc)));
        const cells = shape.map(([dr, dc]) => [r + dr, c + dc]);
        cells.forEach(([pr, pc]) => {
            taken[pr][pc] = true;
        });
        pieces.push(cells);
    }
}

// ─────────────────────────────────────────────────────────────── rendu

const PITCH = 17;
const CELL = 14;
const GX = 36;
const GY = 34;
const W = 1200;
const H = GY * 2 + ROWS * PITCH + 12;
const CYCLE = 24;
const DROP_END = 16;
const FALL = 0.7;

const pct = (s) => ((s / CYCLE) * 100).toFixed(2);

const render = (t) => {
    let styles = '';
    let body = '';
    pieces.forEach((cells, i) => {
        const start = (i / pieces.length) * DROP_END;
        const top = Math.min(...cells.map(([r]) => r));
        const lift = (top + 3) * PITCH;
        styles += `@keyframes p${i}{0%,${pct(start)}%{transform:translateY(-${lift}px);opacity:0}`
            + `${pct(start + 0.01)}%{opacity:1}${pct(start + FALL)}%,88%{transform:translateY(0);opacity:1}`
            + `96%,100%{transform:translateY(0);opacity:0}}.p${i}{animation:p${i} ${CYCLE}s linear infinite}\n`;
        const inPiece = (r, c) => cells.some(([pr, pc]) => pr === r && pc === c);
        let fills = '';
        let edges = '';
        for (const [r, c] of cells) {
            const x = GX + c * PITCH;
            const y = GY + r * PITCH;
            fills += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="${t.levels[grid[r][c]]}"/>`;
            fills += `<rect x="${x}" y="${y}" width="${CELL}" height="3" fill="#FFFFFF" opacity="0.18"/>`;
            // Contour de la pièce : seulement les bords qui ne touchent pas une autre case de la même pièce.
            const [x0, y0, x1, y1] = [x - 1.5, y - 1.5, x + CELL + 1.5, y + CELL + 1.5];
            if (!inPiece(r - 1, c)) edges += `M${x0} ${y0}H${x1}`;
            if (!inPiece(r + 1, c)) edges += `M${x0} ${y1}H${x1}`;
            if (!inPiece(r, c - 1)) edges += `M${x0} ${y0}V${y1}`;
            if (!inPiece(r, c + 1)) edges += `M${x1} ${y0}V${y1}`;
        }
        body += `<g class="p${i}">${fills}<path d="${edges}" fill="none" stroke="${t.line}" stroke-width="1" opacity="0.35"/></g>`;
    });

    const px = GX + cols * PITCH + 34;
    const panel = (label, value, y) => `
<text x="${px}" y="${y}" class="mono" font-size="12" font-weight="700" letter-spacing="2" fill="${t.accent}">${label}</text>
<text x="${px}" y="${y + 30}" class="sans" font-size="26" font-weight="800" fill="${t.text}">${value}</text>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H + 10}" viewBox="0 0 ${W} ${H + 10}">
<style>
  .sans { font-family: ${SANS}; }
  .mono { font-family: ${MONO}; }
${styles}
  @media (prefers-reduced-motion: reduce) { g[class^="p"] { animation: none !important; } }
</style>
<rect x="10" y="10" width="${W - 12}" height="${H - 2}" fill="${t.accent}"/>
<rect x="1.5" y="1.5" width="${W - 15}" height="${H - 5}" fill="${t.card}" stroke="${t.line}" stroke-width="3"/>
<rect x="${GX - 8}" y="${GY - 8}" width="${cols * PITCH + 13}" height="${ROWS * PITCH + 13}" fill="none" stroke="${t.muted}" stroke-width="1" opacity="0.4"/>
<clipPath id="well"><rect x="${GX - 8}" y="${GY - 8}" width="${cols * PITCH + 13}" height="${ROWS * PITCH + 13}"/></clipPath>
<g clip-path="url(#well)">${body}</g>
${panel('SCORE', total, GY + 6)}
${panel('SEMAINES ACTIVES', `${activeWeeks}/${cols}`, GY + 76)}
</svg>
`;
};

mkdirSync(outDir, { recursive: true });
for (const [mode, t] of Object.entries(THEMES)) {
    writeFileSync(join(outDir, `tetris-${mode}.svg`), render(t));
}
console.log(`${pieces.length} pièces, ${total} contributions, ${activeWeeks}/${cols} semaines actives`);
