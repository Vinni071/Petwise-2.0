const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const staffHint = document.querySelector("#staff-hint");
let tipoSelecionado = new URLSearchParams(window.location.search).get("tipo") || "tutor";

if (window.location.search) {
    window.history.replaceState({}, document.title, window.location.pathname);
}

function atualizarTipo() {
    document.querySelectorAll(".access-tab").forEach((tab) => {
        const ativo = tab.dataset.tipo === tipoSelecionado;
        tab.classList.toggle("is-active", ativo);
        tab.setAttribute("aria-selected", String(ativo));
    });
    staffHint.hidden = tipoSelecionado !== "funcionario";
}

document.querySelectorAll(".access-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        tipoSelecionado = tab.dataset.tipo;
        loginMessage.textContent = "";
        atualizarTipo();
    });
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;
    const dados = Object.fromEntries(new FormData(loginForm));
    const botao = loginForm.querySelector("button[type=submit]");
    botao.disabled = true;
    loginMessage.textContent = "Validando acesso...";
    try {
        await window.PetwiseAuth.authReady;
        const entrou = await window.PetwiseAuth.entrar(dados.email, dados.senha, tipoSelecionado);
        if (!entrou) {
            loginMessage.textContent = "E-mail, senha ou perfil inválido.";
            return;
        }
        window.location.href = tipoSelecionado === "funcionario" ? "funcionarios.html" : "usuario.html";
    } catch (error) {
        console.error("Não foi possível validar o acesso.", error);
        loginMessage.textContent = "Não foi possível validar o acesso. Atualize a página e tente novamente.";
    } finally {
        botao.disabled = false;
    }
});

atualizarTipo();
