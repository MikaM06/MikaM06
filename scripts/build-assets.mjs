// Génère tous les SVG du profil (versions sombre et claire) dans assets/.
// Usage : node scripts/build-assets.mjs

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets');
// Le logo est intégré en base64 : GitHub ne charge pas les images externes dans un SVG.
const LOGO = readFileSync(join(ROOT, 'media', 'earthquest-logo.png')).toString('base64');

const THEMES = {
    dark: {
        card: '#1A0E10',
        line: '#F5E6E8',
        text: '#F5E6E8',
        muted: '#A88A8F',
        accent: '#E5484D',
        accent2: '#FF8A5B',
        deep: '#6E1519',
        onAccent: '#1A0E10',
    },
    light: {
        card: '#FFF6F5',
        line: '#2A1215',
        text: '#2A1215',
        muted: '#7A5A5E',
        accent: '#D4262E',
        accent2: '#F2663B',
        deep: '#8C1A20',
        onAccent: '#FFF6F5',
    },
};

const SANS = "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace";

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const svg = (w, h, body, style = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<style>
  .sans { font-family: ${SANS}; }
  .mono { font-family: ${MONO}; }
  ${style}
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
${body}
</svg>
`;

const write = (name, content) => {
    const path = join(OUT, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
};

// Bloc « néo-brutaliste » : ombre pleine décalée, bordure épaisse, coins droits.
const block = (t, x, y, w, h, shadow = 8) => `
<rect x="${x + shadow}" y="${y + shadow}" width="${w}" height="${h}" fill="${t.accent}"/>
<rect x="${x + 1.5}" y="${y + 1.5}" width="${w - 3}" height="${h - 3}" fill="${t.card}" stroke="${t.line}" stroke-width="3"/>`;

// ─────────────────────────────────────────────────────────────── police pixel

const GLYPHS = {
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
    F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
};

// Chaque pixel est un petit voxel : une face en dégradé et une ombre en dessous.
const pixelText = (t, text, x0, y0, size) => {
    let shadows = '';
    let faces = '';
    [...text].forEach((ch, i) => {
        GLYPHS[ch].forEach((row, r) => {
            [...row].forEach((bit, c) => {
                if (bit !== '1') {
                    return;
                }
                const x = x0 + (i * 6 + c) * size;
                const y = y0 + r * size;
                const delay = ((i * 6 + c) * 0.06).toFixed(2);
                shadows += `<rect x="${x + 5}" y="${y + 5}" width="${size}" height="${size}" fill="${t.deep}"/>`;
                faces += `<rect class="px" x="${x}" y="${y}" width="${size - 1}" height="${size - 1}" fill="url(#grad)" style="animation-delay:${delay}s"/>`;
            });
        });
    });
    return shadows + faces;
};

// ─────────────────────────────────────────────────────────────── cubes

const cube = (t, cx, cy, s, cls = '') => {
    const w = s * 0.866;
    const h = s / 2;
    return `<g class="${cls}">
<polygon points="${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}" fill="${t.accent2}"/>
<polygon points="${cx - w},${cy} ${cx},${cy + h} ${cx},${cy + h + s} ${cx - w},${cy + s}" fill="${t.accent}"/>
<polygon points="${cx + w},${cy} ${cx},${cy + h} ${cx},${cy + h + s} ${cx + w},${cy + s}" fill="${t.deep}"/>
</g>`;
};

// ─────────────────────────────────────────────────────────────── bandeau

const hero = (t) => svg(1200, 360, `
<defs>
  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${t.accent}"/>
    <stop offset="1" stop-color="${t.accent2}"/>
  </linearGradient>
</defs>
${block(t, 0, 0, 1188, 348, 10)}
<text x="56" y="62" class="mono" font-size="16" fill="${t.muted}">~/louhan <tspan fill="${t.accent}">$</tspan> whoami</text>
${pixelText(t, 'MIKAM06', 56, 88, 15)}
<text x="56" y="252" class="sans" font-size="24" font-weight="700" fill="${t.text}">Fondateur d'EarthQuest · CEO de VoxelMind · Étudiant Epitech</text>
<text x="56" y="298" class="mono" font-size="17" fill="${t.muted}"><tspan fill="${t.accent}">&gt;</tspan> minecraft · rust · web — nantes<tspan class="cursor" fill="${t.accent}"> ▋</tspan></text>
${cube(t, 1000, 126, 60)}
${cube(t, 948, 216, 60)}
${cube(t, 1052, 216, 60)}
${cube(t, 1000, 58, 36, 'float')}
`, `
  .px { animation: glow 3.2s ease-in-out infinite; }
  @keyframes glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
  .cursor { animation: blink 1.1s steps(1) infinite; }
  @keyframes blink { 50% { fill-opacity: 0; } }
  .float { animation: float 3s ease-in-out infinite; }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }`);

// ─────────────────────────────────────────────────────────────── titres

const section = (t, title) => {
    const tail = Array.from({ length: 16 }, (_, i) =>
        `<rect x="${360 + i * 22}" y="36" width="12" height="12" fill="${t.accent}" opacity="${(1 - i / 16).toFixed(2)}"/>`).join('');
    return svg(1200, 76, `
<text x="0" y="50" class="mono" font-size="20" fill="${t.accent}">//</text>
<text x="36" y="51" class="sans" font-size="30" font-weight="800" fill="${t.text}">${esc(title)}</text>
${tail}
`);
};

const SECTIONS = [
    ['about', 'À propos'],
    ['earthquest', 'EarthQuest'],
    ['before', 'Avant EarthQuest'],
    ['projects', 'Projets perso'],
    ['stack', 'Stack'],
    ['activity', 'Contributions'],
];

// ─────────────────────────────────────────────────────────────── cartes projet

// Découpe un texte en lignes d'au plus `max` caractères.
const wrap = (text, max) => {
    const lines = [];
    let line = '';
    for (const word of text.split(' ')) {
        if ((line + ' ' + word).trim().length > max) {
            lines.push(line);
            line = word;
        } else {
            line = (line + ' ' + word).trim();
        }
    }
    if (line) {
        lines.push(line);
    }
    return lines;
};

const card = (t, p, index) => {
    const lines = wrap(p.desc, 56).slice(0, 2);
    const tagW = p.status.length * 8.4 + 24;
    return svg(590, 224, `
${block(t, 0, 0, 580, 214, 8)}
<text x="28" y="54" class="sans" font-size="26" font-weight="800" fill="${t.text}">${esc(p.name)}</text>
<text x="552" y="52" text-anchor="end" class="mono" font-size="18" font-weight="700" fill="${t.accent}">${String(index).padStart(2, '0')}</text>
<text x="28" y="80" class="mono" font-size="12" letter-spacing="1.5" fill="${t.muted}">${esc(p.stack)}</text>
${lines.map((l, i) => `<text x="28" y="${122 + i * 26}" class="sans" font-size="17" fill="${t.text}">${esc(l)}</text>`).join('\n')}
<rect x="28" y="168" width="${tagW}" height="24" fill="${t.accent}"/>
<text x="${28 + tagW / 2}" y="184" text-anchor="middle" class="mono" font-size="11" font-weight="700" letter-spacing="1" fill="${t.onAccent}">${esc(p.status)}</text>
<text x="552" y="185" text-anchor="end" class="mono" font-size="12" fill="${t.muted}">${esc(p.link)} ↗</text>
`);
};

const PROJECTS = [
    ['voxora', {
        name: 'Voxora',
        stack: 'RUST',
        status: 'OPEN SOURCE',
        desc: 'Un launcher Minecraft qui réunit Modrinth et CurseForge au même endroit.',
        link: 'MikaM06/Voxora',
    }],
    ['soundboard', {
        name: 'TS6 SoundBoard',
        stack: 'PLUGIN TEAMSPEAK 6',
        status: 'OPEN SOURCE',
        desc: 'Une soundboard intégrée directement dans TeamSpeak 6.',
        link: 'MikaM06/TeamSpeak6SoundBoard',
    }],
    ['hubplugin', {
        name: 'HubPlugin',
        stack: 'JAVA · SPIGOT 1.8',
        status: 'OPEN SOURCE',
        desc: 'Un plugin de lobby complet pour serveurs Minecraft 1.8.',
        link: 'MikaM06/HubPlugin',
    }],
    ['nophantom', {
        name: 'NoPhantom',
        stack: 'JAVA · SPIGOT 1.13+',
        status: 'OPEN SOURCE',
        desc: 'Un plugin léger qui supprime les phantoms du jeu.',
        link: 'MikaM06/NoPhantom',
    }],
];

// ─────────────────────────────────────────────────────────────── earthquest

const server = (t, { icon, name, tagline, lines, facts }) => {
    let right = '';
    facts.forEach(([label, value], i) => {
        const y = 150 - facts.length * 26 + i * 52;
        right += `<rect x="780" y="${y}" width="120" height="32" fill="${t.accent}"/>`;
        right += `<text x="840" y="${y + 21}" text-anchor="middle" class="mono" font-size="12" font-weight="700" letter-spacing="1" fill="${t.onAccent}">${esc(label)}</text>`;
        right += `<text x="918" y="${y + 22}" class="sans" font-size="18" font-weight="600" fill="${t.text}">${esc(value)}</text>`;
    });
    return svg(1200, 300, `
${block(t, 0, 0, 1188, 288, 10)}
${icon}
<text x="232" y="112" class="sans" font-size="46" font-weight="800" fill="${t.text}">${esc(name)}</text>
<text x="232" y="152" class="sans" font-size="21" font-style="italic" fill="${t.accent}">${esc(tagline)}</text>
${lines.map((l, i) => `<text x="232" y="${198 + i * 26}" class="sans" font-size="17" fill="${t.muted}">${esc(l)}</text>`).join('\n')}
<line x1="744" y1="48" x2="744" y2="240" stroke="${t.line}" stroke-width="2" opacity="0.25"/>
${right}
`);
};

const earthquest = (t) => server(t, {
    icon: `<image href="data:image/png;base64,${LOGO}" x="48" y="64" width="150" height="150"/>`,
    name: 'EarthQuest',
    tagline: 'Écris l\'histoire du monde.',
    lines: ['Un serveur Minecraft moddé, avec son launcher,', 'ses mods et ses outils faits maison.'],
    facts: [['RÔLE', 'Fondateur'], ['STRUCTURE', 'VoxelMind'], ['JEU', 'Minecraft 1.7.10 moddé'], ['SITE', 'earthquest.fr']],
});

const undercraft = (t) => server(t, {
    icon: `<g opacity="0.6">${cube(t, 123, 92, 44)}${cube(t, 85, 158, 44)}${cube(t, 161, 158, 44)}</g>`,
    name: 'Undercraft',
    tagline: 'Là où tout a commencé.',
    lines: ['Mon serveur avant EarthQuest, où j\'ai écrit', 'mes premiers plugins et outils de modération.'],
    facts: [['RÔLE', 'Fondateur'], ['STRUCTURE', 'Marque déposée'], ['STATUT', 'Fermé en 2024'], ['SUITE', 'EarthQuest']],
});

// ─────────────────────────────────────────────────────────────── huracraft (rétro)

// Texte pixel à plat, rempli avec `fill` (couleur ou url(#...)).
const pixelFlat = (text, x0, y0, size, fill) => {
    let out = '';
    [...text].forEach((ch, i) => {
        GLYPHS[ch].forEach((row, r) => {
            [...row].forEach((bit, c) => {
                if (bit === '1') {
                    out += `<rect x="${x0 + (i * 6 + c) * size}" y="${y0 + r * size}" width="${size}" height="${size}"/>`;
                }
            });
        });
    });
    return `<g fill="${fill}">${out}</g>`;
};

// Ambiance synthwave : ciel violet, soleil rayé, grille néon qui défile.
const huracraft = () => {
    const w = 1200;
    const h = 280;
    const horizon = 196;
    const vx = 930;
    const pink = '#FF3CAC';
    const violet = '#8B5CF6';
    const cyan = '#22D3EE';

    let verticals = '';
    for (let i = -14; i <= 14; i++) {
        verticals += `<line x1="${vx + i * 18}" y1="${horizon}" x2="${vx + i * 150}" y2="${h}"/>`;
    }
    let horizontals = '';
    for (let i = 0; i < 9; i++) {
        const y = horizon + Math.pow(i / 8, 1.8) * (h - horizon + 20);
        horizontals += `<line x1="0" y1="${y.toFixed(1)}" x2="${w}" y2="${y.toFixed(1)}"/>`;
    }
    let stripes = '';
    for (let i = 0; i < 6; i++) {
        stripes += `<rect x="${vx - 110}" y="${150 + i * 9}" width="220" height="${1.5 + i * 0.9}" fill="#14002E"/>`;
    }

    return svg(w, h, `
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0B0118"/>
    <stop offset="0.7" stop-color="#2A0A4A"/>
    <stop offset="1" stop-color="#14002E"/>
  </linearGradient>
  <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${pink}"/>
    <stop offset="1" stop-color="${violet}"/>
  </linearGradient>
  <linearGradient id="neon" gradientUnits="userSpaceOnUse" x1="56" y1="0" x2="488" y2="0">
    <stop offset="0" stop-color="${pink}"/>
    <stop offset="0.5" stop-color="${violet}"/>
    <stop offset="1" stop-color="${cyan}"/>
  </linearGradient>
  <filter id="glow" x="-20%" y="-50%" width="140%" height="200%">
    <feGaussianBlur stdDeviation="4" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse">
    <rect width="4" height="1" fill="#000000" opacity="0.35"/>
  </pattern>
  <clipPath id="above"><rect width="${w}" height="${horizon}"/></clipPath>
  <clipPath id="below"><rect y="${horizon}" width="${w}" height="${h - horizon}"/></clipPath>
</defs>
<rect width="${w}" height="${h}" fill="url(#sky)"/>
<g clip-path="url(#above)">
  <circle cx="${vx}" cy="${horizon}" r="112" fill="url(#sun)" filter="url(#glow)"/>
  ${stripes}
</g>
<rect y="${horizon}" width="${w}" height="${h - horizon}" fill="#0B0118"/>
<g clip-path="url(#below)" stroke="${cyan}" stroke-width="1.5" opacity="0.8">
  ${verticals}
  <g class="scroll">${horizontals}</g>
</g>
<line x1="0" y1="${horizon}" x2="${w}" y2="${horizon}" stroke="${pink}" stroke-width="2" filter="url(#glow)"/>
<g filter="url(#glow)">${pixelFlat('HURACRAFT', 56, 42, 8, 'url(#neon)')}</g>
<text x="58" y="148" class="mono" font-size="20" font-weight="700" letter-spacing="4" fill="${cyan}">PVP FACTIONS · VANILLA 1.8.9+</text>
<text x="58" y="178" class="mono" font-size="15" letter-spacing="3" fill="${pink}">FONDÉ PAR MIKAM06</text>
<rect x="58" y="216" width="190" height="34" fill="#0B0118" stroke="${pink}" stroke-width="2" filter="url(#glow)"/>
<text x="153" y="238" text-anchor="middle" class="mono blink" font-size="14" font-weight="700" letter-spacing="3" fill="${pink}">FERMÉ EN 2021</text>
<rect width="${w}" height="${h}" fill="url(#scan)"/>
<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" fill="none" stroke="${violet}" stroke-width="3"/>
`, `
  .scroll { animation: scroll 1.6s linear infinite; }
  @keyframes scroll { from { transform: translateY(0); } to { transform: translateY(12px); } }
  .blink { animation: blink 1.4s steps(1) infinite; }
  @keyframes blink { 50% { opacity: 0.35; } }`);
};

// ─────────────────────────────────────────────────────────────── herocrafts (bande dessinée)

const COMIC = "Impact, 'Arial Black', 'Segoe UI', sans-serif";

// Bulle d'explosion : une étoile irrégulière à `n` branches.
const burst = (cx, cy, r1, r2, n) => {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
        const a = (Math.PI * i) / n;
        const r = i % 2 === 0 ? r1 * (1 - (i % 3) * 0.06) : r2;
        pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r * 0.78).toFixed(1)}`);
    }
    return pts.join(' ');
};

const herocrafts = () => {
    const w = 1200;
    const h = 280;
    return svg(w, h, `
<defs>
  <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
    <rect width="14" height="14" fill="#FFD23F"/>
    <circle cx="7" cy="7" r="3" fill="#F2B705"/>
  </pattern>
  <pattern id="dotsRed" width="14" height="14" patternUnits="userSpaceOnUse">
    <rect width="14" height="14" fill="#E5484D"/>
    <circle cx="7" cy="7" r="3" fill="#C9363B"/>
  </pattern>
</defs>
<rect width="${w}" height="${h}" fill="#FFFFFF"/>
<polygon points="8,8 800,8 740,272 8,272" fill="url(#dots)" stroke="#111111" stroke-width="6" stroke-linejoin="round"/>
<polygon points="818,8 1192,8 1192,272 758,272" fill="url(#dotsRed)" stroke="#111111" stroke-width="6" stroke-linejoin="round"/>
<g transform="translate(52 138) skewX(-8)">
  <text x="8" y="8" font-family="${COMIC}" font-size="92" font-weight="900" fill="#111111">HEROCRAFTS</text>
  <text x="0" y="0" font-family="${COMIC}" font-size="92" font-weight="900" fill="#FFFFFF" stroke="#111111" stroke-width="5" paint-order="stroke">HEROCRAFTS</text>
</g>
<rect x="52" y="178" width="470" height="52" fill="#FFFFFF" stroke="#111111" stroke-width="4"/>
<text x="287" y="212" text-anchor="middle" font-family="${COMIC}" font-size="22" font-weight="900" letter-spacing="1" fill="#111111">PVP FACTIONS &amp; MINI-JEUX · 1.12.2</text>
<rect x="858" y="30" width="230" height="44" fill="#FFFFFF" stroke="#111111" stroke-width="4" transform="rotate(-3 973 52)"/>
<text x="973" y="61" text-anchor="middle" font-family="${COMIC}" font-size="22" font-weight="900" letter-spacing="1" fill="#111111" transform="rotate(-3 973 52)">RÔLE : ADMIN</text>
<g class="pop">
  <polygon points="${burst(985, 180, 118, 82, 14)}" fill="#FFD23F" stroke="#111111" stroke-width="5" stroke-linejoin="round"/>
  <g transform="rotate(-6 985 180)" font-family="${COMIC}" font-weight="900" text-anchor="middle" fill="#E5484D" stroke="#111111" stroke-width="3" paint-order="stroke">
    <text x="985" y="174" font-size="38">FERMÉ</text>
    <text x="985" y="214" font-size="34">EN 2022</text>
  </g>
</g>
`, `
  .pop { transform-origin: 985px 180px; animation: pop 2.6s ease-in-out infinite; }
  @keyframes pop { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`);
};

// ─────────────────────────────────────────────────────────────── stack

const STACK = [
    ['LANGAGES', ['Java', 'Rust', 'TypeScript', 'JavaScript', 'C']],
    ['MINECRAFT', ['Forge 1.7.10', 'Bukkit / Spigot', 'Crucible']],
    ['WEB & APPS', ['Tauri 2', 'Svelte 5', 'React', 'Node.js', 'Express', 'Vite']],
    ['OUTILS', ['Git', 'Docker', 'Linux', 'Maven', 'Gradle']],
];

const stack = (t) => {
    const rowH = 64;
    const h = STACK.length * rowH + 44;
    let body = block(t, 0, 0, 1188, h - 12, 10);
    STACK.forEach(([label, items], r) => {
        const y = 32 + r * rowH;
        const labelW = label.length * 9 + 28;
        body += `<rect x="32" y="${y}" width="${labelW}" height="36" fill="${t.accent}"/>`;
        body += `<text x="${32 + labelW / 2}" y="${y + 23}" text-anchor="middle" class="mono" font-size="13" font-weight="700" letter-spacing="1" fill="${t.onAccent}">${esc(label)}</text>`;
        let x = 230;
        for (const item of items) {
            const w = item.length * 9 + 32;
            body += `<rect x="${x + 4}" y="${y + 4}" width="${w}" height="36" fill="${t.deep}"/>`;
            body += `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="34" fill="${t.card}" stroke="${t.line}" stroke-width="2"/>`;
            body += `<text x="${x + w / 2}" y="${y + 23}" text-anchor="middle" class="sans" font-size="16" font-weight="600" fill="${t.text}">${esc(item)}</text>`;
            x += w + 14;
        }
    });
    return svg(1200, h, body);
};

// ─────────────────────────────────────────────────────────────── génération

rmSync(OUT, { recursive: true, force: true });
for (const [mode, t] of Object.entries(THEMES)) {
    write(`hero-${mode}.svg`, hero(t));
    for (const [id, title] of SECTIONS) {
        write(`section-${id}-${mode}.svg`, section(t, title));
    }
    PROJECTS.forEach(([id, p], i) => {
        write(`projects/${id}-${mode}.svg`, card(t, p, i + 1));
    });
    write(`earthquest-${mode}.svg`, earthquest(t));
    write(`undercraft-${mode}.svg`, undercraft(t));
    write(`huracraft-${mode}.svg`, huracraft());
    write(`herocrafts-${mode}.svg`, herocrafts());
    write(`stack-${mode}.svg`, stack(t));
}

console.log(`SVG générés dans ${OUT}`);
