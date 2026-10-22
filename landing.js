import { ART, coverFrame } from './art.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- figurinhas em SVG ----------
$$('[data-art]').forEach(el => { el.innerHTML = ART[el.dataset.art]; });
$('#frame').innerHTML = coverFrame();

// ---------- letras de recorte (estilo colagem) ----------
const TILES = [
  {f:"'Abril Fatface',serif", bg:'#f1e4c3', c:'#6b1d1d'},
  {f:"'Rye',serif", bg:'#1f1a14', c:'#e8c46a'},
  {f:"'UnifrakturCook',serif", bg:'#f6efe0', c:'#2c3a1f', w:700},
  {f:"'Playfair Display',serif", bg:'#7a1f2b', c:'#f5e6c8', w:900},
  {f:"'Limelight',serif", bg:'#d8a85a', c:'#2a1c10'},
  {f:"'Bodoni Moda',serif", bg:'#ffffff', c:'#4a4038', w:700, s:'italic'},
  {f:"'Chonburi',serif", bg:'#5d7a3a', c:'#f3ecd2'},
  {f:"'Cinzel Decorative',serif", bg:'#e7b6c2', c:'#5a3a3a', w:900}
];
let seed = 3;
const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
$$('[data-ransom]').forEach(el => {
  let i = 0, k = Math.floor(rnd() * 8);
  el.innerHTML = el.dataset.ransom.split('|').map(word =>
    `<span class="row">${[...word].map(ch => {
      const t = TILES[(k++ * 3) % TILES.length], tr = (rnd() * 10 - 5).toFixed(1), fs = (15 + rnd() * 4).toFixed(1);
      return `<span class="rl" style="--f-t:${t.f};--bg-t:${t.bg};--c-t:${t.c};--w-t:${t.w || 400};--s-t:${t.s || 'normal'};--tr:${tr}deg;--fs:${fs};--d:${(.15 + i++ * .07).toFixed(2)}s">${ch}</span>`;
    }).join('')}</span>`).join('');
});

// ---------- brilhos de fundo ----------
const field = $('#sparkfield');
for (let i = 0; i < 26; i++) {
  const s = document.createElement('i');
  s.style.cssText = `left:${rnd() * 100}%;top:${rnd() * 100}%;--s:${8 + rnd() * 14}px;--t:${(1 + rnd() * 2).toFixed(2)}s;--dl:${(rnd() * 2).toFixed(2)}s`;
  field.append(s);
}

// ---------- figurinhas que saltam do livro ----------
// [arte, p0, p1, [x,y] paisagem (vw/vh), [x,y] retrato, tamanho (vmin), rotação]
const FLY = [
  ['moon',     .20, .34, [-41,-30], [-24,-35], 17, -12],
  ['starGold', .22, .36, [ 40,-32], [ 27,-37], 12,  10],
  ['starBlue', .25, .40, [-30, 38], [-10, 27], 13,   8],
  ['fairy',    .52, .66, [ 40, 24], [ 28, 33], 20,  -6],
  ['photo',    .54, .70, [-41, 22], [-27, 30], 22,   6],
  ['crown',    .56, .70, [-27,-41], [  2,-39], 14,  -8],
  ['heart',    .85, .95, [ 41,-14], [  8, 30], 11,  10],
  ['lamb',     .86, .96, [-41,-12], [ 30,-25], 18,  -6]
];
const flyers = $('#flyers');
const fl = FLY.map(([art, p0, p1, L, P, size, rot]) => {
  const el = document.createElement('div');
  el.className = 'fly';
  el.innerHTML = `<div class="bob"><div class="stk">${ART[art]}</div></div>`;
  flyers.append(el);
  return {el, p0, p1, L, P, size, rot};
});

// ---------- scroll -> livro ----------
const scroller = $('#scroller'), stage = $('#stage'), book = $('#book'), cta = $('#cta');
const leaves = $$('.leaf', book).sort((a, b) => +a.dataset.leaf - +b.dataset.leaf);
const TURN = [[.06, .26], [.38, .54], [.70, .86]];   // faixas de scroll em que cada folha vira
const POP = TURN.map(([a, b]) => a + (b - a) * .72);  // quando a dupla de páginas está aberta
const pages = $$('.pg');

let target = 0, cur = 0;
const readTarget = () => {
  const max = scroller.offsetHeight - innerHeight;
  target = max > 0 ? clamp(-scroller.getBoundingClientRect().top / max) : 0;
};

function apply(p) {
  const portrait = innerWidth / innerHeight < .8;
  leaves.forEach((leaf, i) => {
    const t = ease(clamp((p - TURN[i][0]) / (TURN[i][1] - TURN[i][0])));
    const z = t >= .5 ? i * .8 + .4 : (3 - i) * .8 + .4;
    leaf.classList.toggle('flipped', t >= .5);
    leaf.style.transform = `translateZ(${z}px) rotateY(${-179.5 * t}deg)`;
    if (i === 0) {
      book.style.setProperty('--o', t.toFixed(4));
      book.style.setProperty('--ry', (-14 * (1 - t)).toFixed(2) + 'deg');
      book.style.setProperty('--rx', (9 - 6 * t).toFixed(2) + 'deg');
    }
  });
  // leve zoom na página do abraço (pico) e respiro no final
  const peak = ease(clamp((p - .42) / .1)) * (1 - ease(clamp((p - .64) / .1)));
  book.style.setProperty('--sc', (1 + (portrait ? 0 : .07) * peak + .02 * ease(clamp((p - .06) / .2))).toFixed(4));
  stage.classList.toggle('open', p > .08);

  pages.forEach(pg => pg.classList.toggle('pop', p > POP[+pg.dataset.spread - 1]));
  cta.classList.toggle('show', p > .9);
  $('#scrollcue').classList.toggle('gone', p > .035);

  const vw = innerWidth / 100, vh = innerHeight / 100, vmin = Math.min(vw, vh);
  fl.forEach(f => {
    const t = ease(clamp((p - f.p0) / (f.p1 - f.p0)));
    const [x, y] = portrait ? f.P : f.L;
    const s = lerp(.15, 1, t), sz = f.size * vmin * (portrait ? 1.05 : 1);
    f.el.style.width = f.el.style.height = sz + 'px';
    f.el.style.marginLeft = f.el.style.marginTop = -sz / 2 + 'px';
    f.el.style.opacity = clamp(t * 1.6);
    f.el.style.transform = `translate(${x * vw * t}px,${y * vh * t - (p - f.p1) * 40 * t}px) scale(${s}) rotate(${f.rot * t + (1 - t) * 160}deg)`;
  });
}

function frame() {
  cur = reduced ? target : cur + (target - cur) * .11;
  if (Math.abs(target - cur) < .0002) cur = target;
  apply(cur);
  requestAnimationFrame(frame);
}
addEventListener('scroll', readTarget, {passive: true});
addEventListener('resize', readTarget);
readTarget(); cur = target;
requestAnimationFrame(frame);
