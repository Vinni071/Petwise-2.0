const STORAGE_KEY = "petwise-pacientes";
const LEGACY_KEY = "petwise-cadastro";
const CHAT_KEY = "petwise-mensagens";

if (document.body.dataset.area === "funcionario") {
    window.PetwiseAuth?.proteger("funcionario");
}

const recordGrid = document.querySelector("#record-grid");
const registrationForm = document.querySelector("#registration-form");
const formMessage = document.querySelector("#form-message");
const patientList = document.querySelector("#patient-list");
const patientSearch = document.querySelector("#patient-search");
const emptyPatients = document.querySelector("#empty-patients");
const portalSelect = document.querySelector("#portal-patient-select");
const portalChatMessages = document.querySelector("#portal-chat-messages");
const portalChatForm = document.querySelector("#portal-chat-form");
const staffChatMessages = document.querySelector("#staff-chat-messages");
const staffChatForm = document.querySelector("#staff-chat-form");
const conversationList = document.querySelector("#conversation-list");
const staffChatTitle = document.querySelector("#staff-chat-title");
document.querySelector("#logout-button")?.addEventListener("click", () => window.PetwiseAuth?.sair());

let pacientes = [];
let fichaBase = null;
let portalPacienteId = null;
let staffPacienteId = null;

function lerPacientes() {
    try {
        const registros = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (Array.isArray(registros) && registros.length) {
            return registros.map((paciente) => {
                const copia = { ...paciente, Acesso: { ...(paciente.Acesso || {}) } };
                delete copia.Acesso.senha;
                return copia;
            });
        }

        const legado = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
        return legado ? [{ ...legado, id: gerarId() }] : [];
    } catch (error) {
        console.error("Não foi possível ler os cadastros.", error);
        return [];
    }
}

function salvarPacientes() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pacientes));
    } catch (error) {
        console.error("Não foi possível salvar os cadastros.", error);
        if (formMessage) formMessage.textContent = "Não foi possível salvar. Verifique o espaço disponível no navegador.";
    }
}

function lerMensagens() {
    try {
        const mensagens = JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");
        return Array.isArray(mensagens) ? mensagens : [];
    } catch (error) {
        console.error("Não foi possível ler as mensagens.", error);
        return [];
    }
}

function salvarMensagens(mensagens) {
    try {
        localStorage.setItem(CHAT_KEY, JSON.stringify(mensagens));
    } catch (error) {
        console.error("Não foi possível salvar as mensagens.", error);
    }
}

function formatarData(data) {
    if (!data) return "A definir";
    const [ano, mes, dia] = data.split("-");
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function mensagensDoPaciente(id) {
    return lerMensagens().filter((mensagem) => mensagem.pacienteId === id);
}

function desenharMensagens(elemento, id) {
    if (!elemento) return;
    const mensagens = mensagensDoPaciente(id);
    elemento.replaceChildren();
    if (!mensagens.length) {
        const vazio = document.createElement("p");
        vazio.className = "chat-empty";
        vazio.textContent = "Nenhuma mensagem por aqui ainda.";
        elemento.append(vazio);
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
        elemento.append(baloon);
    });
    elemento.scrollTop = elemento.scrollHeight;
}

function adicionarMensagem(pacienteId, textoMensagem, autor) {
    if (!pacienteId || !textoMensagem.trim()) return;
    const mensagens = lerMensagens();
    mensagens.push({
        id: gerarId(),
        pacienteId,
        autor,
        texto: textoMensagem.trim().slice(0, 500),
        criadoEm: new Date().toISOString()
    });
    salvarMensagens(mensagens);
    desenharMensagens(portalChatMessages, portalPacienteId);
    desenharMensagens(staffChatMessages, staffPacienteId);
    renderConversas();
}

function texto(valor) {
    return typeof valor === "string" && valor.trim() ? valor.trim() : "Não informado";
}

function gerarId() {
    return crypto.randomUUID();
}

function criarFicha(values) {
    return {
        id: gerarId(),
        criadoEm: new Date().toISOString(),
        Cliente: {
            Nome: texto(values.nome),
            CPF: texto(values.cpf),
            Contato: texto(values.contato),
            "E-mail": texto(values.email),
            "Endereço": texto(values.endereco)
        },
        Animal: {
            Nome: texto(values.animalNome),
            "Espécie": texto(values.especie),
            "Raça": texto(values.raca),
            "Data de nascimento": texto(values.dataNascimento),
            Sexo: texto(values.sexo),
            Peso: texto(values.peso),
            Cor: texto(values.cor)
        },
        Acesso: {
            email: texto(values.email)
        },
        Atendimento: {
            "Data da consulta": texto(values.dataConsulta),
            "Horário": texto(values.horaConsulta),
            Profissional: texto(values.profissional),
            Especialidade: texto(values.especialidade),
            "Última consulta": "Não informado",
            "Observações": texto(values.observacoes)
        }
    };
}

function renderFicha(ficha) {
    if (!recordGrid) return;
    const cards = document.createDocumentFragment();

    for (const [groupName, fields] of Object.entries(ficha || {})) {
        if (!["Cliente", "Animal", "Atendimento"].includes(groupName)) continue;

        const card = document.createElement("article");
        card.className = "record-card";
        const heading = document.createElement("h3");
        heading.textContent = groupName === "Cliente" ? "Tutor" : groupName;
        const fieldList = document.createElement("dl");
        fieldList.className = "record-fields";

        for (const [label, value] of Object.entries(fields)) {
            const field = document.createElement("div");
            field.className = "record-field";
            const term = document.createElement("dt");
            term.textContent = label;
            const description = document.createElement("dd");
            description.textContent = texto(value);
            field.append(term, description);
            fieldList.append(field);
        }

        card.append(heading, fieldList);
        cards.append(card);
    }
    recordGrid.replaceChildren(cards);
}

function selecionarPaciente(id) {
    const paciente = pacientes.find((item) => item.id === id);
    if (!paciente) return;
    renderFicha(paciente);
    document.querySelectorAll(".patient-item").forEach((item) => {
        item.classList.toggle("is-active", item.dataset.id === id);
    });
    document.querySelector("#ficha")?.scrollIntoView({ behavior: "smooth" });
}

function renderPacientes() {
    if (!patientList) return;
    const termo = (patientSearch?.value || "").trim().toLocaleLowerCase();
    const filtrados = pacientes.filter((paciente) => {
        const nome = `${texto(paciente.Cliente?.Nome)} ${texto(paciente.Animal?.Nome)}`.toLocaleLowerCase();
        return nome.includes(termo);
    });

    patientList.replaceChildren();
    emptyPatients.hidden = filtrados.length > 0;
    filtrados.forEach((paciente, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "patient-item";
        button.dataset.id = paciente.id;
        const animal = document.createElement("strong");
        const tutor = document.createElement("span");
        animal.textContent = texto(paciente.Animal?.Nome);
        tutor.textContent = texto(paciente.Cliente?.Nome);
        button.append(animal, tutor);
        button.addEventListener("click", () => selecionarPaciente(paciente.id));
        patientList.append(button);
        if (index === 0 && !document.querySelector(".patient-item.is-active")) {
            selecionarPaciente(paciente.id);
        }
    });
    atualizarResumo();
    renderPortal();
    renderConversas();
}

function atualizarResumo() {
    const total = document.querySelector("#total-pacientes");
    const tutores = document.querySelector("#total-tutores");
    if (total) total.textContent = pacientes.length;
    if (tutores) tutores.textContent = new Set(pacientes.map((item) => item.Cliente.Nome)).size;
}

function renderPortal() {
    if (!portalSelect) return;
    portalSelect.replaceChildren();
    pacientes.forEach((paciente) => {
        const option = document.createElement("option");
        option.value = paciente.id;
        option.textContent = `${paciente.Animal.Nome} / ${paciente.Cliente.Nome}`;
        portalSelect.append(option);
    });
    if (!pacientes.length) {
        document.querySelector("#portal-appointment-date").textContent = "A definir";
        document.querySelector("#portal-appointment-info").textContent = "Cadastre um paciente para acompanhar a consulta.";
        return;
    }
    portalPacienteId = pacientes.some((item) => item.id === portalPacienteId) ? portalPacienteId : pacientes[0].id;
    portalSelect.value = portalPacienteId;
    const paciente = pacientes.find((item) => item.id === portalPacienteId);
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
    desenharMensagens(portalChatMessages, portalPacienteId);
}

function renderConversas() {
    if (!conversationList) return;
    conversationList.replaceChildren();
    pacientes.forEach((paciente, index) => {
        const mensagens = mensagensDoPaciente(paciente.id);
        const item = document.createElement("button");
        item.type = "button";
        item.className = `conversation-item ${paciente.id === staffPacienteId ? "is-active" : ""}`;
        const animal = document.createElement("strong");
        const resumo = document.createElement("span");
        animal.textContent = paciente.Animal.Nome;
        resumo.textContent = mensagens.length ? `${mensagens.length} mensagem(ns)` : paciente.Cliente.Nome;
        item.append(animal, resumo);
        item.addEventListener("click", () => selecionarConversa(paciente.id));
        conversationList.append(item);
        if (index === 0 && !staffPacienteId) staffPacienteId = paciente.id;
    });
    if (staffPacienteId) selecionarConversa(staffPacienteId);
}

function selecionarConversa(id) {
    staffPacienteId = id;
    const paciente = pacientes.find((item) => item.id === id);
    if (!paciente) return;
    if (staffChatTitle) staffChatTitle.textContent = `Conversa com ${paciente.Cliente.Nome} / ${paciente.Animal.Nome}`;
    desenharMensagens(staffChatMessages, id);
    document.querySelectorAll(".conversation-item").forEach((item) => {
        item.classList.toggle("is-active", item.querySelector("strong")?.textContent === paciente.Animal.Nome);
    });
}

async function carregarDados() {
    try {
        const resposta = await fetch("../data/ficha.json", { cache: "no-store" });
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        fichaBase = await resposta.json();
    } catch (error) {
        console.error("Não foi possível carregar a ficha base.", error);
        fichaBase = null;
    }

    pacientes = lerPacientes().map((paciente) => ({ ...paciente, id: paciente.id || gerarId() }));
    if (!pacientes.length && fichaBase && fichaBase.Cliente?.Nome !== "Não informado") {
        pacientes = [{ ...fichaBase, id: gerarId() }];
    }
    renderPacientes();
}

registrationForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!registrationForm.reportValidity()) return;
    const valores = Object.fromEntries(new FormData(registrationForm));
    const ficha = criarFicha(valores);
    pacientes.unshift(ficha);
    salvarPacientes();
    await window.PetwiseAuth?.cadastrarTutor(ficha.Acesso.email, valores.senhaTutor, ficha.Cliente.Nome, ficha.id);
    registrationForm.reset();
    if (formMessage) formMessage.textContent = "Paciente cadastrado com sucesso.";
    renderPacientes();
    selecionarPaciente(ficha.id);
});

patientSearch?.addEventListener("input", renderPacientes);
portalSelect?.addEventListener("change", () => {
    portalPacienteId = portalSelect.value;
    renderPortal();
});

portalChatForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const campo = portalChatForm.elements.mensagem;
    adicionarMensagem(portalPacienteId, campo.value, "tutor");
    portalChatForm.reset();
});

staffChatForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const campo = staffChatForm.elements.mensagem;
    adicionarMensagem(staffPacienteId, campo.value, "clinica");
    staffChatForm.reset();
});

const anoAtual = document.querySelector("#current-year");
if (anoAtual) anoAtual.textContent = new Date().getFullYear();
const dataConsulta = document.querySelector('[name="dataConsulta"]');
if (dataConsulta) dataConsulta.min = new Date().toISOString().slice(0, 10);
carregarDados();
