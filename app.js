"use strict";


<!-- Início do Contador de Acessos -->
<div class="contador-container">
  <div class="contador-titulo">Visitantes Universais</div>
  <div id="contador-numero" class="contador-valor">...</div>
</div>

  
  .contador-titulo {
    color: #8b949e;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 5px;
  }
  
  .contador-valor {
    color: #58a6ff; /* Azul neon correspondente ao painel */
    font-size: 32px;
    font-weight: bold;
    font-variant-numeric: tabular-nums;
  }
</style>

<script>
  document.addEventListener("DOMContentLoaded", function() {
    // Configurações extraídas das suas imagens e token
    const endpoint = "https://counterapi.dev";
    const token = "ut_7OaDOgIjI5PEcM4mpLbzs0KPOZg4d771Z6RBAPfB";

    // Executa a chamada para registrar a visita e obter o total
    fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Erro na resposta do servidor");
      }
      return response.json();
    })
    .then(data => {
      // Atualiza o número na tela (o CounterAPI retorna a propriedade 'count')
      document.getElementById("contador-numero").innerText = data.count;
    })
    .catch(error => {
      console.error("Erro ao carregar o contador:", error);
      document.getElementById("contador-numero").innerText = "Erro";
      document.getElementById("contador-numero").style.color = "#f85149"; // Vermelho se falhar
    });
  });
</script>
<!-- Fim do Contador de Acessos -->

/* ---------------- Utilidades ---------------- */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const CHAVE_TEMA = "finantrack-pro-tema";
const PREFIXO_FORM = "finantrack-pro-form";
const MESES_LIMITE = 600;            // 50 anos de projeção no simulador
const PERIODO_LIMITE_JUROS = 1200;   // 100 anos na máquina de juros

function dinheiro(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2
  });
}

function numeroCampoTexto(texto) {
  const limpo = String(texto || "").replace(/[^0-9,.-]/g, "");
  if (!limpo) return 0;
  const v = limpo.lastIndexOf(","), p = limpo.lastIndexOf(".");
  let normalizado = limpo;
  if (v >= 0 && p >= 0) {
    const decimal = Math.max(v, p);
    normalizado = limpo.slice(0, decimal).replace(/[.,]/g, "") + "." + limpo.slice(decimal + 1);
  } else if (v >= 0) {
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else if ((limpo.match(/\./g) || []).length > 1) {
    normalizado = limpo.replace(/\./g, "");
  }
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

function numeroCampo(idOuCampo) {
  const campo = typeof idOuCampo === "string" ? document.getElementById(idOuCampo) : idOuCampo;
  return campo ? numeroCampoTexto(campo.value) : 0;
}

function formatarMoedaPorDigitos(campo) {
  const digitos = String(campo._rawMoeda || "").replace(/\D/g, "");
  campo.value = digitos ? dinheiro(Number(digitos) / 100) : "";
}

function prepararCamposDeMoeda() {
  $$(".moeda").forEach((campo) => {
    if (campo._mascaraMoeda) return;
    campo.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        campo._rawMoeda = String(campo._rawMoeda || "") + e.key;
        formatarMoedaPorDigitos(campo);
        campo.dispatchEvent(new Event("input", { bubbles: true }));
      } else if (e.key === "Backspace") {
        e.preventDefault();
        campo._rawMoeda = String(campo._rawMoeda || "").slice(0, -1);
        formatarMoedaPorDigitos(campo);
        campo.dispatchEvent(new Event("input", { bubbles: true }));
      } else if (e.key === "Delete") {
        e.preventDefault();
        campo._rawMoeda = "";
        formatarMoedaPorDigitos(campo);
        campo.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    campo.addEventListener("paste", (e) => {
      e.preventDefault();
      const texto = e.clipboardData?.getData("text") || "";
      if (!texto.trim()) return;
      const valor = numeroCampoTexto(texto);
      campo._rawMoeda = String(Math.round(valor * 100));
      formatarMoedaPorDigitos(campo);
      campo.dispatchEvent(new Event("input", { bubbles: true }));
    });
    campo.addEventListener("focus", () => {
      if (!campo._rawMoeda && campo.value) campo._rawMoeda = String(Math.round(numeroCampo(campo) * 100));
      campo.setSelectionRange(campo.value.length, campo.value.length);
    });
    campo._mascaraMoeda = true;
  });
}

function numeroCompacto(valor) {
  const abs = Math.abs(valor);
  if (abs >= 1_000_000) {
    return "R$ " + (valor / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mi";
  }
  if (abs >= 1_000) {
    return "R$ " + (valor / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil";
  }
  return dinheiro(valor);
}

function porcentagem(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%";
}

function primeiraMaiuscula(txt) {
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

/** Converte meses em texto amigável: "3 anos e 2 meses". */
function mesesParaTexto(meses) {
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  if (anos === 0) {
    return `${resto} ${resto === 1 ? "mês" : "meses"}`;
  }
  const parteAnos = `${anos} ${anos === 1 ? "ano" : "anos"}`;
  const parteMeses = resto === 0 ? "" : ` e ${resto} ${resto === 1 ? "mês" : "meses"}`;
  return parteAnos + parteMeses;
}

/** Data abreviada (mês/ano) N meses no futuro, ex: "Fev/2027". */
function dataAbreviada(mesesAdiante) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + mesesAdiante);
  const partes = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).formatToParts(d);
  const mes = partes.find((p) => p.type === "month").value.replace(".", "");
  const ano = partes.find((p) => p.type === "year").value;
  return `${primeiraMaiuscula(mes)}/${ano}`;
}

/** Converte taxa anual (%) em taxa efetiva mensal (decimal). */
function taxaMensalEfetiva(taxaAnualPct) {
  return Math.pow(1 + taxaAnualPct / 100, 1 / 12) - 1;
}

/* ---------------- Tema claro / escuro ---------------- */
function aplicarTema(tema, salvar) {
  document.documentElement.setAttribute("data-theme", tema);
  const botao = $("#themeToggle");
  if (botao) {
    botao.textContent = tema === "dark" ? "☀️" : "🌙";
    botao.title = tema === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro";
  }
  if (salvar) {
    try { localStorage.setItem(CHAVE_TEMA, tema); } catch (e) { /* modo privado */ }
  }
  redesenharGraficos();
}

function alternarTema() {
  const atual = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  aplicarTema(atual === "dark" ? "light" : "dark", true);
}

function iniciarTema() {
  let salvo = null;
  try { salvo = localStorage.getItem(CHAVE_TEMA); } catch (e) { /* ignora */ }
  const prefereEscuro = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  aplicarTema(salvo || (prefereEscuro ? "dark" : "light"), false);
}

/* ---------------- Abas ---------------- */
function mostrarAba(nomeAba) {
  $$(".tab-btn").forEach((botao) => {
    botao.setAttribute("aria-selected", String(botao.dataset.tab === nomeAba));
  });
  $$(".panel").forEach((painel) => {
    painel.classList.remove("show");
    painel.hidden = painel.id !== "panel-" + nomeAba;
  });
  const painelAtivo = $("#panel-" + nomeAba);
  if (painelAtivo) {
    painelAtivo.classList.add("show");
  }
  redesenharGraficos();
}
/* ---------------- Persistência dos formulários ---------------- */
function salvarFormulario(ids, chaveSecao) {
  const dados = {};
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) dados[id] = el.value;
  });
  try {
    localStorage.setItem(`${PREFIXO_FORM}:${chaveSecao}`, JSON.stringify(dados));
  } catch (e) { /* ignora */ }
}

function restaurarFormulario(ids, chaveSecao) {
  let dados = null;
  try {
    dados = JSON.parse(localStorage.getItem(`${PREFIXO_FORM}:${chaveSecao}`));
  } catch (e) { /* ignora */ }
  if (!dados || typeof dados !== "object") return;
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el && typeof dados[id] === "string") el.value = dados[id];
  });
}

function limparFormulario(ids, chaveSecao) {
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = "";
    el.classList.remove("invalid");
  });
  try { localStorage.removeItem(`${PREFIXO_FORM}:${chaveSecao}`); } catch (e) { /* ignora */ }
  $$(`[data-hint^="${chaveSecao === "sim" ? "s" : chaveSecao === "guard" ? "g" : "j"}"]`)
    .forEach((span) => { span.textContent = ""; });
}

/* ---------------- Dicas de formatação em tempo real ---------------- */
function atualizarDicas(idsDinheiro) {
  idsDinheiro.forEach((id) => {
    const campo = document.getElementById(id);
    const dica = document.querySelector(`[data-hint="${id}"]`);
    if (!campo || !dica) return;
    const num = numeroCampo(campo);
    dica.textContent = campo.value !== "" && !isNaN(num)
      ? `≈ ${dinheiro(num)}`
      : "";
  });
}

/* ---------------- Validação inline ---------------- */
const TIPOS_VALIDACAO = {
  dinheiroPos: { teste: (n) => !isNaN(n) && n > 0, msg: "deve ser maior que zero" },
  dinheiro:    { teste: (n) => !isNaN(n) && n >= 0, msg: "deve ser zero ou positivo" },
  taxa:        { teste: (n) => !isNaN(n) && n >= 0, msg: "deve ser zero ou positivo" },
  inteiroPos:  { teste: (n) => Number.isInteger(n) && n > 0, msg: "deve ser um número inteiro maior que zero" }
};

/**
 * specs: [{ id, rotulo, tipo }] — retorna lista de mensagens de erro
 * e marca visualmente os campos inválidos.
 */
function validarCampos(specs) {
  const erros = [];
  let primeiroInvalido = null;

  specs.forEach(({ id, rotulo, tipo }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("invalid");

    const texto = el.value.trim();
    const regra = TIPOS_VALIDACAO[tipo];

    const valorNumerico = numeroCampo(el);
    if (texto === "" || !Number.isFinite(valorNumerico) || !regra.teste(valorNumerico)) {
      el.classList.add("invalid");
      erros.push(`<b>${rotulo}</b> ${regra.msg}`);
      if (!primeiroInvalido) primeiroInvalido = el;
    }
  });

  if (primeiroInvalido) primeiroInvalido.focus();
  return erros;
}

function exibirErros(containerId, erros) {
  const caixa = $(containerId);
  if (!caixa) return true;
  if (erros.length === 0) {
    caixa.hidden = true;
    caixa.innerHTML = "";
    return true;
  }
  caixa.hidden = false;
  caixa.innerHTML = ["⚠️ " + erros[0], ...erros.slice(1).map((e) => "• " + e)].join("<br>");
  return false;
}

/* ============================================================
   MOTOR DE CÁLCULO
   ============================================================ */

function simularMeta(cfg) {
  const i = taxaMensalEfetiva(cfg.taxaAnual);
  const pontos = [];

  pontos.push({ mes: 0, saldo: cfg.inicial, investido: cfg.inicial });

  if (cfg.inicial >= cfg.meta) {
    return {
      concluido: true, mesesTotais: 0, pontos,
      investidoFinal: cfg.inicial, saldoFinal: cfg.inicial
    };
  }

  let saldo = cfg.inicial;
  let investido = cfg.inicial;
  let meses = 0;

  while (saldo < cfg.meta && meses < MESES_LIMITE) {
    saldo *= (1 + i);
    saldo += cfg.aporteMensal;
    investido += cfg.aporteMensal;
    meses++;

    if (meses % 12 === 0 && cfg.extraAnual > 0) {
      saldo += cfg.extraAnual;
      investido += cfg.extraAnual;
    }

    pontos.push({ mes: meses, saldo, investido });
  }

  return {
    concluido: saldo >= cfg.meta,
    mesesTotais: meses,
    pontos,
    investidoFinal: investido,
    saldoFinal: saldo
  };
}

/** Aporte mensal necessário para atingir a meta em N meses (série uniforme). */
function aporteNecessario(meta, inicial, taxaAnual, meses) {
  if (inicial >= meta) return 0;
  if (meses <= 0) return NaN;
  const i = taxaMensalEfetiva(taxaAnual);
  if (i === 0) return (meta - inicial) / meses;
  const k = Math.pow(1 + i, meses);
  return ((meta - inicial * k) * i) / (k - 1);
}

function projetarJuros(inicial, aporteMensal, taxaAnual, mesesLimite) {
  const i = taxaMensalEfetiva(taxaAnual);
  const pontos = [{ mes: 0, saldo: inicial, investido: inicial }];
  let saldo = inicial;
  let investido = inicial;

  for (let mes = 1; mes <= mesesLimite; mes++) {
    saldo *= (1 + i);
    saldo += aporteMensal;
    investido += aporteMensal;
    pontos.push({ mes, saldo, investido });
  }

  return { pontos, saldoFinal: saldo, investidoFinal: investido };
}

const modelosGraficos = {}; // id do canvas -> modelo

function cssVar(nome) {
  const estilos = getComputedStyle(document.documentElement);
  return estilos.getPropertyValue(nome).trim();
}

/** Arredonda o máximo do eixo Y para um número "bonito". */
function maximoBonito(valor) {
  if (!isFinite(valor) || valor <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(valor)));
  const f = valor / exp;
  const fator = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return fator * exp;
}

function passoEixoX(mesesMaximos) {
  const candidatos = [1, 2, 3, 6, 12, 24, 36, 60, 120];
  for (const passo of candidatos) {
    if (Math.ceil(mesesMaximos / passo) <= 10) return passo;
  }
  return 120;
}

function rotuloEixoX(mes, passo) {
  if (mes === 0) return "Hoje";
  if (passo >= 12) return `${Math.round(mes / 12)}a`;
  return `${mes}m`;
}

function desenharGrafico(canvas, modelo) {
  if (!canvas) return;

  const largura = canvas.clientWidth;
  const altura = canvas.clientHeight || 300;
  if (largura === 0 || altura === 0) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(largura * dpr);
  canvas.height = Math.round(altura * dpr);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, largura, altura);

  canvas._modelo = modelo;

  const corTexto = cssVar("--muted") || "#888";
  const corLinha = cssVar("--border") || "#ddd";

  if (!modelo || !modelo.series.length || !modelo.mesMaximo) {
    modelosGraficos[canvas.id] = null;
    ctx.fillStyle = corTexto;
    ctx.font = "14px " + cssVar("--font");
    ctx.textAlign = "center";
    ctx.fillText("Sem dados para exibir", largura / 2, altura / 2);
    return;
  }

  modelosGraficos[canvas.id] = modelo;

  const padEsq = 62, padDir = 16, padTop = 14, padBase = 32;
  const wInt = largura - padEsq - padDir;
  const hInt = altura - padTop - padBase;

  const maxSerie = Math.max(
    ...modelo.series.flatMap((s) => s.pontos.map((p) => p[1])),
    modelo.meta || 0
  );
  const yMax = maximoBonito(Math.max(maxSerie, 1) * 1.06);
  const mesMax = Math.max(modelo.mesMaximo, 1);

  const X = (mes) => padEsq + (mes / mesMax) * wInt;
  const Y = (v) => padTop + hInt - (Math.min(v, yMax) / yMax) * hInt;

  /* --- grade horizontal + rótulos Y --- */
  ctx.font = "11px " + cssVar("--font");
  for (let g = 0; g <= 5; g++) {
    const v = (yMax / 5) * g;
    const y = Y(v);
    ctx.strokeStyle = corLinha;
    ctx.lineWidth = g === 0 ? 1.5 : 1;
    ctx.globalAlpha = g === 0 ? 1 : .55;
    ctx.beginPath();
    ctx.moveTo(padEsq, y);
    ctx.lineTo(largura - padDir, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = corTexto;
    ctx.textAlign = "right";
    ctx.fillText(numeroCompacto(v), padEsq - 8, y + 4);
  }

  /* --- marcas do eixo X --- */
  const passo = passoEixoX(mesMax);
  ctx.textAlign = "center";
  for (let m = 0; m <= mesMax; m += passo) {
    const x = X(m);
    ctx.strokeStyle = corLinha;
    ctx.globalAlpha = .35;
    ctx.beginPath();
    ctx.moveTo(x, padTop);
    ctx.lineTo(x, padTop + hInt);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = corTexto;
    ctx.fillText(rotuloEixoX(m, passo), x, altura - 10);
  }

  /* --- linha da meta --- */
  if (modelo.meta && modelo.meta > 0) {
    const y = Y(modelo.meta);
    ctx.save();
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = cssVar("--warn") || "#d97706";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(padEsq, y);
    ctx.lineTo(largura - padDir, y);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = cssVar("--warn") || "#d97706";
    ctx.textAlign = "right";
    ctx.font = "bold 11px " + cssVar("--font");
    ctx.fillText("Meta: " + numeroCompacto(modelo.meta), largura - padDir - 4, y - 6);
  }

  /* --- séries --- */
  modelo.series.forEach((serie) => {
    if (serie.preencher) {
      const grad = ctx.createLinearGradient(0, padTop, 0, padTop + hInt);
      grad.addColorStop(0, serie.cor + "55");
      grad.addColorStop(1, serie.cor + "00");
      ctx.beginPath();
      serie.pontos.forEach((p, idx) => {
        idx === 0 ? ctx.moveTo(X(p[0]), Y(p[1])) : ctx.lineTo(X(p[0]), Y(p[1]));
      });
      const ultimo = serie.pontos[serie.pontos.length - 1];
      ctx.lineTo(X(ultimo[0]), Y(0));
      ctx.lineTo(X(serie.pontos[0][0]), Y(0));
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.beginPath();
    serie.pontos.forEach((p, idx) => {
      idx === 0 ? ctx.moveTo(X(p[0]), Y(p[1])) : ctx.lineTo(X(p[0]), Y(p[1]));
    });
    ctx.strokeStyle = serie.cor;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  });

  /* --- tooltip (hover do mouse / toque) --- */
  const hover = modelo.hover;
  if (hover && hover.mes !== undefined) {
    const m = hover.mes;
    const cx = X(m);

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = corTexto;
    ctx.globalAlpha = .65;
    ctx.beginPath();
    ctx.moveTo(cx, padTop);
    ctx.lineTo(cx, padTop + hInt);
    ctx.stroke();
    ctx.restore();

    modelo.series.forEach((serie) => {
      const v = serie.mapa.get(m);
      if (v === undefined) return;
      ctx.beginPath();
      ctx.arc(cx, Y(v), 4.5, 0, Math.PI * 2);
      ctx.fillStyle = serie.cor;
      ctx.fill();
      ctx.strokeStyle = cssVar("--card");
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    const linhas = [modelo.noMes(m)];
    modelo.series.forEach((s) =>
      linhas.push(`${s.nome}: ${dinheiro(s.mapa.get(m) ?? 0)}`)
    );
    if (modelo.extras) modelo.extras(m).forEach((t) => linhas.push(t));

    ctx.font = "12px " + cssVar("--font");
    const caixaW = Math.max(...linhas.map((l) => ctx.measureText(l).width)) + 24;
    const caixaH = linhas.length * 18 + 14;
    let bx = cx + 12;
    if (bx + caixaW > largura - 6) bx = cx - caixaW - 12;
    const by = padTop + 8;

    ctx.fillStyle = cssVar("--card");
    ctx.strokeStyle = corLinha;
    ctx.lineWidth = 1;
    ctx.shadowColor = "rgba(0,0,0,.25)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(bx, by, caixaW, caixaH, 9);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();

    linhas.forEach((linha, idx) => {
      ctx.fillStyle = idx === 1 ? modelo.series[0].cor
                    : idx === 0 ? cssVar("--text") : corTexto;
      ctx.font = idx === 0 ? "bold 12px " + cssVar("--font")
                            : "12px " + cssVar("--font");
      ctx.textAlign = "left";
      ctx.fillText(linha, bx + 12, by + 20 + idx * 18);
    });
  }

  canvas._mapeamento = { padEsq, wInt, mesMax };
}

/** Liga os eventos de hover/toque em um canvas criado dinamicamente. */
function ativarTooltip(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || canvas._tooltipAtivo) return;

  const aoMover = (e) => {
    const mapeamento = canvas._mapeamento;
    const modelo = modelosGraficos[canvas.id];
    if (!mapeamento || !modelo) return;

    const retangulo = canvas.getBoundingClientRect();
    const xRel = e.clientX - retangulo.left;
    const fracao = Math.min(Math.max((xRel - mapeamento.padEsq) / mapeamento.wInt, 0), 1);
    const mes = Math.round(fracao * mapeamento.mesMax);

    desenharGrafico(canvas, { ...modelo, hover: { mes } });
  };

  const aoSair = () => {
    const modelo = modelosGraficos[canvas.id];
    if (!modelo) return;
    desenharGrafico(canvas, { ...modelo, hover: null });
  };

  canvas.addEventListener("pointermove", aoMover);
  canvas.addEventListener("pointerleave", aoSair);
  canvas._tooltipAtivo = true;
}

/** Redesenha todos os gráficos com dados salvos (troca de tema/resize/aba). */
function redesenharGraficos() {
  Object.keys(modelosGraficos).forEach((id) => {
    const modelo = modelosGraficos[id];
    if (modelo) desenharGrafico(document.getElementById(id), modelo);
  });
}

let temporizadorResize = null;
window.addEventListener("resize", () => {
  clearTimeout(temporizadorResize);
  temporizadorResize = setTimeout(redesenharGraficos, 150);
});

function cardEstatistica(rotulo, valor, classeExtra) {
  return `<div class="stat ${classeExtra || ""}">
            <span class="rotulo">${rotulo}</span><b>${valor}</b>
          </div>`;
}

function montarMapas(pontos) {
  return {
    saldo: new Map(pontos.map((p) => [p.mes, p.saldo])),
    investido: new Map(pontos.map((p) => [p.mes, p.investido]))
  };
}

/** Colunas/linhas -> HTML da tabela de evolução anual. */
function tabelaHTML(colunas, matriz, destacarUltimaLinha) {
  const head = colunas.map((c) => `<th class="${c.num ? "num" : ""}">${c.rotulo}</th>`).join("");
  const corpo = matriz.map((linha, idx) => {
    const classeExtra = destacarUltimaLinha && idx === matriz.length - 1 ? ' class="fim"' : "";
    const celulas = linha.map((celula, cIdx) =>
      `<td${colunas[cIdx].num ? ' class="num"' : ""}>${celula}</td>`
    ).join("");
    return `<tr${classeExtra}>${celulas}</tr>`;
  }).join("");
  return `<div class="table-wrap"><table>
            <thead><tr>${head}</tr></thead>
            <tbody>${corpo}</tbody>
          </table></div>`;
}

/* ---------- Exportação CSV ---------- */
const armarioCSV = {}; // chave -> { titulo, linhas }

function registrarCSV(chave, titulo, linhas) {
  armarioCSV[chave] = { titulo, linhas };
}

function numeroParaExcel(valor) {
  return Number(valor).toFixed(2).replace(".", ",");
}

function gerarDownloadCSV(chave) {
  const pacote = armarioCSV[chave];
  if (!pacote) return;
  const conteudo = "\uFEFF" +
    pacote.titulo + "\r\n\r\n" +
    pacote.linhas.map((linha) => linha.join(";")).join("\r\n");

  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "finantrack-" + chave + ".csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function linhasMensaisParaCSV(pontos) {
  return [
    ["Meses", "Data", "Patrimonio", "Total investido", "Juros acumulados"],
    ["0", "-", numeroParaExcel(pontos[0].saldo), numeroParaExcel(pontos[0].investido), "0"],
    ...pontos.slice(1).map((p) => [
      p.mes,
      dataAbreviada(p.mes),
      numeroParaExcel(p.saldo),
      numeroParaExcel(p.investido),
      numeroParaExcel(p.saldo - p.investido)
    ])
  ];
}

function blocosDeMeses(pontos) {
  /* -> [{ ano, mes }] nos múltiplos de 12, mais o mês final caso não feche ano */
  const mesFinal = pontos[pontos.length - 1].mes;
  const marcados = [];
  for (let m = 12; m <= mesFinal; m += 12) marcados.push(m);
  if (mesFinal % 12 !== 0 || mesFinal === 0) marcados.push(mesFinal);

  const porMes = new Map(pontos.map((p) => [p.mes, p]));
  return [...new Set(marcados)].filter((m) => porMes.has(m)).sort((a, b) => a - b)
    .map((m) => ({ ano: Math.ceil(m / 12), mes: m, ...porMes.get(m) }));
}

function calcularSimulador() {
  const valido = exibirErros("#simErr", validarCampos([
    { id: "sMeta",   rotulo: "Meta a alcançar", tipo: "dinheiroPos" },
    { id: "sSaldo",  rotulo: "Valor atual",     tipo: "dinheiro" },
    { id: "sAporte", rotulo: "Aporte mensal",   tipo: "dinheiro" },
    { id: "sExtra",  rotulo: "Aporte extra",    tipo: "dinheiro" },
    { id: "sTaxa",   rotulo: "Rentabilidade",   tipo: "taxa" },
    { id: "sInfla",  rotulo: "Inflação",        tipo: "taxa" }
  ]));
  if (!valido) return;

  const inicial = numeroCampo("sSaldo");
  const meta = numeroCampo("sMeta");
  const aporte = numeroCampo("sAporte");
  const extra = numeroCampo("sExtra");
  const taxa = Number($("#sTaxa").value || 0);
  const inflacao = Number($("#sInfla").value || 0);
  const nome = ($("#sNome").value || "").trim() || "Seu objetivo";

  salvarFormulario(["sNome", "sSaldo", "sMeta", "sAporte", "sExtra", "sTaxa", "sInfla"], "metas");

  const r = simularMeta({ inicial, meta, aporteMensal: aporte, extraAnual: extra, taxaAnual: taxa });

  /* ---- Caso especial: meta já alcançada ---- */
  if (r.mesesTotais === 0 && r.concluido) {
    $("#resSim").innerHTML = `
      <section class="card secao-resultado">
        <h3>🎉 Parabéns, você já conquistou esta meta!</h3>
        <p>Você já possui <strong>${dinheiro(inicial)}</strong>, o que supera a meta de
           <strong>${dinheiro(meta)}</strong>. Que tal cadastrar um novo objetivo?</p>
      </section>`;
    modelosGraficos["chartSim"] = null;
    return;
  }

  /* ---- Estatísticas principais ---- */
  const jurosGanhos = r.saldoFinal - r.investidoFinal;
  const percJuros = r.investidoFinal > 0 ? (jurosGanhos / r.investidoFinal) * 100 : 0;
  const dataPrevista = dataAbreviada(r.mesesTotais);
  const inicioBarra = Math.min((inicial / meta) * 100, 100);

  const notaInflacao = inflacao > 0 && r.concluido
    ? cardEstatistica("Poder de compra de hoje", dinheiro(
        r.saldoFinal / Math.pow(1 + inflacao / 100, r.mesesTotais / 12)), "warn")
    : "";

  const avisoNaoConcluida = !r.concluido ? `
    <div class="error-msg" style="margin:0 0 16px;">
      ⏳ Com estes valores a meta <b>não seria atingida em ${MESES_LIMITE / 12} anos</b>.
      O gráfico mostra o que aconteceria nesse período.
      <br>Dica: para conquistar ${dinheiro(meta)} em <b>10 anos</b>, você precisaria aportar cerca de
      <b>${dinheiro(aporteNecessario(meta, inicial, taxa, 120))} por mês</b>.
    </div>` : "";

  /* ---- Marcos da trajetória ---- */
  const MARCOS = [
    { fracao: .25, emoji: "🥉", texto: "25% da meta" },
    { fracao: .50, emoji: "🥈", texto: "Metade da meta" },
    { fracao: .75, emoji: "🥇", texto: "75% da meta" },
    { fracao: 1.0, emoji: "🏆", texto: "🎉 Meta conquistada!" }
  ];

  const itensMarcos = MARCOS
    .filter(({ fracao }) => fracao !== 1 || r.concluido)
    .map(({ fracao, emoji, texto }) => {
      const alvo = meta * fracao;
      const ponto = r.pontos.find((p) => p.mes > 0 && p.saldo >= alvo);
      if (!ponto) return "";
      return `<li class="concluido" data-emoji="${emoji}">
                <b>${texto}</b> — ${dinheiro(ponto.saldo)} no mês ${ponto.mes}
                (${dataAbreviada(ponto.mes)})
              </li>`;
    }).join("");

  /* ---- Tabela ano a ano ---- */
  const blocos = blocosDeMeses(r.pontos);
  const linhasTabela = blocos.map((b) => [
    b.mes % 12 === 0 ? `Ano ${b.ano}` : "Parcial",
    dataAbreviada(b.mes),
    dinheiro(b.saldo),
    dinheiro(b.investido),
    dinheiro(b.saldo - b.investido),
    Math.min((b.saldo / meta) * 100, 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%"
  ]);

  registrarCSV("metas-mensal",
    `FinanTrack Pro - Trajetoria: ${nome}`,
    [["Objetivo", nome], ["Meta", numeroParaExcel(meta)], ["Rentabilidade anual (%)", numeroParaExcel(taxa)], [],
     ...linhasMensaisParaCSV(r.pontos)]);

  /* ---- Montagem do HTML ---- */
  $("#resSim").innerHTML = `
    <section class="card secao-resultado">
      <h3>🧭 Sua trajetória até "${nome}"</h3>
      ${avisoNaoConcluida}

      <div class="stats">
        ${r.concluido ? cardEstatistica("Tempo estimado", mesesParaTexto(r.mesesTotais), "ok")
                      : cardEstatistica("Horizonte simulado", `${MESES_LIMITE / 12} anos`, "warn")}
        ${r.concluido ? cardEstatistica("Data provável", dataPrevista, "info") : ""}
        ${cardEstatistica("Total que você terá investido", dinheiro(r.investidoFinal))}
        ${jurosGanhos >= 0 ? cardEstatistica("Juros acumulados", dinheiro(jurosGanhos), "ok")
                           : cardEstatistica("Juros acumulados", dinheiro(jurosGanhos), "warn")}
        ${notaInflacao}
      </div>

      ${r.concluido ? `<div class="stats">
          <div class="stat destaque ok">
            <span class="rotulo">Patrimônio final estimado · juros = ${porcentagem(percJuros)} do total</span>
            <b>${dinheiro(r.saldoFinal)}</b>
          </div>
        </div>` : ""}

      <div class="progresso-info">
        <span>Hoje: ${dinheiro(inicial)}</span>
        <span>Meta: ${dinheiro(meta)}</span>
      </div>
      <div class="progresso">
        <div class="barra" style="width:${Math.max(inicioBarra, 2).toFixed(1)}%"></div>
      </div>

      ${itensMarcos ? `<h3 style="margin-top:22px;">📍 Marcos da jornada</h3>
                       <ul class="marcos">${itensMarcos}</ul>` : ""}

      <h3 style="margin-top:24px;">📊 Evolução do patrimônio</h3>
      <div class="chart-box">
        <div class="legenda" style="--accent:#2563eb;">
          <span style="color:#2563eb;">Patrimônio</span>
          <span style="color:#8b5cf6;">Somente depósitos</span>
          <span style="color:#d97706;">Meta</span>
        </div>
        <canvas id="chartSim" class="grafico" role="img"
                aria-label="Gráfico de crescimento do patrimônio ao longo dos meses"></canvas>
      </div>

      <h3 style="margin-top:24px;">🗓️ Ano a ano</h3>
      ${tabelaHTML([
        { rotulo: "Período" }, { rotulo: "Até" }, { rotulo: "Saldo projetado", num: true },
        { rotulo: "Investido", num: true }, { rotulo: "Juros acum.", num: true },
        { rotulo: "% da meta", num: true }
      ], linhasTabela, true)}

      <div class="actions-row">
        <button type="button" class="btn btn-primary btn-mini js-export" data-csv="metas-mensal">⬇️ Baixar CSV (detalhado)</button>
        <button type="button" class="btn btn-ghost btn-mini js-print">🖨️ Imprimir / salvar PDF</button> 
        <button type="button" class="btn btn-ghost btn-mini" id="btnAbrirPlanejamentoResultado">📋 Acompanhar planejamento</button>
      </div>

      <p class="hint" style="margin-top:14px;">
        * Simulação matemática — rentabilidade real pode variar; não considera impostos ou custos.
      </p>
    </section>`;

  requestAnimationFrame(() => {
    const mapas = montarMapas(r.pontos);
    desenharGrafico($("#chartSim"), {
      series: [
        { nome: "Patrimônio", cor: "#2563eb", preencher: true,
          pontos: r.pontos.map((p) => [p.mes, p.saldo]), mapa: mapas.saldo },
        { nome: "Depósitos", cor: "#8b5cf6",
          pontos: r.pontos.map((p) => [p.mes, p.investido]), mapa: mapas.investido }
      ],
      mesMaximo: r.pontos[r.pontos.length - 1].mes,
      meta: r.concluido ? meta : null,
      noMes: (mes) => `Mês ${mes} · ${dataAbreviada(mes)}`,
      extras: (mes) => [`Juros já ganhos: ${dinheiro(mapas.saldo.get(mes) - mapas.investido.get(mes))}`]
    });
    ativarTooltip("chartSim");
  });
}

function calcularQuantoGuardar() {
  const valido = exibirErros("#guardErr", validarCampos([
    { id: "gMeta",  rotulo: "Valor da meta",   tipo: "dinheiroPos" },
    { id: "gSaldo", rotulo: "Saldo atual",     tipo: "dinheiro" },
    { id: "gPrazo", rotulo: "Prazo",           tipo: "inteiroPos" },
    { id: "gTaxa",  rotulo: "Rentabilidade",   tipo: "taxa" }
  ]));
  if (!valido) return;

  const meta = numeroCampo("gMeta");
  const inicial = numeroCampo("gSaldo");
  const prazoBruto = Number($("#gPrazo").value || 0);
  const unidade = $("#gUnidade").value;
  const taxa = Number($("#gTaxa").value || 0);

  salvarFormulario(["gMeta", "gSaldo", "gPrazo", "gUnidade", "gTaxa"], "guardar");

  if (inicial >= meta) {
    $("#resGuard").innerHTML = `
      <section class="card secao-resultado">
        <h3>🎉 Você já alcançou essa meta!</h3>
        <p>Seu saldo de <strong>${dinheiro(inicial)}</strong> já é suficiente.
           Sugestão: aumente o valor da meta.</p>
      </section>`;
    modelosGraficos["chartGuard"] = null;
    return;
  }

  const meses = unidade === "a" ? prazoBruto * 12 : prazoBruto;
  if (meses > MESES_LIMITE) {
    exibirErros("#guardErr", ["Escolha um prazo de até " + (MESES_LIMITE / 12) + " anos."]);
    return;
  }

  const aporte = aporteNecessario(meta, inicial, taxa, meses);
  const r = projetarJuros(inicial, aporte, taxa, meses);
  const totalAportado = inicial + aporte * meses;
  const jurosGanhos = meta - totalAportado;

  registrarCSV("quanto-guardar",
    `FinanTrack Pro - Aporte necessario (${meses} meses)`,
    [["Meta", numeroParaExcel(meta)], ["Prazo (meses)", meses],
     ["Rentabilidade anual (%)", numeroParaExcel(taxa)],
     ["Aporte mensal necessario", numeroParaExcel(aporte)],
     [], ...linhasMensaisParaCSV(r.pontos)]);

  $("#resGuard").innerHTML = `
    <section class="card secao-resultado">
      <h3>🎯 Plano para conquistar ${dinheiro(meta)} em ${mesesParaTexto(meses)}</h3>

      <div class="stats">
        <div class="stat destaque ok">
          <span class="rotulo">Aporte mensal necessário</span>
          <b>${dinheiro(aporte)}</b>
        </div>
      </div>

      <div class="stats">
        ${cardEstatistica("Rentabilidade usada", porcentagem(taxa) + " ao ano", "info")}
        ${cardEstatistica("Você aportaria no total", dinheiro(totalAportado))}
        ${jurosGanhos >= 0 ? cardEstatistica("Parte que virá dos juros", dinheiro(jurosGanhos), "ok")
                           : cardEstatistica("Faltariam juros (aumente o prazo)", dinheiro(jurosGanhos), "warn")}
        ${cardEstatistica("Conquista prevista", dataAbreviada(meses), "")}
      </div>

      <div class="chart-box">
        <div class="legenda">
          <span style="color:#2563eb;">Patrimônio</span>
          <span style="color:#8b5cf6;">Depósitos acumulados</span>
          <span style="color:#d97706;">Meta</span>
        </div>
        <canvas id="chartGuard" class="grafico" role="img"
                aria-label="Gráfico do plano para atingir a meta no prazo escolhido"></canvas>
      </div>

      <div class="actions-row">
        <button type="button" class="btn btn-primary btn-mini js-export" data-csv="quanto-guardar">⬇️ Baixar CSV</button>
        <button type="button" class="btn btn-ghost btn-mini js-print">🖨️ Imprimir</button>
      </div>

      <p class="hint" style="margin-top:14px;">
        * Cálculo pela fórmula da série uniforme; aportes no fim de cada mês.
      </p>
    </section>`;

  requestAnimationFrame(() => {
    const mapas = montarMapas(r.pontos);
    desenharGrafico($("#chartGuard"), {
      series: [
        { nome: "Patrimônio", cor: "#2563eb", preencher: true,
          pontos: r.pontos.map((p) => [p.mes, p.saldo]), mapa: mapas.saldo },
        { nome: "Depósitos", cor: "#8b5cf6",
          pontos: r.pontos.map((p) => [p.mes, p.investido]), mapa: mapas.investido }
      ],
      mesMaximo: meses,
      meta,
      noMes: (mes) => `Mês ${mes} · ${dataAbreviada(mes)}`
    });
    ativarTooltip("chartGuard");
  });
}

function calcularJuros() {
  const valido = exibirErros("#jurosErr", validarCampos([
    { id: "jInicial", rotulo: "Valor inicial", tipo: "dinheiro" },
    { id: "jAporte",  rotulo: "Aporte mensal", tipo: "dinheiro" },
    { id: "jTaxa",    rotulo: "Rentabilidade", tipo: "taxa" },
    { id: "jPeriodo", rotulo: "Período",       tipo: "inteiroPos" }
  ]));
  if (!valido) return;

  const inicial = numeroCampo("jInicial");
  const aporte = numeroCampo("jAporte");
  const taxa = Number($("#jTaxa").value || 0);
  const periodoBruto = Number($("#jPeriodo").value || 0);
  const unidade = $("#jUnidade").value;

  salvarFormulario(["jInicial", "jAporte", "jTaxa", "jPeriodo", "jUnidade"], "juros");

  const meses = unidade === "a" ? periodoBruto * 12 : periodoBruto;
  if (meses > PERIODO_LIMITE_JUROS) {
    exibirErros("#jurosErr", ["Projetar no máximo 100 anos."]);
    return;
  }

  function multiplicadorNoMes(bloco) {
    return bloco.investido > 0 ? bloco.saldo / bloco.investido : 0;
  }

  const r = projetarJuros(inicial, aporte, taxa, meses);
  const jurosGanhos = r.saldoFinal - r.investidoFinal;
  const multiplicador = r.investidoFinal > 0 ? r.saldoFinal / r.investidoFinal : 0;
  const fmtX = (n) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "×";

  const linhasTabela = blocosDeMeses(r.pontos).map((b) => [
    b.mes % 12 === 0 ? `Ano ${b.ano}` : "Parcial",
    dataAbreviada(b.mes),
    dinheiro(b.saldo),
    dinheiro(b.investido),
    dinheiro(b.saldo - b.investido),
    fmtX(multiplicadorNoMes(b))
  ]);

  registrarCSV("juros-compostos",
    `FinanTrack Pro - Projecao de ${meses} meses`,
    [["Valor inicial", numeroParaExcel(inicial)], ["Aporte mensal", numeroParaExcel(aporte)],
     ["Rentabilidade anual (%)", numeroParaExcel(taxa)], [],
     ...linhasMensaisParaCSV(r.pontos)]);

  $("#resJuros").innerHTML = `
    <section class="card secao-resultado">
      <h3>🚀 Em ${mesesParaTexto(meses)}, seu dinheiro vira…</h3>

      <div class="stats">
        <div class="stat destaque ok">
          <span class="rotulo">Montante final projetado</span>
          <b>${dinheiro(r.saldoFinal)}</b>
        </div>
      </div>

      <div class="stats">
        ${cardEstatistica("Total investido (com o valor inicial)", dinheiro(r.investidoFinal))}
        ${cardEstatistica("Juros ganhos no período", dinheiro(jurosGanhos), "ok")}
        ${cardEstatistica("Multiplicador do patrimônio", fmtX(multiplicador), "info")}
        ${cardEstatistica("Rendimento efetivo/mês", porcentagem(taxaMensalEfetiva(taxa) * 100), "warn")}
      </div>

      <div class="chart-box">
        <div class="legenda">
          <span style="color:#2563eb;">Montante</span>
          <span style="color:#8b5cf6;">Somente depósitos</span>
        </div>
        <canvas id="chartJuros" class="grafico" role="img"
                aria-label="Gráfico da projeção de juros compostos"></canvas>
      </div>

      <h3 style="margin-top:24px;">🗓️ Ano a ano</h3>
      ${tabelaHTML([
        { rotulo: "Período" }, { rotulo: "Até" }, { rotulo: "Montante", num: true },
        { rotulo: "Investido", num: true }, { rotulo: "Juros acum.", num: true },
        { rotulo: "Multiplicador", num: true }
      ], linhasTabela, true)}

      <div class="actions-row">
        <button type="button" class="btn btn-primary btn-mini js-export" data-csv="juros-compostos">⬇️ Baixar CSV</button>
        <button type="button" class="btn btn-ghost btn-mini js-print">🖨️ Imprimir</button>
      </div>
    </section>`;

  requestAnimationFrame(() => {
    const mapas = montarMapas(r.pontos);
    desenharGrafico($("#chartJuros"), {
      series: [
        { nome: "Montante", cor: "#2563eb", preencher: true,
          pontos: r.pontos.map((p) => [p.mes, p.saldo]), mapa: mapas.saldo },
        { nome: "Depósitos", cor: "#8b5cf6",
          pontos: r.pontos.map((p) => [p.mes, p.investido]), mapa: mapas.investido }
      ],
      mesMaximo: meses,
      meta: null,
      noMes: (mes) => `Mês ${mes} · ${dataAbreviada(mes)}`,
      extras: (mes) =>
        [`Multiplicador: ${fmtX(multiplicadorNoMes({ saldo: mapas.saldo.get(mes), investido: mapas.investido.get(mes) }))}`]
    });
    ativarTooltip("chartJuros");
  });
}


/* ---------------- Acompanhamento do planejamento ---------------- */
const CHAVE_PLANEJAMENTO = "unifinance-pro-planejamento";

function obterPlanejamentoSalvo() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_PLANEJAMENTO) || "[]");
    return Array.isArray(dados) ? dados : [];
  } catch (e) { return []; }
}

function salvarPlanejamento(dados) {
  try { localStorage.setItem(CHAVE_PLANEJAMENTO, JSON.stringify(dados)); } catch (e) { /* modo privado */ }
}

function gerarLinhasPlanejamento() {
  const meta = numeroCampo("sMeta");
  const inicial = numeroCampo("sSaldo");
  const aporte = numeroCampo("sAporte");
  const extra = numeroCampo("sExtra");
  const taxa = Number($("#sTaxa")?.value || 0);
  if (!(meta > 0)) return [];

  const i = taxaMensalEfetiva(taxa);
  let saldo = inicial;
  const linhas = [];
  for (let mes = 1; mes <= MESES_LIMITE && saldo < meta; mes++) {
    saldo *= (1 + i);
    saldo += aporte;
    if (mes % 12 === 0 && extra > 0) saldo += extra;
    linhas.push({ mes, data: dataAbreviada(mes), planejado: Math.min(saldo, meta), realizado: "", observacao: "", concluido: false });
  }
  return linhas;
}

function atualizarResumoPlanejamento() {
  const resumo = $("#planejamentoResumo");
  if (!resumo) return;
  const dados = obterPlanejamentoSalvo();
  const meta = numeroCampo("sMeta");
  const concluidos = dados.filter((x) => x.concluido).length;
  resumo.textContent = dados.length
    ? `Meta: ${dinheiro(meta)} · ${dados.length} meses no planejamento · ${concluidos} meses marcados como concluídos.`
    : "Crie uma trajetória na aba “Metas” para gerar seu planejamento.";
}

function renderizarPlanejamento() {
  const tabela = $("#planejamentoTabela");
  const vazio = $("#planejamentoVazio");
  if (!tabela || !vazio) return;
  const dados = obterPlanejamentoSalvo();
  if (!dados.length) {
    tabela.innerHTML = "";
    vazio.hidden = false;
    atualizarResumoPlanejamento();
    return;
  }
  vazio.hidden = true;
  atualizarResumoPlanejamento();
  tabela.innerHTML = `
    <table class="tabela-planejamento">
      <thead><tr><th>Mês</th><th>Data</th><th>Valor planejado</th><th>Valor realizado</th><th>Concluído</th><th>Observação</th></tr></thead>
      <tbody>${dados.map((linha, index) => `
        <tr>
          <td>${linha.mes}</td>
          <td>${linha.data}</td>
          <td><input class="planejamento-input moeda" data-planejamento="${index}" data-campo="planejado" value="${linha.planejado ? dinheiro(Number(linha.planejado)) : ""}" inputmode="decimal"></td>
          <td><input class="planejamento-input moeda" data-planejamento="${index}" data-campo="realizado" value="${linha.realizado !== "" ? dinheiro(Number(linha.realizado)) : ""}" inputmode="decimal" placeholder="R$ 0,00"></td>
          <td class="check-cell"><input type="checkbox" data-planejamento="${index}" data-campo="concluido" ${linha.concluido ? "checked" : ""} aria-label="Marcar mês ${linha.mes} como concluído"></td>
          <td><input class="planejamento-input" data-planejamento="${index}" data-campo="observacao" value="${String(linha.observacao || "").replace(/"/g, "&quot;")}" placeholder="Ex: consegui guardar menos este mês"></td>
        </tr>`).join("")}</tbody>
    </table>`;

  tabela.querySelectorAll("[data-planejamento]").forEach((el) => {
    if (el.classList.contains("moeda")) prepararCamposDeMoeda();
    el.addEventListener(el.type === "checkbox" ? "change" : "input", () => {
      const idx = Number(el.dataset.planejamento), campo = el.dataset.campo, dadosAtuais = obterPlanejamentoSalvo();
      if (!dadosAtuais[idx]) return;
      if (campo === "concluido") dadosAtuais[idx][campo] = el.checked;
      else if (campo === "planejado" || campo === "realizado") dadosAtuais[idx][campo] = el.value ? numeroCampo(el) : "";
      else dadosAtuais[idx][campo] = el.value;
      salvarPlanejamento(dadosAtuais);
      atualizarResumoPlanejamento();
    });
  });
}

function gerarPlanejamento() {
  const novas = gerarLinhasPlanejamento();
  if (!novas.length) { renderizarPlanejamento(); return; }
  const antigos = obterPlanejamentoSalvo();
  const mapa = new Map(antigos.map((x) => [x.mes, x]));
  const combinadas = novas.map((linha) => {
    const antigo = mapa.get(linha.mes);
    return antigo ? { ...linha, realizado: antigo.realizado, observacao: antigo.observacao, concluido: antigo.concluido } : linha;
  });
  salvarPlanejamento(combinadas);
  renderizarPlanejamento();
  const status = $("#planejamentoStatus");
  if (status) status.textContent = "Planejamento atualizado e salvo no navegador.";
}

function baixarPlanejamentoCSV() {
  const dados = obterPlanejamentoSalvo();
  if (!dados.length) return;
  const linhas = [
    ["UniFinance PRO - Acompanhamento do planejamento"],
    ["Meta", numeroParaExcel(numeroCampo("sMeta"))],
    [],
    ["Mês", "Data", "Valor planejado", "Valor realizado", "Concluído", "Observação"],
    ...dados.map((x) => [x.mes, x.data, numeroParaExcel(Number(x.planejado || 0)), x.realizado === "" ? "" : numeroParaExcel(Number(x.realizado)), x.concluido ? "Sim" : "Não", x.observacao || ""])
  ];
  const conteudo = "\uFEFF" + linhas.map((l) => l.join(";")).join("\r\n");
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "unifinance-planejamento.csv";
  document.body.appendChild(link); link.click(); link.remove();
  URL.revokeObjectURL(link.href);
}

function limparPreenchimentoPlanejamento() {
  salvarPlanejamento(obterPlanejamentoSalvo().map((x) => ({ ...x, realizado: "", observacao: "", concluido: false })));
  renderizarPlanejamento();
}

const CAMPOS_METAS = ["sNome", "sSaldo", "sMeta", "sAporte", "sExtra", "sTaxa", "sInfla"];
const CAMPOS_GUARDAR = ["gMeta", "gSaldo", "gPrazo", "gUnidade", "gTaxa"];
const CAMPOS_JUROS = ["jInicial", "jAporte", "jTaxa", "jPeriodo", "jUnidade"];

const CAMPOS_DE_DINHEIRO = ["sSaldo", "sMeta", "sAporte", "sExtra", "gMeta", "gSaldo", "jInicial", "jAporte"];

function iniciarAplicativo() {
  registrarAcessoCounterAPI();
  /* Tema */
  iniciarTema();
  $("#themeToggle").addEventListener("click", alternarTema);

  /* Abas */
  $$(".tab-btn").forEach((botao) => {
    botao.addEventListener("click", () => mostrarAba(botao.dataset.tab));
  });

  /* Formulários */
  $("#formSim").addEventListener("submit", (e) => { e.preventDefault(); calcularSimulador(); });
  $("#formGuard").addEventListener("submit", (e) => { e.preventDefault(); calcularQuantoGuardar(); });
  $("#formJuros").addEventListener("submit", (e) => { e.preventDefault(); calcularJuros(); });

  /* Botão limpar (aba metas) */
  $("#btnClearSim").addEventListener("click", () => {
    limparFormulario(CAMPOS_METAS, "metas");
    $("#resSim").innerHTML = "";
    exibirErros("#simErr", []);
    modelosGraficos["chartSim"] = null;
  });

  /* Persistência automática + dicas de formato ao digitar */
  [CAMPOS_METAS, CAMPOS_GUARDAR, CAMPOS_JUROS].forEach((lista, idx) => {
    const chave = ["metas", "guardar", "juros"][idx];
    lista.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const evento = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evento, () => salvarFormulario(lista, chave));
    });
  });
  atualizarDicasAoDigitar();

  /* Restaurar valores salvos da última sessão */
  restaurarFormulario(CAMPOS_METAS, "metas");
  restaurarFormulario(CAMPOS_GUARDAR, "guardar");
  restaurarFormulario(CAMPOS_JUROS, "juros");
  prepararCamposDeMoeda();
  CAMPOS_DE_DINHEIRO.forEach((id) => {
    const campo = document.getElementById(id);
    if (campo && campo.value) {
      campo._rawMoeda = String(Math.round(numeroCampo(campo) * 100));
      formatarMoedaPorDigitos(campo);
    }
  });
  atualizarDicas(CAMPOS_DE_DINHEIRO);

  $("#btnGerarPlanejamento")?.addEventListener("click", gerarPlanejamento);
  $("#btnBaixarPlanejamento")?.addEventListener("click", baixarPlanejamentoCSV);
  $("#btnLimparPlanejamento")?.addEventListener("click", limparPreenchimentoPlanejamento);
  renderizarPlanejamento();

  /* Delegação de cliques: chips de rentabilidade, CSV e impressão */
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip[data-taxa]");
    if (chip) {
      $("#sTaxa").value = chip.dataset.taxa;
      $("#sTaxa").classList.remove("invalid");
      salvarFormulario(CAMPOS_METAS, "metas");
      return;
    }

    const exportar = e.target.closest(".js-export");
    if (exportar) {
      gerarDownloadCSV(exportar.dataset.csv);
      return;
    }

    if (e.target.closest("#btnAbrirPlanejamentoResultado")) {
      gerarPlanejamento();
      mostrarAba("planejamento");
      return;
    }
    if (e.target.closest(".js-print")) {
      window.print();
    }
  });

  console.log(
    "%c💰 FinanTrack Pro%c pronto! Tudo roda localmente no seu navegador.",
    "background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff;padding:4px 10px;border-radius:6px;font-weight:bold;",
    "color:#888;"
  );
}
function atualizarDicasAoDigitar() {
  CAMPOS_DE_DINHEIRO.forEach((id) => {
    const campo = document.getElementById(id);
    if (!campo || campo._dicaLigada) return;
    campo.addEventListener("input", () => atualizarDicas(CAMPOS_DE_DINHEIRO));
    campo._dicaLigada = true;
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarAplicativo);
} else {
  iniciarAplicativo();
}
