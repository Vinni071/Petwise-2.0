const USERS_KEY = "petwise-usuarios";
const SESSION_KEY = "petwise-sessao";
const SESSION_TTL = 8 * 60 * 60 * 1000;

function lerUsuarios() {
    try {
        const usuarios = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
        return Array.isArray(usuarios) ? usuarios : [];
    } catch { return []; }
}

function salvarUsuarios(usuarios) { localStorage.setItem(USERS_KEY, JSON.stringify(usuarios)); }

async function hashSenha(senha) {
    const dados = new TextEncoder().encode(senha);
    const resultado = await crypto.subtle.digest("SHA-256", dados);
    return Array.from(new Uint8Array(resultado), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function prepararUsuarios() {
    const usuarios = lerUsuarios();
    if (!usuarios.some((usuario) => usuario.tipo === "funcionario")) {
        usuarios.push({ nome: "Equipe PetWise", email: "funcionario@petwise.com", senhaHash: await hashSenha("petwise123"), tipo: "funcionario" });
        salvarUsuarios(usuarios);
    }
}

function iniciarSessao(usuario) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ nome: usuario.nome, email: usuario.email, tipo: usuario.tipo, expiraEm: Date.now() + SESSION_TTL }));
}

function sessaoAtual() {
    try {
        const sessao = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
        if (!sessao || sessao.expiraEm < Date.now()) { sessionStorage.removeItem(SESSION_KEY); return null; }
        return sessao;
    } catch { return null; }
}

async function entrar(email, senha, tipo) {
    const emailNormalizado = email.trim().toLowerCase();
    const senhaHash = await hashSenha(senha);
    const usuarios = lerUsuarios();
    const usuario = usuarios.find((item) => item.email.toLowerCase() === emailNormalizado && (item.senhaHash === senhaHash || item.senha === senha) && item.tipo === tipo);
    if (!usuario) return false;
    if (usuario.senha) { usuario.senhaHash = senhaHash; delete usuario.senha; salvarUsuarios(usuarios); }
    iniciarSessao(usuario);
    return true;
}

async function cadastrarTutor(email, senha, nome, pacienteId) {
    if (!email || !senha) return;
    const emailNormalizado = email.trim().toLowerCase();
    const usuarios = lerUsuarios().filter((usuario) => usuario.email.toLowerCase() !== emailNormalizado);
    usuarios.push({ nome, email: emailNormalizado, senhaHash: await hashSenha(senha), tipo: "tutor", pacienteId });
    salvarUsuarios(usuarios);
}

function proteger(tipo) {
    const sessao = sessaoAtual();
    if (!sessao || sessao.tipo !== tipo) { window.location.replace(`login.html?tipo=${encodeURIComponent(tipo)}`); return null; }
    return sessao;
}

function sair() { sessionStorage.removeItem(SESSION_KEY); window.location.replace("login.html"); }

const authReady = prepararUsuarios();
window.PetwiseAuth = { entrar, cadastrarTutor, proteger, sair, sessaoAtual, authReady };
