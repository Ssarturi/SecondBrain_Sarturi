// Modo claro / escuro do Second Brain
// 1) Ao carregar a página, aplica o tema que ficou salvo (se existir)
// 2) Ao clicar no botão, troca o tema e salva a escolha

var chave = "tema";

function temaSalvo() {
  try {
    return localStorage.getItem(chave);
  } catch (erro) {
    return null; // navegador bloqueou o armazenamento
  }
}

function temaAtual() {
  var escolhido = document.documentElement.getAttribute("data-theme");
  if (escolhido) return escolhido;
  var sistemaEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return sistemaEscuro ? "dark" : "light";
}

function aplicar(tema) {
  document.documentElement.setAttribute("data-theme", tema);
  var botao = document.getElementById("tema-btn");
  if (botao) {
    botao.textContent = tema === "dark" ? "☀️ Claro" : "🌙 Escuro";
  }
}

// Roda já no <head>, antes da página aparecer (evita piscar o tema errado)
var salvo = temaSalvo();
if (salvo) {
  document.documentElement.setAttribute("data-theme", salvo);
}

// Quando o HTML terminar de carregar, o botão já existe
document.addEventListener("DOMContentLoaded", function () {
  aplicar(temaAtual());

  document.getElementById("tema-btn").addEventListener("click", function () {
    var novo = temaAtual() === "dark" ? "light" : "dark";
    aplicar(novo);
    try {
      localStorage.setItem(chave, novo);
    } catch (erro) {}
  });
});
