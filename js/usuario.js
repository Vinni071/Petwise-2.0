const PACIENTES_KEY = "petwise-pacientes";
const LEGACY_KEY = "petwise-cadastro";
const CHAT_KEY = "petwise-mensagens";
const sessao = window.PetwiseAuth?.proteger("tutor");

const selectPaciente = document.querySelector("#portal-patient-select");
const chatMensagens = document.querySelector("#portal-chat-messages");
const chatForm = document.querySelector("#portal-chat-form");
document.querySelector("#logout-button")?.addEventListener("click", () => window.PetwiseAuth?.sair());
let pacientes = [];

function idNovo() {
    return crypto.randomUUID();
}

function lerRegistros() {
    try {
        const registros = JSON.parse(localStorage.getItem(PACIENTES_KEY) || "[]");
        if (Array.isArray(registros) && registros.length) return registros;
        const legado = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
        return legado ? [{ ...legado, id: legado.id || idNovo() }] : [];
    } catch (error) {
        console.error("Não foi possível carregar os pacientes.", error);
        return [];
    }
}

function texto(valor) {
    return typeof valor === "string" && valor.trim() ? valor.trim() : "Não informado";
}

function lerMensagens() {
    try {
        const mensagens = JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");
        return Array.isArray(mensagens) ? mensagens : [];
    } catch (error) {
        return [];
    }
}

function gravarMensagens(mensagens) {
    try {
        localStorage.setItem(CHAT_KEY, JSON.stringify(mensagens));
    } catch (error) {
        console.error("Não foi possível salvar a mensagem.", error);
    }
}

function renderMensagens(id) {
    chatMensagens.replaceChildren();
    const mensagens = lerMensagens().filter((mensagem) => mensagem.pacienteId === id);
    if (!mensagens.length) {
        const vazio = document.createElement("p");
        vazio.className = "chat-empty";
        vazio.textContent = "Nenhuma mensagem por aqui ainda.";
        chatMensagens.append(vazio);
        return;
    }
    mensagens.forEach((mensagem) => {
        const baloon = document.createElement("div");
        baloon.className = `chat-bubble ${mensagem.autor === "tutor" ? "from-tutor" : "from-clinic"}`;
        const textoMensagem = document.createElement("p");
        textoMensagem.textContent = mensagem.texto;
        const horario = document.createElement("small");
        horario.textContent = new Date(mensagem.criadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
        baloon.append(textoMensagem, horario);
        chatMensagens.append(baloon);
    });
    chatMensagens.scrollTop = chatMensagens.scrollHeight;
}

function formatarData(data) {
    if (!data) return "A definir";
    const [ano, mes, dia] = data.split("-");
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function renderPaciente() {
    if (!selectPaciente) return;
    selectPaciente.replaceChildren();
    pacientes.forEach((paciente) => {
        const option = document.createElement("option");
        option.value = paciente.id;
        option.textContent = `${paciente.Animal.Nome} / ${paciente.Cliente.Nome}`;
        selectPaciente.append(option);
    });
    if (!pacientes.length) {
        document.querySelector("#portal-appointment-info").textContent = "A clínica ainda não cadastrou um paciente.";
        return;
    }

    const paciente = pacientes.find((item) => item.id === selectPaciente.value) || pacientes[0];
    selectPaciente.value = paciente.id;
    const atendimento = paciente.Atendimento || {};
    const data = atendimento["Data da consulta"];
    const temConsulta = data && data !== "Não informado";
    const hora = atendimento["Horário"] !== "Não informado" ? atendimento["Horário"] : "";
    document.querySelector("#portal-appointment-date").textContent = formatarData(temConsulta ? data : "");
    document.querySelector("#portal-appointment-info").textContent = temConsulta
        ? `${hora || "Horário a definir"} / ${paciente.Animal.Nome}`
        : "A clínica ainda não informou os detalhes.";
    document.querySelector("#portal-professional").textContent = atendimento.Profissional && atendimento.Profissional !== "Não informado" ? atendimento.Profissional : "A definir";
    document.querySelector("#portal-professional-specialty").textContent = atendimento.Especialidade && atendimento.Especialidade !== "Não informado" ? atendimento.Especialidade : "Equipe PetWise";
    renderMensagens(paciente.id);
}

selectPaciente.addEventListener("change", renderPaciente);
chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const pacienteId = selectPaciente.value;
    const campo = chatForm.elements.mensagem;
    if (!pacienteId || !campo.value.trim()) return;
    const mensagens = lerMensagens();
    mensagens.push({ id: idNovo(), pacienteId, autor: "tutor", texto: campo.value.trim().slice(0, 500), criadoEm: new Date().toISOString() });
    gravarMensagens(mensagens);
    campo.value = "";
    renderPaciente();
});

async function iniciar() {
    pacientes = lerRegistros()
        .filter((paciente) => paciente.Acesso?.email?.toLowerCase() === sessao?.email?.toLowerCase())
        .map((paciente) => ({ ...paciente, id: paciente.id || idNovo() }));
    renderPaciente();
}

iniciar();
