// =============================================================
// CÉREBRO 3D DO SECOND BRAIN
// -------------------------------------------------------------
// Usa a biblioteca Three.js (carregada no index.html) para
// desenhar em 3D. A ideia geral do Three.js:
//   cena    = o "mundo" onde colocamos as coisas
//   câmera  = o "olho" que olha para a cena
//   render  = quem desenha o que a câmera vê dentro do <canvas>
// Todo quadro (uns 60 por segundo) a função animar() mexe um
// pouquinho nas coisas e desenha de novo: isso é a animação.
// =============================================================

(function () {
  var lista = document.getElementById("lista");
  var listaBtn = document.getElementById("lista-btn");
  var proximosBtn = document.getElementById("proximos-btn");

  // Só um menu fica aberto por vez: "todas" (lista de links) ou "proximos" (sugestões)
  function abrirMenu(qual) {
    var atual = lista.getAttribute("data-aberto");
    var novo = atual === qual ? "" : qual;      // clicar de novo no mesmo botão fecha
    lista.setAttribute("data-aberto", novo);
    listaBtn.setAttribute("aria-expanded", novo === "todas");
    proximosBtn.setAttribute("aria-expanded", novo === "proximos");
  }
  listaBtn.addEventListener("click", function () { abrirMenu("todas"); });
  proximosBtn.addEventListener("click", function () { abrirMenu("proximos"); });

  // Plano B: sem internet o Three.js não carrega. Aí mostramos só a lista.
  if (typeof THREE === "undefined") {
    document.body.classList.add("sem-3d");
    return;
  }

  // ---------------------------------------------------------
  // 1. CENA, CÂMERA E RENDERIZADOR
  // ---------------------------------------------------------
  var container = document.getElementById("cena");
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (erro) {
    document.body.classList.add("sem-3d"); // computador sem suporte a 3D (WebGL)
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  var cena = new THREE.Scene();
  // 55 = abertura da "lente"; os dois últimos números = o mais perto e o mais longe que ela enxerga
  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 400);
  // distância da câmera até o cérebro (no celular, que é estreito, fica mais longe)
  var zoom = window.innerWidth < window.innerHeight ? 17 : 11;
  var zoomAlvo = zoom;
  camera.position.set(0, 0.6, zoom);

  // Tudo que gira junto (neurônios, linhas, poeira) fica dentro deste grupo
  var cerebro = new THREE.Group();
  cena.add(cerebro);

  // ---------------------------------------------------------
  // 2. FORMATO DE CÉREBRO
  // Recebe uma direção (um ponto de uma esfera) e "amassa" ela
  // até parecer um cérebro: dois hemisférios, comprido de frente
  // para trás, com a parte de baixo achatada e algumas dobras.
  // ---------------------------------------------------------
  function formaDeCerebro(x, y, z, raio) {
    var lado = x >= 0 ? 1 : -1;                       // hemisfério direito ou esquerdo
    var dobras = 1 + 0.06 * Math.sin(x * 9 + y * 4) * Math.sin(z * 8 + y * 3);
    var r = 3 * raio * dobras;
    var px = x * 1.05 * r + lado * 0.18;              // + espaço no meio dos hemisférios
    var py = y * 0.85 * r;
    if (py < 0) py *= 0.65;                           // base achatada
    var pz = z * 1.35 * r;
    return new THREE.Vector3(px, py + 0.2, pz);
  }

  // Espalha N pontos de forma equilibrada numa esfera ("espiral de Fibonacci")
  function direcaoFibonacci(i, total) {
    var y = 1 - ((i + 0.5) / total) * 2;
    var raio = Math.sqrt(Math.max(0, 1 - y * y));
    var angulo = i * Math.PI * (3 - Math.sqrt(5));    // "ângulo de ouro"
    return { x: Math.cos(angulo) * raio, y: y, z: Math.sin(angulo) * raio };
  }

  // Textura redondinha e brilhante, usada nas estrelas, poeira e brilhos
  function texturaBrilho() {
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var g = c.getContext("2d");
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.25, "rgba(255,255,255,0.6)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  var brilho = texturaBrilho();

  // ---------------------------------------------------------
  // 3. ESPAÇO: estrelas espalhadas bem longe
  // ---------------------------------------------------------
  function criarEstrelas(qtd, tamanho) {
    var pos = [];
    for (var i = 0; i < qtd; i++) {
      var d = direcaoFibonacci(Math.random() * qtd, qtd);
      var dist = 60 + Math.random() * 120;
      pos.push(d.x * dist, d.y * dist, d.z * dist);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({
      size: tamanho, map: brilho, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, color: 0xfff4dc
    });
    return new THREE.Points(geo, mat);
  }
  var estrelas = criarEstrelas(2600, 0.55);       // muitas estrelas pequenas e distantes
  var estrelasGrandes = criarEstrelas(90, 1.8);    // poucas estrelas mais fortes, que cintilam
  cena.add(estrelas, estrelasGrandes);

  // ---------------------------------------------------------
  // 4. POEIRA NEURAL: o contorno do cérebro
  // Quanto MAIS anotações, MAIS poeira aparece e mais nítido
  // fica o formato do cérebro.
  // ---------------------------------------------------------
  var total = ANOTACOES.length;
  var maxPoeira = 4000;
  var posPoeira = [];
  for (var p = 0; p < maxPoeira; p++) {
    var dir = direcaoFibonacci(Math.random() * maxPoeira, maxPoeira);
    var v = formaDeCerebro(dir.x, dir.y, dir.z, 0.93 + Math.random() * 0.1);
    posPoeira.push(v.x, v.y, v.z);
  }
  var geoPoeira = new THREE.BufferGeometry();
  geoPoeira.setAttribute("position", new THREE.Float32BufferAttribute(posPoeira, 3));
  geoPoeira.setDrawRange(0, Math.min(maxPoeira, 400 + total * 250));
  var poeira = new THREE.Points(geoPoeira, new THREE.PointsMaterial({
    size: 0.09, map: brilho, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, color: 0xc9a54a,
    opacity: Math.min(0.9, 0.45 + total * 0.04)
  }));
  cerebro.add(poeira);

  // ---------------------------------------------------------
  // 5. NEURÔNIOS: um para cada anotação
  // ---------------------------------------------------------
  var neuronios = [];       // guarda tudo de cada neurônio
  var porId = {};           // acha um neurônio pelo id: porId["npm"]
  var alvosClique = [];     // esferas invisíveis (maiores) para facilitar o clique
  var rotulos = document.getElementById("rotulos");

  ANOTACOES.forEach(function (nota, i) {
    var area = AREAS[nota.area] || AREAS.extra;
    var cor = new THREE.Color(area.cor);
    var d = direcaoFibonacci(i, total);
    var posicao = formaDeCerebro(d.x, d.y, d.z, 0.82);

    // Bolinha do neurônio
    var bola = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 24, 24),
      new THREE.MeshBasicMaterial({ color: cor, transparent: true })
    );
    bola.position.copy(posicao);

    // Brilho em volta (um "sprite" sempre virado para a câmera)
    var aura = new THREE.Sprite(new THREE.SpriteMaterial({
      map: brilho, color: cor, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.8
    }));
    aura.scale.setScalar(1.1);
    bola.add(aura);

    // Esfera invisível de clique
    var alvo = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    alvo.userData.id = nota.id;
    bola.add(alvo);
    alvosClique.push(alvo);

    cerebro.add(bola);

    // Nome que acompanha o neurônio (HTML comum, posicionado por cima do 3D)
    var rotulo = document.createElement("div");
    rotulo.className = "rotulo";
    rotulo.textContent = nota.titulo;
    rotulos.appendChild(rotulo);

    var n = { nota: nota, area: area, cor: cor, bola: bola, aura: aura, rotulo: rotulo, fase: i * 1.7 };
    neuronios.push(n);
    porId[nota.id] = n;
  });

  var corBranca = new THREE.Color(0xfffaf0);   // neurônio com meta cumprida fica quase branco

  // ---------------------------------------------------------
  // 5b. NEURÔNIOS FANTASMA: os próximos estudos sugeridos
  // São neurônios "de aramado" (só o contorno), ligados por linhas
  // tracejadas aos neurônios que são pré-requisito deles.
  // ---------------------------------------------------------
  var fantasmas = SB.sugestoes();

  fantasmas.forEach(function (sug, i) {
    var topico = sug.topico;
    var area = AREAS[topico.area] || AREAS.extra;
    var cor = new THREE.Color(area.cor);

    // Onde colocar? Perto dos pré-requisitos, um pouco para fora do cérebro
    var ancoras = (topico.requer || []).map(function (id) { return porId[id]; }).filter(Boolean);
    var posicao;
    if (ancoras.length) {
      posicao = new THREE.Vector3();
      ancoras.forEach(function (a) { posicao.add(a.bola.position); });
      posicao.multiplyScalar(1.35 / ancoras.length);
      // pequeno desvio para dois fantasmas não ficarem empilhados
      posicao.x += Math.sin(i * 2.4) * 0.5;
      posicao.y += Math.cos(i * 1.7) * 0.5;
      posicao.z += Math.sin(i * 1.3) * 0.4;
    } else {
      // sem pré-requisito (ex.: HTML): espalha ao redor do cérebro
      var d = direcaoFibonacci(i, fantasmas.length);
      posicao = formaDeCerebro(d.x, d.y, d.z, 1.12);
    }

    var bola = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.17, 1),
      new THREE.MeshBasicMaterial({ color: cor, wireframe: true, transparent: true, opacity: 0.7 })
    );
    bola.position.copy(posicao);

    var aura = new THREE.Sprite(new THREE.SpriteMaterial({
      map: brilho, color: cor, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.4
    }));
    aura.scale.setScalar(0.9);
    bola.add(aura);

    var alvo = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    alvo.userData.id = topico.id;
    bola.add(alvo);
    alvosClique.push(alvo);
    cerebro.add(bola);

    var rotulo = document.createElement("div");
    rotulo.className = "rotulo fantasma";
    rotulo.textContent = "✦ " + topico.titulo;
    rotulos.appendChild(rotulo);

    var n = { nota: topico, area: area, cor: cor, bola: bola, aura: aura, rotulo: rotulo,
              fase: i * 2.3, fantasma: true, sug: sug };
    neuronios.push(n);
    porId[topico.id] = n;
  });

  // ---------------------------------------------------------
  // 6. SINAPSES: linhas curvas entre neurônios conectados,
  // com um "impulso elétrico" correndo por cada uma
  // ---------------------------------------------------------
  var sinapses = [];
  var jaLigados = {};

  // Cria a linha (e o impulso) entre dois neurônios. "fantasma" = linha tracejada de sugestão
  function ligar(a, b, fantasma) {
    var chave = [a.nota.id, b.nota.id].sort().join("|");
    if (jaLigados[chave]) return;                    // A→B e B→A viram uma linha só
    jaLigados[chave] = true;

    // Curva: sai de A, passa por um ponto um pouco para fora do meio, chega em B
    var meio = a.bola.position.clone().add(b.bola.position).multiplyScalar(0.5);
    meio.multiplyScalar(1.25);
    var curva = new THREE.QuadraticBezierCurve3(a.bola.position, meio, b.bola.position);
    var geometria = new THREE.BufferGeometry().setFromPoints(curva.getPoints(40));

    var cor = a.cor.clone().lerp(b.cor, 0.5);
    var linha;
    if (fantasma) {
      linha = new THREE.Line(geometria, new THREE.LineDashedMaterial({
        color: cor, dashSize: 0.12, gapSize: 0.1, transparent: true, opacity: 0.3,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      linha.computeLineDistances();                  // o tracejado precisa saber o comprimento da linha
    } else {
      linha = new THREE.Line(geometria, new THREE.LineBasicMaterial({
        color: cor, transparent: true, opacity: 0.45,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
    }
    cerebro.add(linha);

    var impulso = new THREE.Sprite(new THREE.SpriteMaterial({
      map: brilho, color: 0xfff3c4, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    impulso.scale.setScalar(0.35);
    cerebro.add(impulso);

    sinapses.push({
      a: a.nota.id, b: b.nota.id, curva: curva, linha: linha, impulso: impulso,
      fantasma: !!fantasma,
      atraso: Math.random(), velocidade: 0.25 + Math.random() * 0.2
    });
  }

  neuronios.forEach(function (a) {
    if (a.fantasma) {
      // fantasma → liga nos pré-requisitos (linhas tracejadas)
      (a.nota.requer || []).forEach(function (id) {
        if (porId[id]) ligar(a, porId[id], true);
      });
    } else {
      (a.nota.conexoes || []).forEach(function (id) {
        if (porId[id] && !porId[id].fantasma) ligar(a, porId[id], false); // id errado: ignora
      });
    }
  });

  // Legenda: só as áreas que já têm anotações
  var legenda = document.getElementById("legenda");
  Object.keys(AREAS).forEach(function (chave) {
    var qtd = ANOTACOES.filter(function (n) { return n.area === chave; }).length;
    if (!qtd) return;
    var li = document.createElement("li");
    li.innerHTML = '<span style="color:' + AREAS[chave].cor + ';background:' + AREAS[chave].cor + '"></span>' +
      AREAS[chave].nome + " (" + qtd + ")";
    legenda.appendChild(li);
  });
  if (fantasmas.length) {
    var liFantasma = document.createElement("li");
    liFantasma.innerHTML = '<span class="vazio"></span>Sugestões (' + fantasmas.length + ')';
    legenda.appendChild(liFantasma);
  }

  // ---------------------------------------------------------
  // 7. GIRAR COM O MOUSE / DEDO E APROXIMAR COM A RODINHA
  // ---------------------------------------------------------
  var giroY = 1.1, giroX = 0.25;        // rotação atual (começa meio de lado, que parece mais um cérebro)
  var velY = 0.0015, velX = 0;          // velocidade (dá o efeito de "inércia")
  var arrastando = false, moveu = 0;
  var ultimoX = 0, ultimoY = 0;
  var tempoParado = 0;                  // depois de um tempo parado, volta a girar sozinho
  var focoY = null;                     // rotação para onde o cérebro vai ao focar um neurônio

  container.addEventListener("pointerdown", function (e) {
    arrastando = true; moveu = 0;
    ultimoX = e.clientX; ultimoY = e.clientY;
    container.setPointerCapture(e.pointerId);
  });

  container.addEventListener("pointermove", function (e) {
    atualizarMouse(e);
    if (!arrastando) return;
    var dx = e.clientX - ultimoX, dy = e.clientY - ultimoY;
    ultimoX = e.clientX; ultimoY = e.clientY;
    moveu += Math.abs(dx) + Math.abs(dy);
    velY = dx * 0.005;
    velX = dy * 0.005;
    focoY = null;
    tempoParado = 0;
  });

  container.addEventListener("pointerup", function (e) {
    arrastando = false;
    if (moveu < 6) clicar();             // mexeu quase nada = foi um clique
  });

  container.addEventListener("wheel", function (e) {
    e.preventDefault();
    zoomAlvo = Math.min(20, Math.max(5.5, zoomAlvo + e.deltaY * 0.01));
  }, { passive: false });

  // ---------------------------------------------------------
  // 8. DESCOBRIR QUAL NEURÔNIO ESTÁ SOB O MOUSE
  // O "raycaster" dispara um raio da câmera na direção do mouse
  // e diz em quais objetos ele bateu.
  // ---------------------------------------------------------
  var raio = new THREE.Raycaster();
  var mouse = new THREE.Vector2(-9, -9);
  var sobMouse = null;

  function atualizarMouse(e) {
    // converte a posição do mouse para o padrão do 3D: de -1 a 1
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  function neuronioSobMouse() {
    raio.setFromCamera(mouse, camera);
    var acertos = raio.intersectObjects(alvosClique);
    return acertos.length ? acertos[0].object.userData.id : null;
  }

  function clicar() {
    lista.setAttribute("data-aberto", "");          // clicar no espaço fecha os menus do topo
    var id = neuronioSobMouse();
    if (id) abrirPainel(id);
    else if (selecionado) fecharPainel();  // clicar no "vazio" fecha a aba
  }

  // ---------------------------------------------------------
  // 9. ABA LATERAL
  // ---------------------------------------------------------
  var painel = document.getElementById("painel");
  var selecionado = null;
  var vizinhos = {};

  function abrirPainel(id) {
    var n = porId[id];
    if (!n) return;
    selecionado = id;

    // Quem está ligado a ele? (vale para os dois lados da conexão)
    vizinhos = {};
    sinapses.forEach(function (s) {
      if (s.a === id) vizinhos[s.b] = true;
      if (s.b === id) vizinhos[s.a] = true;
    });

    var ehFantasma = !!n.fantasma;
    painel.classList.toggle("modo-sugestao", ehFantasma);
    lista.setAttribute("data-aberto", "");        // fecha os menus do topo

    document.getElementById("painel-titulo").textContent = n.nota.titulo;
    var area = document.getElementById("painel-area");
    area.textContent = ehFantasma ? "Sugestão · " + n.area.nome : n.area.nome;
    area.style.color = n.area.cor;

    // Botões das conexões: clicar pula para o outro neurônio
    var caixa = document.getElementById("painel-conexoes");
    caixa.innerHTML = "";
    Object.keys(vizinhos).forEach(function (idViz) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = (porId[idViz].fantasma ? "↔ ✦ " : "↔ ") + porId[idViz].nota.titulo;
      b.addEventListener("click", function () { abrirPainel(idViz); });
      caixa.appendChild(b);
    });

    // ?painel=1 avisa a página que ela está dentro da aba (o tema.js esconde o "Voltar")
    var moldura = document.getElementById("painel-frame");
    if (ehFantasma) {
      moldura.removeAttribute("src");            // não existe página ainda
      preencherSugestao(n);
    } else {
      moldura.src = n.nota.arquivo + "?painel=1";
      document.getElementById("painel-abrir").href = n.nota.arquivo;
      preencherMeta(id);
    }

    painel.classList.add("aberto");
    document.body.classList.add("painel-aberto"); // o CSS usa isso para apagar o título
    painel.setAttribute("aria-hidden", "false");

    // Gira o cérebro até o neurônio ficar de frente para a câmera
    var pos = n.bola.position;
    var anguloAlvo = -Math.atan2(pos.x, pos.z);
    // escolhe o caminho mais curto (não dar uma volta inteira à toa)
    var diferenca = ((anguloAlvo - giroY + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    focoY = giroY + diferenca;
    velY = 0; velX = 0;
  }

  // ---- Metas (campo de texto + caixinha "meta cumprida") ----
  var campoMeta = document.getElementById("meta-texto");
  var campoFeito = document.getElementById("meta-feito");
  var metaAtual = null;                 // id da anotação cuja meta está na tela

  function preencherMeta(id) {
    var m = SB.meta(id);
    metaAtual = id;
    campoMeta.value = m.texto;
    campoFeito.checked = m.feito;
    campoFeito.disabled = m.texto.trim() === "";   // sem meta escrita, não há o que cumprir
  }

  function salvarMeta() {
    if (!metaAtual) return;
    if (campoMeta.value.trim() === "") campoFeito.checked = false;
    campoFeito.disabled = campoMeta.value.trim() === "";
    SB.definirMeta(metaAtual, campoMeta.value, campoFeito.checked);
    atualizarEstados();                 // as sugestões e as cores dependem das metas
  }

  campoMeta.addEventListener("input", salvarMeta);
  campoFeito.addEventListener("change", salvarMeta);

  // ---- Sugestão (painel de um neurônio fantasma) ----
  var botaoPedir = document.getElementById("sugestao-pedir");
  var avisoPedir = document.getElementById("sugestao-aviso");

  function copiar(texto) {
    function plano() {                  // plano B para navegadores que bloqueiam o clipboard
      var area = document.createElement("textarea");
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); } catch (erro) {}
      document.body.removeChild(area);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).catch(plano);
    } else {
      plano();
    }
  }

  function preencherSugestao(n) {
    var topico = n.nota;
    var estado = document.getElementById("sugestao-estado");
    if (n.sug.estado === "pronto") {
      estado.textContent = "Pronto para estudar: você já tem todos os pré-requisitos.";
      estado.className = "estado pronto";
    } else {
      var nomes = n.sug.pendentes.map(function (id) { return porId[id].nota.titulo; });
      estado.textContent = "Antes de começar, cumpra a meta de: " + nomes.join(", ") + ".";
      estado.className = "estado espera";
    }
    document.getElementById("sugestao-porque").textContent = topico.porque || "";
    Tutor.abrir(topico);                // pesquisa rápida + conversa com o tutor (tutor.js)
    avisoPedir.textContent = "";
    botaoPedir.onclick = function () {
      copiar(SB.pedido(topico));
      avisoPedir.textContent = "Copiado! Cole no chat com o Claude para começar.";
    };
  }

  function fecharPainel() {
    selecionado = null;
    vizinhos = {};
    focoY = null;
    painel.classList.remove("aberto");
    document.body.classList.remove("painel-aberto");
    painel.setAttribute("aria-hidden", "true");
  }

  document.getElementById("painel-fechar").addEventListener("click", fecharPainel);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") fecharPainel();
  });

  // Os links da lista também abrem a aba (em vez de trocar de página)
  lista.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function (e) {
      var arquivo = link.getAttribute("href").replace("./", "");
      var nota = ANOTACOES.filter(function (n) { return n.arquivo === arquivo; })[0];
      if (!nota) return;                  // não está no mapa: abre a página normal
      e.preventDefault();
      lista.setAttribute("data-aberto", "");
      abrirPainel(nota.id);
    });
  });

  // ---------------------------------------------------------
  // 9b. MENU "PRÓXIMOS ESTUDOS" e atualização quando as metas mudam
  // ---------------------------------------------------------
  var dropProximos = document.getElementById("drop-proximos");

  // Cria um elemento HTML já com classe e texto (evita repetir código)
  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto) e.textContent = texto;
    return e;
  }

  function desenharProximos(sugs) {
    dropProximos.innerHTML = "";

    // Progresso da trilha de cada área: "Backend  6 de 16"
    SB.progresso().forEach(function (p) {
      var area = AREAS[p.area] || AREAS.extra;
      var topo = el("div", "progresso-topo");
      var nome = el("span", "", area.nome);
      nome.style.color = area.cor;
      topo.appendChild(nome);
      topo.appendChild(el("span", "", p.feitos + " de " + p.total));
      var barra = el("div", "barra");
      var preenchida = document.createElement("i");
      preenchida.style.width = Math.round((p.feitos / p.total) * 100) + "%";
      preenchida.style.background = area.cor;
      barra.appendChild(preenchida);
      var bloco = el("div", "progresso");
      bloco.appendChild(topo);
      bloco.appendChild(barra);
      dropProximos.appendChild(bloco);
    });

    dropProximos.appendChild(el("p", "drop-titulo", "Estude a seguir"));

    if (!sugs.length) {
      dropProximos.appendChild(el("p", "drop-vazio",
        "Você já estudou tudo da trilha! Adicione novos tópicos em TRILHA (js/conexoes.js)."));
      return;
    }

    sugs.slice(0, 4).forEach(function (sug) {
      var area = AREAS[sug.topico.area] || AREAS.extra;
      var item = el("button", "sugestao-item");
      item.type = "button";
      var nome = el("span", "sugestao-nome", sug.topico.titulo);
      nome.style.setProperty("--cor", area.cor);
      item.appendChild(nome);
      if (sug.estado === "pronto") {
        item.appendChild(el("span", "sugestao-tag pronto", "pronto para estudar"));
      } else {
        var nomes = sug.pendentes.map(function (id) { return porId[id].nota.titulo; });
        item.appendChild(el("span", "sugestao-tag espera", "antes, cumpra a meta de " + nomes.join(", ")));
      }
      item.addEventListener("click", function () { abrirPainel(sug.topico.id); });
      dropProximos.appendChild(item);
    });
  }

  // Chamada ao abrir a página e toda vez que uma meta muda
  function atualizarEstados() {
    var sugs = SB.sugestoes();
    var porTopico = {};
    sugs.forEach(function (s) { porTopico[s.topico.id] = s; });

    neuronios.forEach(function (n) {
      if (n.fantasma) {
        if (porTopico[n.nota.id]) n.sug = porTopico[n.nota.id];
      } else {
        n.cumprida = SB.cumprida(n.nota.id);
        n.rotulo.classList.toggle("cumprida", n.cumprida);
      }
    });

    // se o painel de uma sugestão está aberto, atualiza o aviso dele
    // (metas só mudam com uma anotação aberta, então aqui não há sugestão aberta para atualizar)
    desenharProximos(sugs);
  }
  atualizarEstados();

  // ---------------------------------------------------------
  // 10. ANIMAÇÃO: roda a cada quadro
  // ---------------------------------------------------------
  var relogio = new THREE.Clock();
  var deslocamentoX = 0;              // empurra o cérebro para a esquerda quando a aba abre
  var temp = new THREE.Vector3();

  // "lerp" = andar uma fração do caminho entre dois valores (deixa tudo suave)
  function lerp(de, para, fracao) { return de + (para - de) * fracao; }

  function animar() {
    requestAnimationFrame(animar);
    var dt = Math.min(relogio.getDelta(), 0.05); // tempo desde o último quadro
    var t = relogio.elapsedTime;                  // tempo desde que a página abriu

    // --- Rotação ---
    if (focoY !== null) {
      giroY = lerp(giroY, focoY, 0.06);
      giroX = lerp(giroX, 0.1, 0.06);
    } else if (!arrastando) {
      velY *= 0.95; velX *= 0.95;       // vai freando aos poucos
      tempoParado += dt;
      if (tempoParado > 2 && !selecionado) velY = lerp(velY, 0.0015, 0.02); // gira sozinho
    }
    if (focoY === null) {
      giroY += velY;
      giroX = Math.max(-0.9, Math.min(0.9, giroX + velX));
    }
    cerebro.rotation.set(giroX, giroY, 0);

    // "Respiração": o cérebro cresce e diminui bem pouquinho
    cerebro.scale.setScalar(1 + Math.sin(t * 0.8) * 0.012);

    // --- Câmera: zoom e espaço para a aba ---
    zoom = lerp(zoom, zoomAlvo, 0.08);
    var alturaVisivel = 2 * Math.tan((camera.fov * Math.PI) / 360) * zoom;
    var larguraVisivel = alturaVisivel * camera.aspect;
    var telaLarga = window.innerWidth > 900;
    var alvoX = 0;
    if (selecionado && window.innerWidth > 640) {
      // aba aberta: empurra o cérebro para a esquerda, para não ficar atrás dela
      alvoX = (painel.offsetWidth / window.innerWidth) * larguraVisivel * 0.5;
    } else if (telaLarga) {
      // aba fechada: empurra para a direita, abrindo espaço para o título grande
      alvoX = -larguraVisivel * 0.14;
    }
    deslocamentoX = lerp(deslocamentoX, alvoX, 0.07);
    camera.position.set(deslocamentoX, 0.6, zoom);
    camera.lookAt(deslocamentoX, 0, 0);

    estrelas.rotation.y = t * 0.004;
    estrelasGrandes.rotation.y = t * 0.002;
    estrelasGrandes.material.opacity = 0.65 + Math.sin(t * 1.3) * 0.35; // cintilar

    // --- Neurônio sob o mouse ---
    sobMouse = arrastando ? null : neuronioSobMouse();
    container.classList.toggle("sobre-neuronio", !!sobMouse);

    // --- Neurônios: pulsar, destacar e posicionar os nomes ---
    neuronios.forEach(function (n) {
      var id = n.nota.id;
      var ativo = id === selecionado || id === sobMouse;
      var apagado = selecionado && !ativo && !vizinhos[id];

      var pulso = 1 + Math.sin(t * 2 + n.fase) * 0.12;
      var tamanho = (ativo ? 1.6 : 1) * pulso * (n.cumprida ? 1.25 : 1);
      n.bola.scale.setScalar(lerp(n.bola.scale.x, tamanho, 0.15));

      // Fantasma pronto = mais visível; fantasma em espera = bem fraquinho
      var base = n.fantasma ? (n.sug.estado === "pronto" ? 0.8 : 0.3) : 1;
      n.bola.material.opacity = lerp(n.bola.material.opacity, apagado ? Math.min(0.25, base) : base, 0.1);
      n.aura.material.opacity = lerp(n.aura.material.opacity,
        apagado ? 0.15 : ativo ? 1 : (n.fantasma ? base * 0.6 : 0.7), 0.1);

      if (n.fantasma) {
        n.bola.rotation.y += 0.01;       // o aramado gira devagar
        n.bola.rotation.x += 0.004;
      } else {
        // meta cumprida: o neurônio vai ficando quase branco; senão volta à cor da área
        var corAlvo = n.cumprida ? corBranca : n.cor;
        n.bola.material.color.lerp(corAlvo, 0.08);
        n.aura.material.color.lerp(corAlvo, 0.08);
      }

      // Posição do neurônio na tela (3D → 2D)
      n.bola.getWorldPosition(temp);
      var naFrente = temp.clone().applyMatrix4(camera.matrixWorldInverse).z;
      temp.project(camera);
      var x = (temp.x * 0.5 + 0.5) * window.innerWidth;
      var y = (-temp.y * 0.5 + 0.5) * window.innerHeight;
      n.rotulo.style.transform = "translate(" + (x + 14) + "px," + (y - 10) + "px)";

      // Quem está atrás do cérebro fica mais apagado
      var profundidade = Math.max(0, Math.min(1, (-naFrente - zoom + 4) / 8));
      var opacidade = ativo ? 1 : apagado ? 0.15 : 1 - profundidade * 0.8;
      n.rotulo.style.opacity = opacidade.toFixed(2);
      n.rotulo.classList.toggle("ativo", ativo);
    });

    // --- Sinapses: destacar e mover os impulsos ---
    sinapses.forEach(function (s) {
      var ligada = selecionado && (s.a === selecionado || s.b === selecionado);
      var alvo = !selecionado ? (s.fantasma ? 0.3 : 0.45) : ligada ? 0.95 : 0.06;
      s.linha.material.opacity = lerp(s.linha.material.opacity, alvo, 0.1);

      var progresso = (t * s.velocidade * (ligada ? 2.2 : 1) + s.atraso) % 1;
      if (ligada && s.b === selecionado) progresso = 1 - progresso; // impulso sai do selecionado
      s.curva.getPoint(progresso, s.impulso.position);
      s.impulso.material.opacity = s.fantasma ? 0 : (selecionado && !ligada ? 0.05 : 1) * Math.sin(progresso * Math.PI);
    });

    renderer.render(cena, camera);
  }
  animar();

  // Quando a janela muda de tamanho, ajusta a câmera e o canvas
  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
