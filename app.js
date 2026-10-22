import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, sendPasswordResetEmail, deleteUser } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, addDoc, onSnapshot,
  serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const EMOJIS = ['🙂','😇','🌸','🌻','🕊️','📚','🔥','🌿','⭐','🦋','🙏','☀️'];
const QUESTIONS = [
  ['O que mais me marcou hoje?', 'Anote uma frase, ideia ou trecho da leitura.'],
  ['O que aprendi?', 'Como posso aplicar esse aprendizado à minha vida?'],
  ['Pelo que quero orar?', 'Registre um pedido, agradecimento ou motivo de intercessão.']
];

const app = document.getElementById('app');
const SW_ICON = {success:'#3f8f5a', error:'#c0392b', warning:'#e0a526', question:'#b8741f', info:'#b8741f'};
const SW_TITLE = {success:'Pronto!', error:'Ops!', warning:'Atenção', question:'Tem certeza?', info:'Aviso'};
const Sw = window.Swal && window.Swal.mixin({
  buttonsStyling:false, reverseButtons:true, backdrop:'rgba(60,40,20,.45)', returnFocus:false,
  customClass:{popup:'sw-pop', title:'sw-title', htmlContainer:'sw-text', actions:'sw-actions', confirmButton:'sw-ok', cancelButton:'sw-cancel'}
});
// mensagem simples
const say = (text, icon = 'info', title) => Sw
  ? Sw.fire({icon, iconColor:SW_ICON[icon], title:title || SW_TITLE[icon], text, confirmButtonText:'Ok'})
  : (alert(text), Promise.resolve());
// pergunta de confirmação -> true/false
const ask = (text, {title = 'Tem certeza?', ok = 'Confirmar', danger = false} = {}) => Sw
  ? Sw.fire({icon:danger ? 'warning' : 'question', iconColor:SW_ICON[danger ? 'warning' : 'question'], title, text, showCancelButton:true, focusCancel:danger,
      confirmButtonText:ok, cancelButtonText:'Cancelar', customClass:{popup:'sw-pop', title:'sw-title', htmlContainer:'sw-text', actions:'sw-actions', confirmButton:danger ? 'sw-ok sw-danger' : 'sw-ok', cancelButton:'sw-cancel'}}).then(r => r.isConfirmed)
  : Promise.resolve(confirm(text));
const toast = (title, icon = 'success') => Sw
  ? Sw.fire({toast:true, backdrop:false, position:'top', icon, iconColor:SW_ICON[icon], title, showConfirmButton:false, timer:2600, timerProgressBar:true, customClass:{popup:'sw-toast', title:'sw-toast-title'}})
  : null;
const RT = [
  ["'Abril Fatface',serif", "#f3deb0", "#2a1c10"], ["'Rye',serif", "#1f1a14", "#e8c46a"], ["'UnifrakturCook',serif", "#f6efe0", "#2c3a1f", 700],
  ["'Playfair Display',serif", "#e9a8b4", "#5a1f2f", 900], ["'Limelight',serif", "#d8a85a", "#2a1c10"], ["'Bodoni Moda',serif", "#fffdf7", "#7a1f2b", 700, "italic"],
  ["'Chonburi',serif", "#a9bb92", "#2f3a1b"], ["'Cinzel Decorative',serif", "#e7b6c2", "#5a3a3a", 900]
];
const rtiles = (txt, k0 = 0) => [...txt].map((ch, i) => {
  const t = RT[(k0 + i * 3) % RT.length];
  return `<span class="rt" style="--f-t:${t[0]};--bg-t:${t[1]};--c-t:${t[2]};--w-t:${t[3] || 400};--s-t:${t[4] || 'normal'};--tr:${[-4, 3, -2, 5, -3, 2][(k0 + i) % 6]}deg">${ch}</span>`;
}).join('');
document.querySelector('header h1').innerHTML = `<span class="sr">Clube do Livro</span><span aria-hidden="true">${rtiles('Clube', 0)}<i class="rgap"></i>${rtiles('do', 2)}<i class="rgap"></i>${rtiles('Livro', 5)}</span>`;
if (firebaseConfig.apiKey === 'COLE_AQUI') {
  app.innerHTML = '<div class="card"><h2>Falta configurar o Firebase</h2><p>Abra <code>firebase-config.js</code> e cole a configuração do seu app web.</p></div>';
  throw new Error('firebase-config.js não preenchido');
}
const fb = initializeApp(firebaseConfig);
const auth = getAuth(fb), db = getFirestore(fb);

// estado: dados em tempo real do Firestore
const S = {user:null, users:{}, books:[], progress:{}, notes:{}, admins:{}, removed:{}, isAdmin:false, blocked:false};
let view = {name:'home'};
let registering = false, unsubs = [], ready = false, authMode = 'login', pickedEmoji = EMOJIS[0];

const uid = () => S.user?.uid;
const me = () => S.users[uid()];
const pkey = (bid, u = uid()) => `${u}_${bid}`;

// ---------- utilitários ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parseD = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d, 12); };
const fmt = d => d.toLocaleDateString('pt-BR');
const iso = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const todayISO = () => iso(new Date());
const errMsg = e => ({
  'auth/invalid-credential':'E-mail ou senha incorretos.', 'auth/invalid-email':'E-mail inválido.',
  'auth/email-already-in-use':'Este e-mail já tem cadastro. Use “Entrar”.', 'auth/weak-password':'A senha precisa ter ao menos 6 caracteres.',
  'auth/user-not-found':'E-mail não cadastrado.', 'auth/too-many-requests':'Muitas tentativas. Aguarde um pouco.',
  'permission-denied':'Sem permissão. Verifique se as regras do Firestore foram publicadas.'
}[e.code] || e.message);

// ---------- cronograma ----------
function schedule(b){
  const n = Math.ceil(b.pages / b.perDay), start = parseD(b.start), out = [];
  for (let i = 0; i < n; i++){
    const d = new Date(start); d.setDate(d.getDate() + i);
    out.push({n:i+1, date:iso(d), from:i*b.perDay+1, to:Math.min((i+1)*b.perDay, b.pages)});
  }
  return out;
}
const bookEnd = b => { const s = schedule(b); return s[s.length-1].date; };
const doneMap = (bid, u = uid()) => S.progress[pkey(bid, u)]?.done || {};
const doneCount = (bid, u) => Object.values(doneMap(bid, u)).filter(Boolean).length;

// ---------- sessão e dados em tempo real ----------
onAuthStateChanged(auth, user => {
  unsubs.forEach(u => u()); unsubs = [];
  S.user = user; ready = false;
  if (!user) { Object.assign(S, {users:{}, books:[], progress:{}, notes:{}, admins:{}, removed:{}, isAdmin:false, blocked:false}); ready = true; return render(); }
  let pending = 3;
  const first = () => { if (--pending === 0) { ready = true; } };
  const listen = (name, fn) => {
    let got = false;
    unsubs.push(onSnapshot(collection(db, name), snap => {
      fn(snap); if (!got) { got = true; first(); }
      softRender();
    }, e => say(errMsg(e), 'error')));
  };
  // quem é admin, e se o meu acesso foi removido
  let removedUnsub = null;
  unsubs.push(() => removedUnsub && removedUnsub());
  unsubs.push(onSnapshot(collection(db, 'admins'), snap => {
    S.admins = {}; snap.forEach(d => S.admins[d.id] = true);
    const was = S.isAdmin; S.isAdmin = !!S.admins[user.uid];
    if (S.isAdmin && !removedUnsub) removedUnsub = onSnapshot(collection(db, 'removed'), s => { S.removed = {}; s.forEach(d => S.removed[d.id] = d.data()); softRender(); }, () => {});
    if (was !== S.isAdmin) softRender();
  }, () => {}));
  unsubs.push(onSnapshot(doc(db, 'removed', user.uid), s => { S.blocked = s.exists(); softRender(); }, () => {}));
  listen('users', s => { S.users = {}; s.forEach(d => S.users[d.id] = d.data()); });
  listen('books', s => { S.books = s.docs.map(d => ({id:d.id, ...d.data()})).sort((a,b) => (a.start > b.start) - (a.start < b.start)); });
  listen('progress', s => { S.progress = {}; s.forEach(d => S.progress[d.id] = d.data()); });
});

// não recria a tela enquanto a pessoa está digitando uma anotação
function softRender(){
  if (view.name === 'new' || view.name === 'profile') return;
  if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;
  render();
}

function go(name, id){ if (name === 'new') newCover = ''; if (name === 'profile') editEmoji = me()?.emoji || EMOJIS[0]; view = {name, id}; render(); window.scrollTo(0,0); }

async function loadNotes(bid){
  if (S.notes[bid]) return;
  try { const s = await getDoc(doc(db, 'notes', pkey(bid))); S.notes[bid] = s.exists() ? s.data().days || {} : {}; }
  catch(e){ S.notes[bid] = {}; }
  if (view.name === 'book' && view.id === bid) render();
}

function render(){
  document.body.classList.toggle("auth-screen", !S.user);
  const who = document.getElementById('who');
  const p = me();
  who.innerHTML = p ? `<button class="me" onclick="go('profile')" title="Ajustes do perfil"><span class="avatar" style="background:${p.color}">${p.emoji}</span><span class="nm">${esc(p.name)}</span></button>${S.isAdmin ? '<button onclick="go(\'admin\')">Admin</button>' : ''}<button onclick="logout()">Sair</button>` : '';
  if (!S.user) { app.innerHTML = viewAuth(); return; }
  document.body.classList.toggle("auth-screen", !S.user || S.blocked || (ready && !p && !registering));
  if (S.user && S.blocked) { app.innerHTML = viewBlocked(); return; }
  if (ready && !p && !registering) { app.innerHTML = viewComplete(); return; }
  if (!ready || !p) { app.innerHTML = '<p class="muted">Carregando…</p>'; return; }
  if (view.name === 'book') loadNotes(view.id);
  app.innerHTML = ({home:viewHome, new:viewNewBook, book:viewBook, club:viewClub, profile:viewProfile, admin:viewAdmin})[view.name]();
}

// ---------- entrar / cadastrar ----------
const TILE = [
  ["#56742c","#fff"], ["#fbfaf6","#4b2f1c"], ["#d6a14f","#4b2f1c"], ["#7a1f2b","#f4e6d0"], ["#e9b9bd","#5a2f2f"]
];
const ransom = txt => [...txt].map((ch, i) => ch === " " ? "<span style=\"display:inline-block;width:.3em\"></span>"
  : `<span class="lt" style="background:${TILE[i % 5][0]};color:${TILE[i % 5][1]};--tr:${[-4,3,-2,5,-3,2][i % 6]}deg">${ch}</span>`).join("");
const ICON = {
  mail: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>`,
  lock: `<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
  user: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 14.5-4 16 0"/></svg>`,
  eye: `<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/></svg>`
};
function viewAuth(){
  const reg = authMode === "register";
  return `
  <div class="lwrap">
    <div class="lbox">
      <img class="deco lamb" src="img/cordeirinho-livre.png" alt="">
      <div class="lcard">
        <h1 class="ltitle" aria-label="${reg ? "Cadastro" : "Login"}">${ransom(reg ? "Cadastro" : "Login")}</h1>
        ${reg ? `<label class="field">${ICON.user}<input id="pname" maxlength="30" placeholder="Seu nome" autocomplete="name"></label>
        <div class="lemojis">${EMOJIS.map(e => `<button type="button" class="${e===pickedEmoji?"on":""}" onclick="pickEmoji('${e}')" aria-label="Ícone ${e}">${e}</button>`).join("")}</div>` : ""}
        <label class="field">${ICON.mail}<input id="email" type="email" placeholder="E-mail" autocomplete="email"></label>
        <label class="field">${ICON.lock}<input id="senha" type="password" placeholder="Senha" autocomplete="${reg?"new-password":"current-password"}" onkeydown="if(event.key==='Enter')submitAuth()">
          <button type="button" class="eye" onclick="togglePw()" aria-label="Mostrar ou ocultar senha">${ICON.eye}</button></label>
        <button class="lbtn primary" onclick="submitAuth()">${reg ? "Criar perfil" : "Entrar"} →</button>
        <div class="lrow ${reg ? "one" : ""}">
          <button class="lbtn ghost" onclick="setMode('${reg?"login":"register"}')">${reg ? "Já tenho perfil" : "Criar um perfil"}</button>
          ${reg ? "" : `<button class="lbtn ghost" onclick="resetPw()">Esqueci a senha</button>`}
        </div>
      </div>
      <a class="lback" href="index.html">← Voltar ao início</a>
    </div>
  </div>`;
}
const togglePw = () => { const i = document.getElementById("senha"); i.type = i.type === "password" ? "text" : "password"; };
function keepForm(fn){
  const v = ['pname','email','senha'].map(id => document.getElementById(id)?.value || '');
  fn(); render();
  ['pname','email','senha'].forEach((id,i) => { const el = document.getElementById(id); if (el) el.value = v[i]; });
}
const pickEmoji = e => keepForm(() => pickedEmoji = e);
const setMode = m => keepForm(() => authMode = m);
const createProfileDoc = (id, name) => {
  const hues = [28,150,200,280,340,45,100];
  return setDoc(doc(db, 'users', id), {name, emoji:pickedEmoji, color:`hsl(${hues[Math.floor(Math.random()*hues.length)]} 55% 55%)`, createdAt:serverTimestamp()});
};
function viewBlocked(){
  return `
  <div class="lwrap"><div class="lbox"><div class="lcard">
    <h1 class="ltitle" aria-label="Aviso">${ransom("Aviso")}</h1>
    <p style="text-align:center;margin:0 0 22px;font:500 1.35rem 'Caveat',cursive;color:#6b4423;line-height:1.3">Seu acesso ao clube foi removido pela administração.<br>Se foi um engano, fale com quem organiza o clube.</p>
    <button class="lbtn primary" onclick="logout()">Sair</button>
  </div></div></div>`;
}
function viewComplete(){
  return `
  <div class="lwrap">
    <div class="lbox">
      <div class="lcard">
        <h1 class="ltitle" aria-label="Seu perfil">${ransom("Perfil")}</h1>
        <p style="text-align:center;margin:-8px 0 18px;font:500 1.2rem 'Caveat',cursive;color:#7a4e22">Falta só escolher seu nome e ícone para entrar no clube.</p>
        <label class="field">${ICON.user}<input id="pname" maxlength="30" placeholder="Seu nome" autocomplete="name" onkeydown="if(event.key==='Enter')saveNewProfile()"></label>
        <div class="lemojis">${EMOJIS.map(e => `<button type="button" class="${e===pickedEmoji?"on":""}" onclick="pickEmoji('${e}')" aria-label="Ícone ${e}">${e}</button>`).join("")}</div>
        <button class="lbtn primary" onclick="saveNewProfile()">Salvar e entrar →</button>
        <div class="lrow one"><button class="lbtn ghost" onclick="logout()">Sair</button></div>
      </div>
    </div>
  </div>`;
}
async function saveNewProfile(){
  const name = document.getElementById('pname').value.trim();
  if (!name) return say('Digite seu nome.', 'warning');
  try { await createProfileDoc(uid(), name); go('home'); } catch(e){ say(errMsg(e), 'error'); }
}
async function submitAuth(){
  const email = document.getElementById('email').value.trim(), senha = document.getElementById('senha').value;
  try {
    if (authMode === 'register') {
      const name = document.getElementById('pname').value.trim();
      if (!name) return say('Digite seu nome.', 'warning');
      registering = true;
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      await createProfileDoc(cred.user.uid, name);
      registering = false;
    } else await signInWithEmailAndPassword(auth, email, senha);
    go('home');
  } catch(e){ registering = false; say(errMsg(e), 'error'); render(); }
}
async function resetPw(){
  const email = document.getElementById('email').value.trim();
  if (!email) return say('Digite seu e-mail no campo acima e clique de novo.', 'warning');
  try { await sendPasswordResetEmail(auth, email); say('Enviamos um link para redefinir a senha. Confira também a caixa de spam.', 'success', 'E-mail enviado'); } catch(e){ say(errMsg(e), 'error'); }
}
const logout = () => signOut(auth);
async function deleteProfile(){
  if (!(await ask('Isso apaga seu perfil, seu progresso e todas as suas anotações. Não pode ser desfeito.', {title:'Excluir seu perfil?', ok:'Sim, excluir', danger:true}))) return;
  try {
    for (const b of S.books){ await deleteDoc(doc(db,'progress',pkey(b.id))); await deleteDoc(doc(db,'notes',pkey(b.id))); }
    await deleteDoc(doc(db,'users',uid()));
    await deleteUser(auth.currentUser);
  } catch(e){ say(e.code === 'auth/requires-recent-login' ? 'Por segurança, saia, entre de novo e tente excluir outra vez.' : errMsg(e), 'error'); }
}

// ---------- início ----------
function viewHome(){
  const today = todayISO();
  return `
  <div class="row" style="justify-content:space-between;margin-bottom:14px"><h2 style="margin:0">Olá, ${esc(me().name)}!</h2>
    <div class="row" style="gap:16px"><button class="ghost" onclick="go('club')">Clube</button><button onclick="go('new')">+ Cadastrar livro</button></div></div>
  ${S.books.length ? S.books.map(b => {
    const sc = schedule(b), done = doneCount(b.id), pct = Math.round(done/sc.length*100);
    const t = sc.find(x => x.date === today);
    const status = today < b.start ? `Começa em ${fmt(parseD(b.start))}` : today > bookEnd(b) ? 'Período encerrado' : t ? `Hoje: páginas ${t.from}–${t.to}` : '';
    return `<div class="card">
      <div class="row" style="justify-content:space-between"><div class="row" style="flex-wrap:nowrap;gap:14px">${b.cover ? `<img class="thumb" src="${b.cover}" alt="">` : ''}<div>
        <h3 style="margin:0">${esc(b.title)}</h3><div class="muted">${esc(b.author)} · ${b.pages} páginas · ${fmt(parseD(b.start))} a ${fmt(parseD(bookEnd(b)))}</div></div></div>
        <button onclick="go('book','${b.id}')">Abrir cronograma</button></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="muted">${done} de ${sc.length} dias concluídos (${pct}%) ${status ? '· <b>'+status+'</b>' : ''}</div>
    </div>`;
  }).join('') : `<div class="card"><p>Nenhum livro cadastrado ainda.</p><button onclick="go('new')">Cadastrar o primeiro livro</button></div>`}`;
}

// ---------- administração ----------
function viewAdmin(){
  if (!S.isAdmin) return viewHome();
  const people = Object.entries(S.users).sort((x, y) => (x[1].name || '').localeCompare(y[1].name || '', 'pt-BR'));
  const gone = Object.entries(S.removed).sort((x, y) => (x[1].name || '').localeCompare(y[1].name || '', 'pt-BR'));
  return `
  <div class="row noprint"><button class="ghost sm" onclick="go('home')">← Voltar</button></div>
  <h2 style="margin-top:12px">Administração</h2>
  <p class="muted" style="margin-top:-6px">${people.length} pessoa${people.length === 1 ? '' : 's'} no clube · ${S.books.length} livro${S.books.length === 1 ? '' : 's'}</p>
  <div class="card">
    <h3 style="margin-top:0">Pessoas do clube</h3>
    ${people.map(([id, p]) => {
      const isMe = id === uid(), isAdm = !!S.admins[id];
      const prog = S.books.map(b => `${esc(b.title)}: ${doneCount(b.id, id)}/${schedule(b).length}`).join(' · ');
      return `<div class="adm-row">
        <span class="avatar" style="background:${p.color}">${p.emoji}</span>
        <div class="adm-info"><b>${esc(p.name)}</b> ${isAdm ? '<span class="tag">admin</span>' : ''} ${isMe ? '<span class="muted">(você)</span>' : ''}
          <div class="muted adm-prog">${prog || 'Sem livros ainda'}</div></div>
        ${isMe || isAdm ? '' : `<button class="danger sm" onclick="adminRemove('${id}')">Excluir</button>`}
      </div>`;
    }).join('') || '<p class="muted">Ninguém por aqui ainda.</p>'}
  </div>
  ${gone.length ? `<div class="card"><h3 style="margin-top:0">Acesso removido</h3>
    ${gone.map(([id, p]) => `<div class="adm-row"><div class="adm-info"><b>${esc(p.name || 'Sem nome')}</b></div><button class="ghost sm" onclick="adminRestore('${id}')">Restaurar acesso</button></div>`).join('')}
  </div>` : ''}`;
}
async function adminRemove(id){
  const p = S.users[id]; if (!p) return;
  if (!(await ask(`${p.name} perde o acesso, o progresso e as anotações. Os livros que ela cadastrou continuam no clube.`, {title:`Excluir ${p.name}?`, ok:'Sim, excluir', danger:true}))) return;
  try {
    const bookIds = new Set(S.books.map(b => b.id));
    Object.keys(S.progress).filter(k => k.startsWith(id + '_')).forEach(k => bookIds.add(k.slice(id.length + 1)));
    for (const bid of bookIds) {
      await deleteDoc(doc(db, 'progress', pkey(bid, id)));
      await deleteDoc(doc(db, 'notes', pkey(bid, id)));
    }
    await setDoc(doc(db, 'removed', id), {name:p.name, by:uid(), at:serverTimestamp()});
    await deleteDoc(doc(db, 'users', id));
    toast(`${p.name} foi excluída`);
  } catch(e){ say(errMsg(e), 'error'); }
}
async function adminRestore(id){
  try { await deleteDoc(doc(db, 'removed', id)); toast('Acesso restaurado'); } catch(e){ say(errMsg(e), 'error'); }
}

// ---------- ajustes do perfil ----------
let editEmoji = EMOJIS[0];
function viewProfile(){
  const p = me();
  return `
  <div class="row noprint"><button class="ghost sm" onclick="go('home')">← Voltar</button></div>
  <h2 style="margin-top:12px">Ajustes do perfil</h2>
  <div class="card">
    <h3 style="margin-top:0">Seus dados</h3>
    <label class="l" for="pfname" style="margin:0 0 6px;color:var(--ink);font-size:.95rem">Nome</label>
    <div class="f"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 14.5-4 16 0"/></svg><input id="pfname" maxlength="30" value="${esc(p.name)}"></div>
    <label class="l" style="margin:0 0 8px;color:var(--ink);font-size:.95rem">Ícone</label>
    <div class="lemojis" id="pfemojis" style="justify-content:flex-start;margin-bottom:20px">${EMOJIS.map(e => `<button type="button" class="${e === editEmoji ? 'on' : ''}" onclick="pickProfileEmoji('${e}')" aria-label="Ícone ${e}">${e}</button>`).join('')}</div>
    <button onclick="saveProfile()">Salvar alterações</button>
  </div>
  <div class="card" style="border-color:#e3b5ae">
    <h3 style="margin-top:0;color:#a33">Excluir perfil</h3>
    <p class="muted">Apaga seu perfil, seu progresso e todas as suas anotações. Os livros que você cadastrou continuam no clube. Isso não pode ser desfeito.</p>
    <button class="danger" onclick="deleteProfile()">Excluir meu perfil</button>
  </div>`;
}
function pickProfileEmoji(e){
  editEmoji = e;
  document.querySelectorAll('#pfemojis button').forEach(b => b.classList.toggle('on', b.textContent === e));
}
async function saveProfile(){
  const name = document.getElementById('pfname').value.trim();
  if (!name) return say('Digite seu nome.', 'warning');
  try { await setDoc(doc(db, 'users', uid()), {name, emoji:editEmoji}, {merge:true}); go('home'); toast('Perfil atualizado'); }
  catch(e){ say(errMsg(e), 'error'); }
}

// ---------- novo livro ----------
let newCover = '';
const IC = {
  book: '<svg viewBox="0 0 24 24"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5z"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 14.5-4 16 0"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/></svg>',
  cal: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'
};
const coverBox = () => newCover
  ? `<img src="${newCover}" alt="Capa do livro">`
  : `${IC.cam}<b>Adicionar capa</b><small>JPG, PNG ou WEBP<br>Máx. 5MB</small>`;
function viewNewBook(){
  return `
  <div class="nb">
    <svg class="nb-dash" viewBox="0 0 44 44" fill="none" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 14l9 5M4 25h12M12 36l8-6"/></svg>
    <svg class="nb-smile" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="47" fill="#fff"/><circle cx="50" cy="50" r="40" fill="#f2b32c" stroke="#2b1b10" stroke-width="3"/><circle cx="37" cy="40" r="5" fill="#2b1b10"/><circle cx="63" cy="40" r="5" fill="#2b1b10"/><path d="M28 56q22 24 44 0" fill="none" stroke="#2b1b10" stroke-width="5" stroke-linecap="round"/></svg>
    <h2 class="nb-title"><span class="torn pink">Cadastrar</span><span class="torn green">livro</span>
      <svg class="nb-star" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,6 62,38 95,40 69,60 78,93 50,74 22,93 31,60 5,40 38,38" fill="#f6c94e" stroke="#e0a526" stroke-width="4" stroke-linejoin="round"/></svg></h2>
    <div class="nb-grid">
      <div>
        <div class="cover-box">
          <button type="button" class="cover-drop ${newCover ? 'has' : ''}" id="coverDrop" onclick="document.getElementById('coverFile').click()" aria-label="Adicionar capa">${coverBox()}</button>
          <input id="coverFile" type="file" accept="image/jpeg,image/png,image/webp" hidden onchange="pickCover(this)">
        </div>
        <button type="button" class="ghost cover-clear" id="coverClear" onclick="clearCover()" ${newCover ? '' : 'hidden'}>Remover capa</button>
      </div>
      <div class="nb-form">
        <label class="l" for="bt">Título <b>*</b></label>
        <div class="f">${IC.book}<input id="bt" placeholder="Ex.: Bom dia, Espírito Santo" maxlength="120"></div>
        <label class="l" for="ba">Autor(a) <b>*</b></label>
        <div class="f">${IC.user}<input id="ba" placeholder="Ex.: Benny Hinn" maxlength="80"></div>
        <div class="nb-row">
          <div><label class="l" for="bp">Total de páginas <b>*</b></label><div class="f">${IC.book}<input id="bp" type="number" min="1" value="208" oninput="preview()"></div></div>
          <div><label class="l" for="bd">Páginas por dia <b>*</b></label><div class="f">${IC.doc}<input id="bd" type="number" min="1" value="10" oninput="preview()"></div></div>
          <div><label class="l" for="bs">Data de início <b>*</b></label><div class="f">${IC.cal}<input id="bs" type="date" value="${todayISO()}" oninput="preview()"></div></div>
        </div>
        <p id="prev" class="muted nb-prev"></p>
        <div class="nb-actions"><button onclick="addBook()">${IC.plus} Gerar cronograma</button><button class="ghost" onclick="go('home')">Cancelar</button></div>
      </div>
    </div>
  </div>`;
}
// reduz a capa para caber no Firestore (sem precisar de Storage)
function pickCover(inp){
  const f = inp.files[0]; inp.value = '';
  if (!f) return;
  if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return say('Use uma imagem JPG, PNG ou WEBP.', 'warning');
  if (f.size > 5 * 1024 * 1024) return say('A imagem passa de 5MB.', 'warning');
  const url = URL.createObjectURL(f), img = new Image();
  img.onload = () => {
    const k = Math.min(1, 420 / img.width, 600 / img.height), c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    newCover = c.toDataURL('image/jpeg', .82); URL.revokeObjectURL(url); refreshCover();
  };
  img.onerror = () => say('Não consegui abrir essa imagem.', 'error');
  img.src = url;
}
function refreshCover(){
  const d = document.getElementById('coverDrop'); if (!d) return;
  d.classList.toggle('has', !!newCover); d.innerHTML = coverBox();
  document.getElementById('coverClear').hidden = !newCover;
}
const clearCover = () => { newCover = ''; refreshCover(); };
function bookFromForm(){
  const pages = +document.getElementById('bp').value, perDay = +document.getElementById('bd').value, start = document.getElementById('bs').value;
  return pages > 0 && perDay > 0 && start ? {pages, perDay, start} : null;
}
function preview(){
  const f = bookFromForm(), el = document.getElementById('prev');
  el.innerHTML = f ? `Serão <b>${Math.ceil(f.pages/f.perDay)} dias</b> de leitura, terminando em <b>${fmt(parseD(bookEnd(f)))}</b>.` : '';
}
async function addBook(){
  const f = bookFromForm(), title = document.getElementById('bt').value.trim(), author = document.getElementById('ba').value.trim();
  if (!title) return say('Digite o título do livro.', 'warning');
  if (!author) return say('Digite o nome do(a) autor(a).', 'warning');
  if (!f) return say('Preencha páginas, ritmo e data de início.', 'warning');
  try {
    const ref = await addDoc(collection(db, 'books'), {title, author, ...f, ...(newCover ? {cover:newCover} : {}), createdBy:uid(), createdAt:serverTimestamp()});
    go('book', ref.id); toast('Livro cadastrado, cronograma gerado');
  } catch(e){ say(errMsg(e), 'error'); }
}
async function deleteBook(id){
  if (!(await ask('O livro e o cronograma somem para todo o clube.', {title:'Excluir este livro?', ok:'Sim, excluir', danger:true}))) return;
  try { await deleteDoc(doc(db, 'books', id)); go('home'); toast('Livro excluído'); } catch(e){ say(errMsg(e), 'error'); }
}

// ---------- cronograma do livro ----------
function viewBook(){
  const b = S.books.find(x => x.id === view.id); if (!b) return viewHome();
  const sc = schedule(b), dm = doneMap(b.id), notes = S.notes[b.id] || {}, today = todayISO();
  const done = sc.filter(d => dm[d.n]).length, pct = Math.round(done/sc.length*100);
  const third = Math.ceil(sc.length/3);
  const mt = i => { const a = sc[i*third], z = sc[Math.min((i+1)*third, sc.length)-1]; return a ? `${fmt(parseD(a.date))} a ${fmt(parseD(z.date))}` : null; };
  const themes = ['compartilhem o que mais chamou a atenção nas primeiras leituras.','conversem sobre os aprendizados e as mudanças que desejam colocar em prática.','compartilhem os principais aprendizados, dúvidas e temas para continuar estudando na Bíblia.'];
  return `
  <div class="row noprint" style="justify-content:space-between"><button class="ghost sm" onclick="go('home')">← Voltar</button>
    <button class="ghost sm" onclick="window.print()">🖨 Imprimir</button></div>
  <div class="bookhead">
    ${b.cover ? `<img class="bookcover" src="${b.cover}" alt="Capa">` : ''}
    <div><h2 style="margin:0 0 6px">${esc(b.title)}</h2>
    <div class="muted">${esc(b.author)} · ${b.pages} páginas · ${b.perDay} por dia · ${fmt(parseD(b.start))} a ${fmt(parseD(bookEnd(b)))}</div></div>
  </div>
  <div class="bar"><i style="width:${pct}%"></i></div>
  <div class="muted" id="progtxt" style="margin-bottom:14px">${done} de ${sc.length} dias concluídos (${pct}%)</div>
  ${sc.map(d => {
    const e = notes[d.n] || {}, isToday = d.date === today, open = isToday || view.open === d.n;
    return `<div class="day ${dm[d.n]?'done':''} ${isToday?'today':''} ${open?'open':''}" id="day${d.n}">
      <div class="dh" onclick="toggleOpen(${d.n})">
        <input type="checkbox" ${dm[d.n]?'checked':''} onclick="event.stopPropagation()" onchange="check('${b.id}',${d.n},this.checked)" aria-label="Concluí o dia ${d.n}">
        <div class="t"><b>Dia ${d.n} · ${fmt(parseD(d.date))} ${isToday?'<span class="tag">hoje</span>':''}</b><span class="muted">Páginas ${d.from}–${d.to}</span></div>
        <span class="muted">${(e.a1||e.a2||e.a3)?'✎':''}</span>
      </div>
      <div class="qs">
        ${QUESTIONS.map((q,i) => `<label>${i+1}. ${q[0]} <small>${q[1]}</small></label>
          <textarea oninput="note('${b.id}',${d.n},'a${i+1}',this.value)">${esc(e['a'+(i+1)])}</textarea>`).join('')}
        <div class="muted" style="margin-top:6px">🔒 Só você vê estas anotações.</div>
      </div></div>`;
  }).join('')}
  <h3>Sugestão para os encontros em grupo</h3>
  ${themes.map((t,i) => mt(i) ? `<div class="meet"><b>${mt(i)}:</b> ${t}</div>` : '').join('')}
  <p class="muted">Leiam os ensinamentos do livro à luz das Escrituras e conversem com liberdade, sem a obrigação de todas terem a mesma interpretação.</p>
  ${b.createdBy === uid() || S.isAdmin ? `<div class="noprint" style="margin-top:34px;padding-top:18px;border-top:1px solid var(--line)"><button class="danger sm" onclick="deleteBook('${b.id}')">Excluir livro</button></div>` : ''}`;
}
function toggleOpen(n){
  const el = document.getElementById('day'+n);
  el.classList.toggle('open'); view.open = el.classList.contains('open') ? n : null;
}
async function check(bid, n, v){
  document.getElementById('day'+n).classList.toggle('done', v);
  try { await setDoc(doc(db, 'progress', pkey(bid)), {uid:uid(), bookId:bid, done:{[n]:v}}, {merge:true}); }
  catch(e){ say(errMsg(e), 'error'); }
}
const timers = {};
function note(bid, n, k, v){
  ((S.notes[bid] ||= {})[n] ||= {})[k] = v;
  clearTimeout(timers[n+k]);
  timers[n+k] = setTimeout(() => setDoc(doc(db, 'notes', pkey(bid)), {uid:uid(), bookId:bid, days:{[n]:{[k]:v}}}, {merge:true}).catch(e => say(errMsg(e), 'error')), 600);
}

// ---------- clube ----------
function viewClub(){
  const people = Object.entries(S.users);
  return `
  <div class="row noprint"><button class="ghost sm" onclick="go('home')">← Voltar</button></div>
  <h2>Leitores do clube</h2>
  ${S.books.length ? S.books.map(b => {
    const tot = schedule(b).length;
    const rows = people.map(([id,p]) => ({p, d:doneCount(b.id, id)})).sort((a,c) => c.d - a.d);
    return `<div class="card"><h3 style="margin-top:0">${esc(b.title)}</h3>
      <table class="club">${rows.map(r => `<tr><td style="width:40%"><span class="avatar" style="background:${r.p.color};width:28px;height:28px;font-size:.9rem">${r.p.emoji}</span> ${esc(r.p.name)}</td>
        <td><div class="bar" style="margin:0"><i style="width:${r.d/tot*100}%"></i></div></td><td style="width:70px">${r.d}/${tot}</td></tr>`).join('')}</table></div>`;
  }).join('') : '<p class="muted">Cadastre um livro para acompanhar o progresso do grupo.</p>'}
  <p class="muted">Só os dias concluídos aparecem para o grupo. As anotações são privadas.</p>`;
}

Object.assign(window, {adminRemove, adminRestore, saveNewProfile, pickProfileEmoji, saveProfile, pickCover, clearCover, togglePw, go, logout, pickEmoji, setMode, submitAuth, resetPw, deleteProfile, preview, addBook, deleteBook, toggleOpen, check, note});
