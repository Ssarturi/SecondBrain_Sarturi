// =============================================================
// ESTUDAR DENTRO DO SECOND BRAIN
// -------------------------------------------------------------
// Quando você clica em uma sugestão (neurônio fantasma), a aba
// lateral mostra duas ferramentas de estudo:
//
// 1) PESQUISA RÁPIDA: busca o tema na Wikipédia (grátis, sem
//    chave) usando a API pública dela, e mostra links prontos
//    para o Google e para a MDN (documentação de web).
//
// 2) TUTOR: um chat com o Claude (a IA da Anthropic), chamado
//    direto do navegador pela API oficial. Ele ensina do seu
//    jeito: passo a passo e com exercícios antes da solução.
//
// O tutor precisa de uma CHAVE DE API (começa com "sk-ant-").
// Ela fica guardada só neste navegador (localStorage) e NUNCA
// deve ser escrita dentro do código, porque quem tiver a chave
// gasta os seus créditos.
//
// A biblioteca oficial da Anthropic está em js/vendor/anthropic-sdk.js
// (é ela que cria window.Anthropic).
// =============================================================

var Tutor = (function () {
  var CHAVE_API = "secondbrain-chave-api";
  var CHAVE_CONVERSAS = "secondbrain-conversas";
  var MODELO = "claude-opus-5-5";

  var topicoAtual = null;
  var enviando = false;

  // ---------- Pegando os elementos da aba ----------
  function $(id) { return document.getElementById(id); }
  var caixaPesquisa = $("pesquisa");
  var caixaLinks = $("pesquisa-links");
  var caixaChave = $("tutor-chave");
  var formChave = $("tutor-chave-form");
  var campoChave = $("tutor-chave-campo");
  var caixaTutor = $("tutor");
  var listaMensagens = $("tutor-mensagens");
  var botaoComecar = $("tutor-comecar");
  var formTutor = $("tutor-form");
  var entrada = $("tutor-entrada");
  var botaoEnviar = $("tutor-enviar");
  var status = $("tutor-status");
  var botaoLimpar = $("tutor-limpar");
  var botaoTrocar = $("tutor-trocar");

  // ---------- Guardar e ler do navegador ----------
  function ler(chave, padrao) {
    try {
      var valor = localStorage.getItem(chave);
      return valor === null ? padrao : JSON.parse(valor);
    } catch (erro) {
      return padrao;
    }
  }
  function guardar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (erro) {}
  }

  function chaveApi() { return ler(CHAVE_API, ""); }

  // Cada tema tem a sua conversa: { "json": [mensagens...], "http": [...] }
  function conversa(id) { return ler(CHAVE_CONVERSAS, {})[id] || []; }
  function salvarConversa(id, mensagens) {
    var todas = ler(CHAVE_CONVERSAS, {});
    todas[id] = mensagens;
    guardar(CHAVE_CONVERSAS, todas);
  }

  // =========================================================
  // 1) PESQUISA RÁPIDA (Wikipédia)
  // =========================================================
  function link(texto, url) {
    var a = document.createElement("a");
    a.href = url;
    a.target = "_blank";              // abre em outra aba
    a.rel = "noopener";
    a.textContent = texto;
    return a;
  }

  async function pesquisar(topico) {
    var termo = topico.busca || topico.titulo;

    // Links que sempre funcionam
    caixaLinks.innerHTML = "";
    caixaLinks.appendChild(link("Google ↗", "https://www.google.com/search?q=" +
      encodeURIComponent(topico.titulo + " programação")));
    caixaLinks.appendChild(link("MDN ↗", "https://developer.mozilla.org/pt-BR/search?q=" +
      encodeURIComponent(termo)));

    caixaPesquisa.textContent = "Buscando na Wikipédia...";
    try {
      // 1º pergunta à Wikipédia qual artigo combina com o termo
      var urlBusca = "https://pt.wikipedia.org/w/api.php?action=query&list=search&srlimit=1" +
        "&format=json&origin=*&srsearch=" + encodeURIComponent(termo);
      var busca = await (await fetch(urlBusca)).json();
      var achado = busca.query && busca.query.search[0];
      if (!achado) throw new Error("nada encontrado");

      // 2º pede o resumo desse artigo
      var urlResumo = "https://pt.wikipedia.org/api/rest_v1/page/summary/" +
        encodeURIComponent(achado.title.replace(/ /g, "_"));
      var resumo = await (await fetch(urlResumo)).json();

      if (topicoAtual !== topico) return;   // ela já clicou em outro tema
      caixaPesquisa.innerHTML = "";
      var titulo = document.createElement("strong");
      titulo.textContent = resumo.title;
      var texto = document.createElement("p");
      texto.textContent = resumo.extract;  // textContent = mostra como texto puro (seguro)
      caixaPesquisa.appendChild(titulo);
      caixaPesquisa.appendChild(texto);
      if (resumo.content_urls) {
        caixaLinks.insertBefore(link("Wikipédia ↗", resumo.content_urls.desktop.page), caixaLinks.firstChild);
      }
    } catch (erro) {
      if (topicoAtual !== topico) return;
      caixaPesquisa.textContent = "Não achei um resumo na Wikipédia. Tente os links abaixo.";
    }
  }

  // =========================================================
  // 2) TUTOR (Claude)
  // =========================================================

  // As "regras" que o tutor segue. É aqui que está o seu jeito de aprender.
  function instrucoes(topico) {
    var estudados = ANOTACOES.map(function (n) { return n.titulo; }).join(", ");
    var requisitos = (topico.requer || []).map(function (id) {
      var t = TRILHA.filter(function (x) { return x.id === id; })[0];
      return t ? t.titulo : id;
    }).join(", ");

    return [
      "Você é o tutor de programação dentro do Second Brain de uma estudante iniciante de frontend, backend e full stack.",
      "Fale sempre em português do Brasil, de forma simples e acolhedora.",
      "",
      "Tema desta aula: " + topico.titulo + ".",
      topico.porque ? "Por que ele foi sugerido: " + topico.porque : "",
      requisitos ? "Pré-requisitos que ela já estudou: " + requisitos + "." : "",
      "Tudo o que já está no Second Brain dela: " + estudados + ". Use isso para ligar o tema novo ao que ela já sabe.",
      "",
      "Como ensinar (ela pediu exatamente assim):",
      "1. Explique o conceito de forma simples primeiro.",
      "2. Explique por que ele existe e que problema resolve.",
      "3. Mostre exemplos práticos.",
      "4. Explique cada linha de código.",
      "5. Proponha exercícios pequenos para ela resolver sozinha.",
      "6. Não dê a solução logo de cara; espere a tentativa dela.",
      "7. Corrija os erros explicando o porquê.",
      "",
      "Um passo por mensagem: mensagens curtas, nunca despeje tudo de uma vez.",
      "Termine cada mensagem com uma pergunta ou um exercício para conferir se ela entendeu,",
      "e só avance para o próximo passo quando ela mostrar que entendeu o anterior.",
      "Use blocos de código com ``` quando mostrar código."
    ].filter(function (linha, i, todas) {
      return linha !== "" || todas[i - 1] !== "";   // tira linhas vazias repetidas
    }).join("\n");
  }

  // Transforma o texto do tutor (markdown simples) em HTML seguro
  function escapar(t) {
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function formatar(texto) {
    return texto.split("```").map(function (parte, i) {
      if (i % 2 === 1) {                               // dentro de ``` ``` = código
        return "<pre><code>" + escapar(parte.replace(/^[a-zA-Z]*\n/, "")) + "</code></pre>";
      }
      var h = escapar(parte)
        .replace(/`([^`\n]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
        .replace(/^#{1,4} (.+)$/gm, "<strong>$1</strong>")
        .replace(/^\s*[-*] (.+)$/gm, "• $1");
      return h.split(/\n{2,}/).map(function (p) {
        return p.trim() ? "<p>" + p.trim().replace(/\n/g, "<br>") + "</p>" : "";
      }).join("");
    }).join("");
  }

  // Só o texto de uma mensagem (as do tutor vêm em "blocos")
  function textoDe(mensagem) {
    if (typeof mensagem.content === "string") return mensagem.content;
    return mensagem.content
      .filter(function (b) { return b.type === "text"; })
      .map(function (b) { return b.text; })
      .join("");
  }

  function bolha(papel, html) {
    var div = document.createElement("div");
    div.className = "msg " + (papel === "user" ? "minha" : "tutor");
    div.innerHTML = html;
    listaMensagens.appendChild(div);
    return div;
  }

  function rolarParaBaixo() {
    var caixa = $("sugestao");
    caixa.scrollTop = caixa.scrollHeight;
  }

  function desenhar() {
    var temChave = !!chaveApi();
    caixaChave.hidden = temChave;
    caixaTutor.hidden = !temChave;
    botaoTrocar.hidden = !temChave;
    if (!temChave) return;

    var mensagens = conversa(topicoAtual.id);
    listaMensagens.innerHTML = "";
    mensagens.forEach(function (m) {
      bolha(m.role, m.role === "user" ? "<p>" + escapar(textoDe(m)) + "</p>" : formatar(textoDe(m)));
    });
    botaoComecar.hidden = mensagens.length > 0;
    formTutor.hidden = mensagens.length === 0;
    botaoLimpar.hidden = mensagens.length === 0;
    status.textContent = "";
  }

  // Traduz os erros da API para algo que dá para entender
  function explicarErro(erro) {
    if (erro instanceof Anthropic.AuthenticationError) {
      return "A chave foi recusada. Cole a chave de novo, conferindo se copiou ela inteira.";
    }
    if (erro instanceof Anthropic.PermissionDeniedError) {
      return "Essa chave não tem permissão para usar este modelo.";
    }
    if (erro instanceof Anthropic.RateLimitError) {
      return "Muitas mensagens seguidas. Espere um minutinho e tente de novo.";
    }
    if (erro instanceof Anthropic.BadRequestError) {
      // o caso mais comum aqui é a conta sem créditos
      return "A API recusou o pedido: " + ((erro.error && erro.error.error && erro.error.error.message) || erro.message);
    }
    if (erro instanceof Anthropic.APIConnectionError) {
      return "Sem conexão com a API. Confira a internet.";
    }
    if (erro instanceof Anthropic.InternalServerError) {
      return "A API está instável agora. Tente de novo em instantes.";
    }
    return "Algo deu errado: " + erro.message;
  }

  async function enviar(texto) {
    if (enviando || !texto.trim()) return;
    enviando = true;
    botaoEnviar.disabled = true;
    botaoComecar.hidden = true;
    formTutor.hidden = false;
    status.textContent = "O tutor está escrevendo...";

    var topico = topicoAtual;
    var mensagens = conversa(topico.id);
    mensagens.push({ role: "user", content: texto });
    bolha("user", "<p>" + escapar(texto) + "</p>");
    var resposta = bolha("assistant", "<p class=\"digitando\">…</p>");
    rolarParaBaixo();

    try {
      var cliente = new Anthropic({
        apiKey: chaveApi(),
        dangerouslyAllowBrowser: true   // permite chamar a API do navegador (a chave é só sua)
      });

      // "stream" = a resposta chega aos pouquinhos, enquanto o tutor escreve
      var fluxo = cliente.beta.messages.stream({
        model: MODELO,
        max_tokens: 16000,
        output_config: { effort: "medium" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",          // se o modelo recusar, a API tenta outro sozinha
        system: instrucoes(topico),
        messages: mensagens
      });

      fluxo.on("text", function (pedaco, textoAteAgora) {
        if (topicoAtual === topico) {
          resposta.innerHTML = formatar(textoAteAgora);
          rolarParaBaixo();
        }
      });

      var final = await fluxo.finalMessage();

      if (final.stop_reason === "refusal") {
        mensagens.pop();                 // não guarda a pergunta recusada
        resposta.innerHTML = "<p>O tutor não pôde responder a essa mensagem. Tente reformular.</p>";
      } else {
        // guarda a resposta inteira (com todos os blocos) para a conversa continuar
        mensagens.push({ role: "assistant", content: final.content });
        salvarConversa(topico.id, mensagens);
        if (topicoAtual === topico) resposta.innerHTML = formatar(textoDe(final));
      }
      status.textContent = "";
      entrada.value = "";
    } catch (erro) {
      mensagens.pop();
      resposta.remove();
      status.textContent = explicarErro(erro);
      if (erro instanceof Anthropic.AuthenticationError) {
        guardar(CHAVE_API, "");
        desenhar();
      }
    } finally {
      enviando = false;
      botaoEnviar.disabled = false;
      botaoLimpar.hidden = false;
      rolarParaBaixo();
    }
  }

  // ---------- Botões e formulários ----------
  formChave.addEventListener("submit", function (e) {
    e.preventDefault();                  // não recarrega a página
    var valor = campoChave.value.trim();
    if (!valor) return;
    guardar(CHAVE_API, valor);
    campoChave.value = "";
    desenhar();
  });

  botaoComecar.addEventListener("click", function () {
    enviar("Oi! Quero começar a estudar " + topicoAtual.titulo + ".");
  });

  formTutor.addEventListener("submit", function (e) {
    e.preventDefault();
    enviar(entrada.value);
  });

  // Enter envia; Shift + Enter pula linha
  entrada.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar(entrada.value);
    }
  });

  botaoLimpar.addEventListener("click", function () {
    salvarConversa(topicoAtual.id, []);
    desenhar();
  });

  botaoTrocar.addEventListener("click", function () {
    guardar(CHAVE_API, "");
    desenhar();
  });

  // Chamado pelo cerebro.js quando uma sugestão é aberta
  function abrir(topico) {
    topicoAtual = topico;
    pesquisar(topico);
    desenhar();
  }

  return { abrir: abrir };
})();
