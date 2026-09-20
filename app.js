/* ------------------------------------------------------------
   CONTADOR DE ACESSOS UNIVERSAL (COUNTERAPI)
   ------------------------------------------------------------ */
window.addEventListener("DOMContentLoaded", () => {
  const elContador = document.getElementById("contador-numero");
  if (!elContador) return;

  fetch("https://api.counterapi.dev/v2/joao-lucass-team-5596/first-counter-5596/up", {
    method: "GET",
    headers: {
      "Authorization": "Bearer ut_7OaDOgIjI5PEcM4mpLbzs0KPOZg4d771Z6RBAPfB"
    }
  })
  .then(response => {
    if (!response.ok) throw new Error("Erro na API");
    return response.json();
  })
  .then(data => {
    elContador.innerText = data.count;
  })
  .catch(error => {
    console.error("Erro no contador:", error);
    elContador.innerText = "Erro";
  });
});

