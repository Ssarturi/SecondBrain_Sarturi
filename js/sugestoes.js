// =============================================================
// METAS E SUGESTÕES DE ESTUDO
// -------------------------------------------------------------
// Este arquivo só pensa (não desenha nada). Ele responde:
//   - Qual é a meta de cada anotação? Ela já foi cumprida?
//   - O que estudar a seguir?
//
// A regra das sugestões:
//   1) Olha a TRILHA (em conexoes.js) e ignora o que já virou anotação
//   2) Sobra só o que já está "desbloqueado": todos os requisitos
//      do tópico são anotações que você já tem
//   3) Se algum requisito tem uma meta ainda NÃO cumprida, o tópico
//      fica "em espera" (aparece, mas depois dos que estão prontos)
//
// As metas que você escreve no site ficam salvas no navegador
// (localStorage), no mesmo estilo do tema claro/escuro.
// =============================================================

var SB = (function () {
  var CHAVE = "secondbrain-metas";

  function ler() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE)) || {};
    } catch (erro) {
      return {};          // sem armazenamento ou dado quebrado: começa vazio
    }
  }

  var metas = ler();

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(metas));
    } catch (erro) {}
  }

  function achar(id) {
    return ANOTACOES.filter(function (n) { return n.id === id; })[0];
  }

  function estudado(id) {
    return !!achar(id);
  }

  // A meta de uma anotação: o que foi salvo no site; se não tiver, a "meta" do conexoes.js
  function meta(id) {
    var salvo = metas[id];
    var nota = achar(id);
    var padrao = nota && nota.meta ? nota.meta : "";
    return {
      texto: salvo && typeof salvo.texto === "string" ? salvo.texto : padrao,
      feito: !!(salvo && salvo.feito)
    };
  }

  function definirMeta(id, texto, feito) {
    metas[id] = { texto: texto, feito: feito };
    salvar();
  }

  function pendente(id) {      // tem meta escrita e ainda não foi cumprida
    var m = meta(id);
    return m.texto.trim() !== "" && !m.feito;
  }

  function cumprida(id) {      // tem meta escrita e foi cumprida
    var m = meta(id);
    return m.texto.trim() !== "" && m.feito;
  }

  function sugestoes() {
    var resultado = [];
    TRILHA.forEach(function (topico) {
      if (estudado(topico.id)) return;                       // já tem anotação
      var requer = topico.requer || [];
      var faltam = requer.filter(function (id) { return !estudado(id); });
      if (faltam.length) return;                             // ainda bloqueado
      var pendentes = requer.filter(pendente);
      resultado.push({
        topico: topico,
        estado: pendentes.length ? "espera" : "pronto",
        pendentes: pendentes
      });
    });
    // os "prontos" vêm primeiro (a ordem da TRILHA se mantém dentro de cada grupo)
    resultado.sort(function (a, b) {
      return (a.estado === "pronto" ? 0 : 1) - (b.estado === "pronto" ? 0 : 1);
    });
    return resultado;
  }

  // Quanto da trilha de cada área já virou anotação
  function progresso() {
    var porArea = {};
    var ordem = [];
    TRILHA.forEach(function (t) {
      if (!porArea[t.area]) {
        porArea[t.area] = { area: t.area, total: 0, feitos: 0 };
        ordem.push(t.area);
      }
      porArea[t.area].total++;
      if (estudado(t.id)) porArea[t.area].feitos++;
    });
    return ordem.map(function (a) { return porArea[a]; });
  }

  // Texto pronto para ela colar no chat com o Claude
  function pedido(topico) {
    return "Claude, quero estudar \"" + topico.titulo + "\" no meu second brain. " +
      "Me ensine do meu jeito: conceito simples, por que existe, exemplos, " +
      "explicação linha por linha e exercícios para eu resolver sozinha antes da solução.";
  }

  return {
    meta: meta,
    definirMeta: definirMeta,
    cumprida: cumprida,
    sugestoes: sugestoes,
    progresso: progresso,
    pedido: pedido
  };
})();
