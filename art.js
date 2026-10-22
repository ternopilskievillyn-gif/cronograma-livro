// Figurinhas desenhadas em SVG (estilo colagem / scrapbook)
const star = (n, ro, ri, cx = 50, cy = 50) => {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? ri : ro, a = -Math.PI / 2 + (i * Math.PI) / n;
    pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
  }
  return pts.join(' ');
};

const flower = (cx, cy, r, rot = 0) => {
  let p = '';
  for (let i = 0; i < 5; i++) {
    p += `<ellipse cx="${cx}" cy="${cy - r * .62}" rx="${r * .42}" ry="${r * .62}" transform="rotate(${rot + i * 72} ${cx} ${cy})" fill="#f3cdd3" stroke="#fff" stroke-width="1.4"/>`;
  }
  return p + `<circle cx="${cx}" cy="${cy}" r="${r * .22}" fill="#d98aa0"/><circle cx="${cx}" cy="${cy}" r="${r * .09}" fill="#f6d36b"/>`;
};

export const ART = {
  lamb: `<img src="img/cordeirinho.png" alt="" draggable="false">`,
  photo: `<div class="polaroid"><img src="img/flores.jpg" alt="" draggable="false"></div>`,

  moon: `<svg viewBox="0 0 100 100"><defs><linearGradient id="gm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6efb0"/><stop offset="1" stop-color="#e3d47a"/></linearGradient></defs>
    <path d="M60 5 A46 46 0 1 0 60 95 A50 50 0 0 1 60 5Z" fill="url(#gm)" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M15 40 q5 -4 10 0" stroke="#7a5a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M26 46 q-2 5 1 8 q-4 1 -5 3" stroke="#a37a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M18 66 q5 3 10 0" stroke="#a5503a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <circle cx="16" cy="52" r="5" fill="#f0a28a" opacity=".6"/></svg>`,

  starGold: `<svg viewBox="0 0 100 100"><defs><linearGradient id="gs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7d775"/><stop offset="1" stop-color="#d49a2a"/></linearGradient></defs>
    <polygon points="${star(8, 47, 17)}" fill="url(#gs)" stroke="#fff6dc" stroke-width="2.6" stroke-linejoin="round"/>
    <polygon points="${star(8, 33, 12)}" fill="none" stroke="#fff3c4" stroke-width="1.3" stroke-dasharray="2 2.4" opacity=".9"/></svg>`,

  starBlue: `<svg viewBox="0 0 100 100"><defs><linearGradient id="gb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bcd5ee"/><stop offset="1" stop-color="#86aad2"/></linearGradient></defs>
    <polygon points="${star(4, 49, 9)}" fill="url(#gb)" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>
    <polygon points="${star(4, 36, 6)}" fill="none" stroke="#f2d789" stroke-width="1.4"/></svg>`,

  heart: `<svg viewBox="0 0 100 100"><path d="M50 90 C8 60 6 26 30 18 C42 14 50 24 50 31 C50 24 58 14 70 18 C94 26 92 60 50 90Z" fill="#e8798f" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
    <path d="M26 30 q4 -6 11 -4" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></svg>`,

  crown: `<svg viewBox="0 0 100 80"><defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8dc7e"/><stop offset="1" stop-color="#d09a28"/></linearGradient></defs>
    <path d="M8 66 L14 24 L34 44 L50 12 L66 44 L86 24 L92 66 Z" fill="url(#gc)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
    <rect x="8" y="62" width="84" height="10" rx="3" fill="#e4b23e" stroke="#fff" stroke-width="2.4"/>
    <circle cx="14" cy="22" r="5" fill="#e8798f" stroke="#fff" stroke-width="1.6"/><circle cx="50" cy="10" r="5.5" fill="#86aad2" stroke="#fff" stroke-width="1.6"/><circle cx="86" cy="22" r="5" fill="#e8798f" stroke="#fff" stroke-width="1.6"/>
    <circle cx="50" cy="52" r="4" fill="#e8798f"/><circle cx="30" cy="56" r="3" fill="#fff6dc"/><circle cx="70" cy="56" r="3" fill="#fff6dc"/></svg>`,

  fairy: `<svg viewBox="0 0 100 130"><ellipse cx="30" cy="48" rx="24" ry="12" transform="rotate(-35 30 48)" fill="#f6d98c" stroke="#fff" stroke-width="2.2" opacity=".92"/>
    <ellipse cx="68" cy="46" rx="26" ry="13" transform="rotate(32 68 46)" fill="#f8e3a6" stroke="#fff" stroke-width="2.2" opacity=".92"/>
    <path d="M40 62 Q50 55 60 62 L70 110 Q50 120 30 110Z" fill="#4c5190" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M44 66 q6 6 12 0" stroke="#9aa0e0" stroke-width="1.6" fill="none"/>
    <circle cx="50" cy="50" r="10" fill="#f2cfae" stroke="#fff" stroke-width="2"/>
    <path d="M40 48 Q42 36 52 38 Q60 38 60 48 Q56 42 50 43 Q44 43 40 48Z" fill="#5a3a22"/><circle cx="52" cy="35" r="5" fill="#5a3a22"/>
    <path d="M46 114 L44 126 M56 114 L58 126" stroke="#f2cfae" stroke-width="3" stroke-linecap="round"/>
    <path d="M62 66 L82 40" stroke="#c9a24a" stroke-width="2" stroke-linecap="round"/><polygon points="${star(5, 8, 3.4, 83, 36)}" fill="#f7d775" stroke="#fff" stroke-width="1.2"/></svg>`,

  orchid: `<svg viewBox="0 0 100 130"><path d="M48 128 C48 92 58 62 72 28" stroke="#5f7d4a" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M48 124 C22 118 10 100 8 84 C30 90 44 104 48 124Z" fill="#6f9055" stroke="#fff" stroke-width="2"/>
    <path d="M50 118 C76 112 92 98 96 82 C72 86 54 98 50 118Z" fill="#7da062" stroke="#fff" stroke-width="2"/>
    ${flower(70, 24, 18, 10)}${flower(58, 56, 17, 40)}${flower(46, 86, 15, 70)}</svg>`,

  // Jesus abraçando as meninas (ilustração simples, estilo recorte)
  hug: `<svg viewBox="0 0 300 340"><defs>
      <radialGradient id="hl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c9" stop-opacity=".95"/><stop offset=".6" stop-color="#f7dc87" stop-opacity=".45"/><stop offset="1" stop-color="#f7dc87" stop-opacity="0"/></radialGradient>
      <linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#eadfc8"/></linearGradient></defs>
    <circle cx="150" cy="100" r="125" fill="url(#hl)"/>
    <g stroke="#fff" stroke-width="5" stroke-linejoin="round" paint-order="stroke">
      <!-- manto e túnica -->
      <path d="M104 150 Q150 128 196 150 L236 336 L64 336 Z" fill="url(#rb)"/>
      <path d="M104 150 L132 336 M196 150 L168 336" stroke="#d9cdb2" stroke-width="2" fill="none"/>
      <path d="M110 152 Q150 190 196 150 L204 176 Q150 214 104 176Z" fill="#7b9ccb"/>
      <!-- cabelo, rosto, barba -->
      <path d="M116 96 Q112 50 150 48 Q188 50 184 96 L190 150 Q150 140 110 150Z" fill="#6a4426"/>
      <ellipse cx="150" cy="98" rx="29" ry="34" fill="#e2b58c"/>
      <path d="M121 104 Q124 142 150 148 Q176 142 179 104 Q170 128 150 128 Q130 128 121 104Z" fill="#6a4426"/>
      <path d="M121 84 Q132 66 150 68 Q168 66 179 84 Q166 74 150 76 Q134 74 121 84Z" fill="#6a4426"/>
    </g>
    <path d="M136 92 q5 4 10 0 M154 92 q5 4 10 0" stroke="#4a2e1a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M140 116 q10 8 20 0" stroke="#a5503a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <circle cx="131" cy="108" r="5" fill="#e98e86" opacity=".55"/><circle cx="169" cy="108" r="5" fill="#e98e86" opacity=".55"/>

    <g stroke="#fff" stroke-width="4" stroke-linejoin="round" paint-order="stroke">
      <!-- menina esquerda -->
      <path d="M64 252 L116 252 L128 336 L50 336Z" fill="#eba6bb"/>
      <path d="M62 214 Q58 186 88 186 Q118 186 114 214 L118 246 L58 246Z" fill="#2b1b14"/>
      <circle cx="88" cy="214" r="22" fill="#c48a5e"/>
      <path d="M66 205 Q88 188 110 205 Q100 196 88 196 Q76 196 66 205Z" fill="#2b1b14"/>
      <!-- menina direita -->
      <path d="M184 252 L236 252 L250 336 L172 336Z" fill="#b9a5de"/>
      <path d="M186 214 Q182 186 212 186 Q242 186 238 214 L244 246 L180 246Z" fill="#8c5a2a"/>
      <circle cx="212" cy="214" r="22" fill="#f1c8a2"/>
      <path d="M190 205 Q212 188 234 205 Q224 196 212 196 Q200 196 190 205Z" fill="#8c5a2a"/>
      <!-- menina do meio -->
      <path d="M128 290 L172 290 L180 340 L120 340Z" fill="#a0d4ba"/>
      <circle cx="150" cy="268" r="22" fill="#8a5a3b"/>
      <circle cx="134" cy="256" r="9" fill="#1f130e"/><circle cx="150" cy="251" r="10" fill="#1f130e"/><circle cx="166" cy="256" r="9" fill="#1f130e"/>
      <!-- braços de Jesus abraçando -->
      <path d="M108 160 Q58 170 66 226" stroke="url(#rb)" stroke-width="30" fill="none" stroke-linecap="round"/>
      <path d="M192 160 Q242 170 234 226" stroke="url(#rb)" stroke-width="30" fill="none" stroke-linecap="round"/>
    </g>
    <circle cx="68" cy="232" r="11" fill="#e2b58c" stroke="#fff" stroke-width="3"/><circle cx="232" cy="232" r="11" fill="#e2b58c" stroke="#fff" stroke-width="3"/>
    <g fill="#f6d36b" stroke="#fff" stroke-width="2">
      <path d="M72 194 l4 -12 l6 7 l6 -9 l6 9 l6 -7 l4 12z"/><path d="M196 194 l4 -12 l6 7 l6 -9 l6 9 l6 -7 l4 12z"/><path d="M136 242 l4 -11 l5 6 l5 -8 l5 8 l5 -6 l4 11z"/></g>
    <g fill="#fff" opacity=".9"><circle cx="86" cy="214" r="2" fill="#2b1b14"/><circle cx="98" cy="214" r="2" fill="#2b1b14"/><circle cx="206" cy="214" r="2" fill="#2b1b14"/><circle cx="218" cy="214" r="2" fill="#2b1b14"/><circle cx="144" cy="268" r="2" fill="#1f130e"/><circle cx="156" cy="268" r="2" fill="#1f130e"/></g>
  </svg>`
};

// moldura ondulada da capa
export function coverFrame() {
  const wave = n => 'M0 0 ' + 'q1.5 -2.3 3 0 q1.5 2.3 3 0 '.repeat(n);
  return `<svg viewBox="0 0 100 138" preserveAspectRatio="none" aria-hidden="true">
    <g fill="none" stroke="#c9d49a" stroke-opacity=".55" stroke-width=".7" stroke-linecap="round">
      <rect x="4" y="4" width="92" height="130" rx="1.5"/><rect x="6" y="6" width="88" height="126" rx="1"/>
      <rect x="17" y="17" width="66" height="104" rx="1" stroke-opacity=".35"/>
      <path d="${wave(14)}" transform="translate(8 11)"/><path d="${wave(14)}" transform="translate(8 127)"/>
      <path d="${wave(20)}" transform="translate(11 8) rotate(90)"/><path d="${wave(20)}" transform="translate(89 8) rotate(90)"/>
    </g>
    <g fill="#c9d49a" fill-opacity=".5"><circle cx="12" cy="12" r="1.6"/><circle cx="88" cy="12" r="1.6"/><circle cx="12" cy="126" r="1.6"/><circle cx="88" cy="126" r="1.6"/></g></svg>`;
}
