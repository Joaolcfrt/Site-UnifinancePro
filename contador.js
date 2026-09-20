"use strict";

/* ============================================================
   Contador de acessos — CounterAPI (V2)
   Arquivo separado para não mexer na lógica do app.js.
   ============================================================ */
(function () {
  const CONFIG = {
    workspace: "joao-lucass-team-5596",
    contador: "first-counter-5596",
    // Token de estudo. Fica visível no código público do GitHub Pages.
    token: "ut_7OaDOgIjI5PEcM4mpLbzs0KPOZg4d771Z6RBAPfB",
    chaveSessao: "unifinance-pro-contou-acesso",
    timeoutMs: 8000
  };

  const BASE = `https://api.counterapi.dev/v2/${CONFIG.workspace}/${CONFIG.contador}`;

  function elemento() {
    return document.getElementById("contadorAcessos");
  }

  function mostrar(texto) {
    const el = elemento();
    if (el) el.textContent = texto;
  }

  function comoNumero(x) {
    if (typeof x === "number" && Number.isFinite(x)) return x;
    if (typeof x === "string" && x.trim() !== "" && Number.isFinite(Number(x))) return Number(x);
    return null;
  }

  // A resposta da V2 pode vir dentro de "data"; aceita os nomes de campo mais prováveis.
  function extrairValor(json) {
    if (!json || typeof json !== "object") return null;
    const d = json.data && typeof json.data === "object" ? json.data : json;

    for (const campo of ["count", "value", "total"]) {
      const n = comoNumero(d[campo]);
      if (n !== null) return n;
    }

    const up = comoNumero(d.up_count);
    if (up !== null) return up - (comoNumero(d.down_count) || 0);

    return null;
  }

  async function chamar(url) {
    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), CONFIG.timeoutMs);
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${CONFIG.token}` },
        signal: controle.signal
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      console.log("[contador] resposta de", url, json);
      return json;
    } finally {
      clearTimeout(timer);
    }
  }

  function jaContouNestaSessao() {
    try { return sessionStorage.getItem(CONFIG.chaveSessao) === "1"; }
    catch (_) { return false; }
  }

  function marcarComoContado() {
    try { sessionStorage.setItem(CONFIG.chaveSessao, "1"); } catch (_) {}
  }

  async function iniciarContador() {
    if (!elemento()) return;
    mostrar("…");

    let json = null;

    // Conta +1 só na primeira vez da sessão; nos recarregamentos apenas lê o valor.
    if (!jaContouNestaSessao()) {
      try {
        json = await chamar(`${BASE}/up`);
        marcarComoContado();
      } catch (erro) {
        console.warn("[contador] não foi possível contar o acesso:", erro);
      }
    }

    let valor = extrairValor(json);

    // Se a contagem falhou ou a resposta não trouxe o número, tenta só ler o valor atual.
    if (valor === null) {
      try {
        valor = extrairValor(await chamar(BASE));
      } catch (erro) {
        console.warn("[contador] não foi possível ler o contador:", erro);
      }
    }

    mostrar(valor === null ? "—" : valor.toLocaleString("pt-BR"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarContador);
  } else {
    iniciarContador();
  }
})();