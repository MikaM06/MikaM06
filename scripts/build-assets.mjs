// Génère tous les SVG du profil (versions sombre et claire) dans assets/.
// Usage : node scripts/build-assets.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const THEMES = {
    dark: {
        card: '#161B22',
        border: '#30363D',
        text: '#E6EDF3',
        muted: '#8B949E',
        accent: '#3E9CDE',
        onAccent: '#0D1117',
    },
    light: {
        card: '#F6F8FA',
        border: '#D0D7DE',
        text: '#1F2328',
        muted: '#59636E',
        accent: '#1C7ED6',
        onAccent: '#FFFFFF',
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

// Petite grille de voxels, rappel de Minecraft. Les cases s'allument tour à tour.
const voxels = (t, x0, y0, cols, rows, size, gap, seed) => {
    let out = '';
    let n = seed;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            n = (n * 9301 + 49297) % 233280;
            const rnd = n / 233280;
            if (rnd < 0.28) {
                continue;
            }
            const opacity = (0.12 + rnd * 0.55).toFixed(2);
            const delay = ((r + c) * 0.18).toFixed(2);
            out += `<rect class="vx" x="${x0 + c * (size + gap)}" y="${y0 + r * (size + gap)}" width="${size}" height="${size}" rx="3" fill="${t.accent}" opacity="${opacity}" style="animation-delay:${delay}s"/>`;
        }
    }
    return out;
};

const VOXEL_STYLE = `
  .vx { animation: pulse 4.8s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { fill-opacity: 1; } 50% { fill-opacity: 0.35; } }`;

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

// ─────────────────────────────────────────────────────────────── bandeau

const hero = (t) => svg(1200, 340, `
<rect x="1" y="1" width="1198" height="338" rx="18" fill="${t.card}" stroke="${t.border}"/>
${voxels(t, 800, 58, 9, 7, 26, 8, 7)}
<text x="64" y="92" class="mono" font-size="15" letter-spacing="3" fill="${t.accent}">LOUHAN · NANTES, FRANCE</text>
<text x="60" y="186" class="sans" font-size="92" font-weight="800" fill="${t.text}" letter-spacing="-2">MikaM06<tspan fill="${t.accent}">.</tspan></text>
<text x="64" y="236" class="sans" font-size="24" font-weight="600" fill="${t.text}">Fondateur d'EarthQuest · CEO de VoxelMind</text>
<text x="64" y="272" class="sans" font-size="18" fill="${t.muted}">Développeur Minecraft, Rust et web · Étudiant à Epitech Nantes</text>
`, VOXEL_STYLE);

// ─────────────────────────────────────────────────────────────── boutons

const button = (t, label, primary, width = 230) => svg(width, 46, `
<rect x="1" y="1" width="${width - 2}" height="44" rx="22" fill="${primary ? t.accent : t.card}" stroke="${primary ? t.accent : t.border}"/>
<text x="${width / 2}" y="29" text-anchor="middle" class="sans" font-size="16" font-weight="600" fill="${primary ? t.onAccent : t.text}">${esc(label)}</text>
`);

// ─────────────────────────────────────────────────────────────── séparateur

const divider = (t) => svg(1200, 40, `
<line x1="0" y1="20" x2="560" y2="20" stroke="${t.border}"/>
<rect x="570" y="14" width="12" height="12" rx="2" fill="${t.accent}" opacity="0.4"/>
<rect x="594" y="14" width="12" height="12" rx="2" fill="${t.accent}"/>
<rect x="618" y="14" width="12" height="12" rx="2" fill="${t.accent}" opacity="0.4"/>
<line x1="640" y1="20" x2="1200" y2="20" stroke="${t.border}"/>
`);

// ─────────────────────────────────────────────────────────────── titres

const section = (t, num, label, title) => svg(1200, 110, `
<text x="600" y="38" text-anchor="middle" class="mono" font-size="14" letter-spacing="3" fill="${t.accent}">${num} / ${esc(label)}</text>
<text x="600" y="84" text-anchor="middle" class="sans" font-size="34" font-weight="700" fill="${t.text}">${esc(title)}</text>
`);

const SECTIONS = [
    ['about', '01', 'À PROPOS', 'Développeur Minecraft, Rust et web'],
    ['earthquest', '02', 'EARTHQUEST', 'Un serveur, tout un écosystème'],
    ['projects', '03', 'PROJETS', 'Ce que je construis à côté'],
    ['stack', '04', 'STACK', 'Ce avec quoi je travaille'],
    ['activity', '05', 'ACTIVITÉ', 'Mon année en code'],
    ['contact', '06', 'CONTACT', 'Un projet en tête ? Parlons-en.'],
];

// ─────────────────────────────────────────────────────────────── cartes projet

const card = (t, p) => {
    const lines = wrap(p.desc, 58).slice(0, 2);
    const chipW = p.status.length * 8.4 + 26;
    return svg(590, 220, `
<rect x="1" y="1" width="588" height="218" rx="14" fill="${t.card}" stroke="${t.border}"/>
<rect x="28" y="28" width="44" height="44" rx="10" fill="${t.accent}"/>
<text x="50" y="58" text-anchor="middle" class="mono" font-size="20" font-weight="700" fill="${t.onAccent}">${esc(p.name[0])}</text>
<text x="88" y="50" class="sans" font-size="24" font-weight="700" fill="${t.text}">${esc(p.name)}</text>
<text x="88" y="72" class="mono" font-size="12" letter-spacing="1.5" fill="${t.muted}">${esc(p.stack)}</text>
<rect x="${562 - chipW}" y="30" width="${chipW}" height="24" rx="12" fill="none" stroke="${t.accent}"/>
<text x="${562 - chipW / 2}" y="46" text-anchor="middle" class="mono" font-size="11" letter-spacing="1" fill="${t.accent}">${esc(p.status)}</text>
${lines.map((l, i) => `<text x="28" y="${122 + i * 26}" class="sans" font-size="17" fill="${t.text}">${esc(l)}</text>`).join('\n')}
<text x="28" y="194" class="mono" font-size="12" letter-spacing="1.5" fill="${t.accent}">${esc(p.footer)}</text>
`);
};

const PROJECTS = {
    launcher: {
        name: 'Launcher',
        stack: 'RUST · TAURI 2 · SVELTE 5',
        status: 'EN PRODUCTION',
        desc: 'Le launcher officiel : installe, met à jour et lance le jeu en un clic, réécrit de zéro en Rust.',
        footer: 'EARTHQUEST → earthquest.fr',
    },
    questui: {
        name: 'QuestUI',
        stack: 'JAVA · FORGE 1.7.10',
        status: 'EN PRODUCTION',
        desc: 'Le mod client d\'EarthQuest : toutes les interfaces du serveur, repensées de zéro.',
        footer: 'EARTHQUEST → earthquest.fr',
    },
    queststaff: {
        name: 'QuestStaff',
        stack: 'JAVA · BUKKIT',
        status: 'EN PRODUCTION',
        desc: 'Les outils de l\'équipe de modération : reports, surveillance et sanctions.',
        footer: 'EARTHQUEST → earthquest.fr',
    },
    eqsite: {
        name: 'EQSite',
        stack: 'TYPESCRIPT · DOCKER',
        status: 'EN LIGNE',
        desc: 'Le site officiel d\'EarthQuest : présentation, actualités et espace joueur.',
        footer: 'EARTHQUEST → earthquest.fr',
    },
    voxora: {
        name: 'Voxora',
        stack: 'RUST',
        status: 'OPEN SOURCE',
        desc: 'Un launcher Minecraft qui réunit Modrinth et CurseForge au même endroit.',
        footer: 'GITHUB → MikaM06/Voxora',
    },
    soundboard: {
        name: 'TS6 SoundBoard',
        stack: 'PLUGIN TEAMSPEAK 6',
        status: 'OPEN SOURCE',
        desc: 'Une soundboard intégrée directement dans TeamSpeak 6.',
        footer: 'GITHUB → MikaM06/TeamSpeak6SoundBoard',
    },
    hubplugin: {
        name: 'HubPlugin',
        stack: 'JAVA · SPIGOT 1.8',
        status: 'OPEN SOURCE',
        desc: 'Un plugin de lobby complet pour serveurs Minecraft 1.8.',
        footer: 'GITHUB → MikaM06/HubPlugin',
    },
    nophantom: {
        name: 'NoPhantom',
        stack: 'JAVA · SPIGOT 1.13+',
        status: 'OPEN SOURCE',
        desc: 'Un plugin léger qui supprime les phantoms du jeu.',
        footer: 'GITHUB → MikaM06/NoPhantom',
    },
};

// ─────────────────────────────────────────────────────────────── stack

const STACK = [
    ['LANGAGES', ['Java', 'Rust', 'TypeScript', 'JavaScript', 'C']],
    ['MINECRAFT', ['Forge 1.7.10', 'Bukkit / Spigot', 'Crucible']],
    ['WEB & APPS', ['Tauri 2', 'Svelte 5', 'React', 'Node.js', 'Express', 'Vite']],
    ['OUTILS', ['Git', 'Docker', 'Linux', 'Maven', 'Gradle']],
];

const stack = (t) => {
    const rowH = 62;
    let body = `<rect x="1" y="1" width="1198" height="${STACK.length * rowH + 38}" rx="14" fill="${t.card}" stroke="${t.border}"/>`;
    STACK.forEach(([label, items], r) => {
        const y = 28 + r * rowH;
        body += `<text x="36" y="${y + 24}" class="mono" font-size="13" letter-spacing="2" fill="${t.accent}">${esc(label)}</text>`;
        let x = 230;
        for (const item of items) {
            const w = item.length * 9 + 32;
            body += `<rect x="${x}" y="${y}" width="${w}" height="36" rx="8" fill="none" stroke="${t.border}"/>`;
            body += `<text x="${x + w / 2}" y="${y + 24}" text-anchor="middle" class="sans" font-size="16" fill="${t.text}">${esc(item)}</text>`;
            x += w + 12;
        }
    });
    return svg(1200, STACK.length * rowH + 40, body);
};

// ─────────────────────────────────────────────────────────────── pied de page

const footer = (t) => svg(1200, 150, `
${voxels(t, 520, 20, 6, 2, 16, 6, 3)}
<text x="600" y="100" text-anchor="middle" class="sans" font-size="30" font-weight="800" fill="${t.text}">MikaM06<tspan fill="${t.accent}">.</tspan></text>
<text x="600" y="130" text-anchor="middle" class="mono" font-size="13" letter-spacing="2" fill="${t.muted}">EARTHQUEST × VOXELMIND · NANTES</text>
`, VOXEL_STYLE);

// ─────────────────────────────────────────────────────────────── génération

for (const [mode, t] of Object.entries(THEMES)) {
    write(`hero-${mode}.svg`, hero(t));
    write(`btn-projects-${mode}.svg`, button(t, 'Voir mes projets', true));
    write(`btn-contact-${mode}.svg`, button(t, 'Me contacter', false));
    write(`btn-website-${mode}.svg`, button(t, 'earthquest.fr', true));
    write(`btn-github-${mode}.svg`, button(t, 'GitHub · MikaM06', false));
    write(`divider-${mode}.svg`, divider(t));
    for (const [id, num, label, title] of SECTIONS) {
        write(`section-${id}-${mode}.svg`, section(t, num, label, title));
    }
    for (const [id, p] of Object.entries(PROJECTS)) {
        write(`projects/${id}-${mode}.svg`, card(t, p));
    }
    write(`stack-${mode}.svg`, stack(t));
    write(`footer-${mode}.svg`, footer(t));
}

console.log(`SVG générés dans ${OUT}`);
