// =============================================================
// CONEXÕES DO SECOND BRAIN
// -------------------------------------------------------------
// Este arquivo é o "mapa" do cérebro. Cada anotação vira um
// neurônio, e cada item de "conexoes" vira uma linha entre dois
// neurônios.
//
// Para adicionar uma anotação nova:
// 1) Crie a página HTML (ex.: Back/exports.html)
// 2) Copie um bloco { ... } abaixo, cole no fim da lista
//    "anotacoes" e troque os valores
// 3) Em "conexoes", coloque os ids das anotações relacionadas
//
// 4) (opcional) Escreva uma "meta" para o tema, por exemplo:
//      meta: "Conseguir criar um módulo sozinha"
//    Você também pode escrever/alterar a meta direto no site,
//    na aba lateral (ela fica salva no seu navegador).
// 5) Se o tema está na TRILHA (mais abaixo), use o MESMO id dela:
//    a sugestão some e novas sugestões aparecem.
//
// Quanto mais anotações, mais o cérebro ganha forma!
// =============================================================

// Cores: paleta dourado / amarelo / branco
var AREAS = {
  back:  { nome: "Backend",    cor: "#d4af37" },
  front: { nome: "Frontend",   cor: "#f5d76e" },
  full:  { nome: "Full stack", cor: "#fff8e7" },
  extra: { nome: "Curiosidades", cor: "#e8a33d" }
};

var ANOTACOES = [
  {
    id: "backend",
    titulo: "Backend",
    area: "back",
    arquivo: "Back/backendInicial.html",
    conexoes: ["nodejs"]
  },
  {
    id: "nodejs",
    titulo: "Node.js",
    area: "back",
    arquivo: "Back/nodejs.html",
    conexoes: ["backend", "npm", "modulos"]
  },
  {
    id: "npm",
    titulo: "NPM",
    area: "back",
    arquivo: "Back/npm.html",
    conexoes: ["nodejs", "packagejson", "dependencias"]
  },
  {
    id: "packagejson",
    titulo: "package.json",
    area: "back",
    arquivo: "Back/packagejson.html",
    conexoes: ["npm", "dependencias"]
  },
  {
    id: "dependencias",
    titulo: "Dependências",
    area: "back",
    arquivo: "Back/dependencias.html",
    conexoes: ["npm", "packagejson", "modulos"]
  },
  {
    id: "modulos",
    titulo: "Módulos e require()",
    area: "back",
    arquivo: "Back/modulos.html",
    conexoes: ["nodejs", "dependencias"]
  }
];

// =============================================================
// TRILHA DE ESTUDOS
// -------------------------------------------------------------
// É o "mapa do que existe para aprender". O site compara esta
// lista com as suas ANOTACOES (pelo id) e sugere o que estudar
// a seguir:
//   - id:      o MESMO id que você vai usar na anotação quando ela existir
//   - requer:  ids que você precisa ter estudado antes
//   - porque:  a frase que aparece na sugestão
//   - busca:   (opcional) o termo pesquisado na Wikipédia
//
// Um tópico só vira sugestão quando TODOS os requisitos dele já
// são anotações. Quando você cria a anotação com o mesmo id, a
// sugestão some sozinha e novos tópicos são liberados.
// Para ter outros assuntos, é só copiar um bloco e adaptar.
// =============================================================

var TRILHA = [
  // ----- Backend -----
  { id: "backend",      titulo: "Backend",                     area: "back", requer: [] },
  { id: "nodejs",       titulo: "Node.js",                     area: "back", requer: ["backend"] },
  { id: "npm",          titulo: "NPM",                         area: "back", requer: ["nodejs"] },
  { id: "packagejson",  titulo: "package.json",                area: "back", requer: ["npm"] },
  { id: "dependencias", titulo: "Dependências",                area: "back", requer: ["packagejson"] },
  { id: "modulos",      titulo: "Módulos e require()",         area: "back", requer: ["nodejs", "dependencias"] },
  { id: "moduleexports", busca: "CommonJS", titulo: "module.exports",             area: "back", requer: ["modulos"],
    porque: "O require() traz módulos; o module.exports é o outro lado: decide o que o seu arquivo entrega para quem for usá-lo." },
  { id: "json", busca: "JSON",         titulo: "JSON",                        area: "back", requer: ["nodejs"],
    porque: "É o formato que o front e o back usam para trocar dados. Você vai vê-lo em quase todo projeto." },
  { id: "env", busca: "Variável de ambiente",          titulo: "Variáveis de ambiente (.env)", area: "back", requer: ["packagejson", "dependencias"],
    porque: "Senhas e chaves não podem ficar escritas no código. O .env guarda esses segredos fora dele." },
  { id: "http", busca: "Hypertext Transfer Protocol",         titulo: "HTTP: pedido e resposta",     area: "back", requer: ["backend", "nodejs"],
    porque: "Todo servidor conversa por HTTP. Entender pedido e resposta é a base para criar uma API." },
  { id: "servidor", busca: "Servidor web",     titulo: "Meu primeiro servidor",       area: "back", requer: ["http", "modulos"],
    porque: "Hora de usar o que você aprendeu: um servidor de verdade rodando com Node." },
  { id: "express", busca: "Express.js",      titulo: "Express",                     area: "back", requer: ["servidor", "npm"],
    porque: "Um pacote do NPM que deixa o servidor muito mais simples de escrever." },
  { id: "rotas", busca: "Método HTTP",        titulo: "Rotas e métodos (GET, POST)", area: "back", requer: ["express"],
    porque: "As rotas decidem o que o servidor responde para cada endereço e cada tipo de pedido." },
  { id: "rest", busca: "REST",         titulo: "API REST",                    area: "back", requer: ["rotas", "json"],
    porque: "O jeito padrão de organizar rotas para o front conversar com o back." },
  { id: "banco", busca: "Banco de dados",        titulo: "Banco de dados",              area: "back", requer: ["rest"],
    porque: "Sem banco, tudo some quando o servidor desliga. Aqui os dados passam a ficar guardados." },
  { id: "auth", busca: "Autenticação",         titulo: "Login e autenticação",        area: "back", requer: ["rest", "banco"],
    porque: "Como o back sabe quem está pedindo e garante que cada pessoa veja só o que é dela." },

  // ----- Frontend -----
  { id: "html", busca: "HTML",         titulo: "HTML",                        area: "front", requer: [],
    porque: "A estrutura de toda página. É o ponto de partida do frontend." },
  { id: "css", busca: "Cascading Style Sheets",          titulo: "CSS",                         area: "front", requer: ["html"],
    porque: "É o que dá cor, tamanho e posição ao que o HTML criou." },
  { id: "flexgrid", busca: "Cascading Style Sheets",     titulo: "Flexbox e Grid",              area: "front", requer: ["css"],
    porque: "As duas ferramentas modernas para organizar elementos na tela." },
  { id: "responsivo", busca: "Web design responsivo",   titulo: "Layout responsivo",           area: "front", requer: ["css"],
    porque: "Faz a mesma página funcionar bem no celular e no computador." },
  { id: "jsnavegador", busca: "JavaScript",  titulo: "JavaScript no navegador",     area: "front", requer: ["html"],
    porque: "Você já usa JS no Node; aqui ele ganha acesso à página (o document que o Node não tem)." },
  { id: "dom", busca: "Modelo de Objeto de Documentos",          titulo: "DOM",                         area: "front", requer: ["jsnavegador"],
    porque: "A representação da página que o JavaScript consegue ler e modificar." },
  { id: "eventos", busca: "Programação orientada a eventos",      titulo: "Eventos",                     area: "front", requer: ["dom"],
    porque: "Como a página reage a cliques, teclas e tudo que a pessoa faz." },
  { id: "fetch", busca: "Ajax (programação)",        titulo: "fetch e consumo de API",      area: "front", requer: ["eventos", "json"],
    porque: "O front pedindo dados ao back: a ponte entre os dois lados." },

  // ----- Full stack -----
  { id: "integracao", busca: "Desenvolvimento web",   titulo: "Ligando front e back",        area: "full", requer: ["fetch", "rest"],
    porque: "Juntar tudo: uma página que conversa com a sua própria API." }
];
