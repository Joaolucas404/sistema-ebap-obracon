import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs');
const ASSETS = path.join(DOCS, 'assets');
const SHOTS = path.join(ASSETS, 'screenshots');
const DIAGRAMS = path.join(ASSETS, 'diagramas');
const HTML_OUT = path.join(DOCS, 'SIGEBAP-Documento-Executivo-v4.0.html');
const PDF_OUT = path.join(DOCS, 'SIGEBAP-Documento-Executivo-v4.0.pdf');
const LOGO = '../public/brand/uniao-obracon-logo.png';
const HERO = '../public/brand/morro-do-moreno.jpg';

const badPatterns = ['�', 'ï¿½', 'Ãƒ', 'Ã‚', '??', 'T?', 'Situa??', 'Valida??', 'Hist?', 'DiÃ¡rio', 'OperaÃ§Ã£o', 'TÃ©cnico'];

const today = new Date().toLocaleDateString('pt-BR');

const figures = [
  ['login-desktop', 'Login institucional do SIGEBAP.'],
  ['navegacao-sistema', 'Navegação principal do SIGEBAP.'],
  ['dashboard-executivo', 'Dashboard Executivo do SIGEBAP.'],
  ['dashboard-supervisor', 'Dashboard Supervisor e fila operacional.'],
  ['agenda-operacional', 'Agenda Operacional para planejamento diário.'],
  ['ordens-servico', 'Central de Ordens de Serviço.'],
  ['nova-os', 'Abertura de nova Ordem de Serviço.'],
  ['detalhes-os', 'Detalhes da OS com histórico e rastreabilidade.'],
  ['rdo-desktop', 'RDO em ambiente desktop.'],
  ['mobile-rdo', 'RDO em experiência mobile.'],
  ['cco-rdo', 'Validação de RDO pelo CCO.'],
  ['cco-os', 'Validação de OS pelo CCO.'],
  ['sala-situacao', 'Sala de Situação das EBAPs.'],
  ['ativos', 'Central operacional de Ativos.'],
  ['mapa-operacional', 'Mapa Operacional das EBAPs.'],
  ['planejamento', 'Planejamento de Manutenção.'],
  ['agenda-calendario', 'Calendário de atividades programadas.'],
  ['importacao-xls', 'Importação XLS para cronograma de manutenção.'],
  ['compras', 'Módulo de Compras.'],
  ['almoxarifado', 'Módulo de Almoxarifado.'],
  ['administrativo', 'Administrativo, RH, DP e frota.'],
  ['chat', 'Chat Corporativo.'],
  ['alertas', 'Central de Alertas.'],
  ['configuracoes', 'Configurações administrativas.'],
  ['ui-kit', 'SIGEBAP UI Kit.'],
  ['mobile-operador', 'Tela mobile do perfil Operador.'],
  ['mobile-supervisor', 'Tela mobile do perfil Supervisor.'],
  ['mobile-tecnico', 'Tela mobile do perfil Técnico.'],
  ['mobile-cco', 'Tela mobile do perfil CCO.'],
  ['mobile-prefeitura', 'Tela mobile do perfil Prefeitura.'],
  ['mobile-fiscal-operacional', 'Tela mobile do Fiscal Operacional.']
];

const modules = [
  {
    title: 'Dashboard Executivo',
    icon: 'LayoutDashboard',
    objective: 'Permitir leitura executiva da operação em menos de 10 segundos.',
    features: ['KPIs gerais', 'Prioridades operacionais', 'Atividades recentes', 'Atalhos por perfil'],
    flow: ['Acesso ao sistema', 'Consolidação de indicadores', 'Ranqueamento de riscos', 'Decisão gerencial'],
    permissions: 'Diretoria, Gerência, Supervisão e perfis autorizados.',
    benefits: ['Visão rápida', 'Menos dependência de planilhas', 'Foco em risco e decisão'],
    shot: 'dashboard-executivo'
  },
  {
    title: 'Agenda Operacional',
    icon: 'CalendarDays',
    objective: 'Transformar planejamento e programação em rotina operacional acompanhável.',
    features: ['Importação XLS', 'Leitura de abas', 'Planejamento por supervisor', 'Criação manual por dia', 'Arrastar e editar atividades', 'Eventos e lembretes'],
    flow: ['Planejamento importado ou criado', 'Supervisor revisa', 'Atividade recebe área, equipe e EBAP', 'Evento pode gerar OS', 'Execução é acompanhada'],
    permissions: 'Supervisor por área; Gerência, Diretoria e Administração com visão global; CCO em leitura quando aplicável.',
    benefits: ['Agenda real de operação', 'Redução de planilhas paralelas', 'Visão por Mecânica, Elétrica e Automação'],
    shot: 'agenda-operacional'
  },
  {
    title: 'Ordens de Serviço',
    icon: 'Wrench',
    objective: 'Ser a central única para abertura, execução, validação e rastreabilidade das OS.',
    features: ['KPIs da carteira', 'Pesquisa e filtros', 'Nova OS', 'Detalhe operacional', 'Histórico compacto', 'Anexos'],
    flow: ['Solicitação', 'Triagem', 'Supervisão', 'Execução técnica', 'Validação', 'Encerramento'],
    permissions: 'Operação, Técnico, Supervisor, CCO, Fiscal Operacional, Prefeitura, Gerência e Diretoria conforme escopo.',
    benefits: ['Rastreabilidade', 'Padronização', 'Fila única de acompanhamento'],
    shot: 'ordens-servico'
  },
  {
    title: 'RDO',
    icon: 'FileText',
    objective: 'Registrar diariamente a condição operacional das EBAPs com evidências.',
    features: ['Fluxo mobile first', 'Status rápidos', 'Fotos obrigatórias', 'Auto save', 'Validação CCO'],
    flow: ['Operador inicia RDO', 'Preenche etapas', 'Anexa evidências', 'Envia ao CCO', 'CCO aprova', 'Sistema consolida'],
    permissions: 'Operador preenche; CCO valida; Gerência e Diretoria acompanham.',
    benefits: ['Rastreabilidade diária', 'Menos retrabalho', 'Evidência operacional confiável'],
    shot: 'mobile-rdo'
  },
  {
    title: 'Ativos',
    icon: 'Boxes',
    objective: 'Manter a fonte única de verdade dos equipamentos das EBAPs.',
    features: ['Status por equipamento', 'Agrupamento por EBAP', 'Histórico', 'Integração com OS', 'Indicadores operacionais'],
    flow: ['Ativo é consultado', 'OS ou RDO altera situação', 'Histórico é gravado', 'Dashboards e sala de situação refletem o status'],
    permissions: 'Operação, Supervisão, Manutenção, Gerência e Diretoria conforme atribuições.',
    benefits: ['Controle patrimonial operacional', 'Histórico técnico', 'Base para indicadores'],
    shot: 'ativos'
  },
  {
    title: 'Sala de Situação',
    icon: 'ShieldAlert',
    objective: 'Concentrar EBAPs críticas, ocorrências e prioridades de resposta.',
    features: ['Riscos destacados', 'Prioridades por unidade', 'Visão para CCO e gestão', 'Consolidação operacional'],
    flow: ['Dados chegam de OS, RDO e Ativos', 'Sistema calcula criticidade', 'Equipe prioriza resposta', 'Gestão acompanha impacto'],
    permissions: 'CCO, Supervisão, Gerência e Diretoria.',
    benefits: ['Resposta rápida', 'Gestão de crise', 'Priorização objetiva'],
    shot: 'sala-situacao'
  },
  {
    title: 'Mapa Operacional',
    icon: 'MapPinned',
    objective: 'Exibir localização e situação das EBAPs em visão geográfica.',
    features: ['Mapa das unidades', 'Status por ponto', 'Link de localização', 'Contexto geográfico'],
    flow: ['Usuário abre mapa', 'Seleciona unidade', 'Consulta status e localização', 'Aciona rotina operacional'],
    permissions: 'Perfis operacionais e de gestão autorizados.',
    benefits: ['Leitura territorial', 'Apoio ao deslocamento', 'Visão executiva geográfica'],
    shot: 'mapa-operacional'
  },
  {
    title: 'Comunicação',
    icon: 'MessageCircle',
    objective: 'Manter comunicação operacional registrada e auditável dentro do SIGEBAP.',
    features: ['Conversas', 'Grupos', 'Arquivos', 'Áudio', 'Pesquisa de pessoas', 'Presença'],
    flow: ['Usuário localiza pessoa ou grupo', 'Envia mensagem, mídia ou áudio', 'Leituras são registradas', 'Histórico permanece no sistema'],
    permissions: 'Cada usuário visualiza suas conversas e grupos autorizados.',
    benefits: ['Alternativa corporativa ao WhatsApp', 'Rastreabilidade', 'Comunicação vinculada à operação'],
    shot: 'chat'
  },
  {
    title: 'Gestão e Suprimentos',
    icon: 'ShoppingCart',
    objective: 'Apoiar compras, almoxarifado e administração em processos conectados à operação.',
    features: ['Solicitações de compra', 'Controle de estoque', 'Frota', 'Documentos', 'Alertas administrativos'],
    flow: ['Demanda nasce da operação', 'Compra ou estoque é acionado', 'Administração acompanha', 'Gestão consolida'],
    permissions: 'Perfis administrativos, almoxarifado, financeiro, gerência e diretoria.',
    benefits: ['Menos controles paralelos', 'Integração com OS', 'Visibilidade de pendências'],
    shot: 'compras'
  }
];

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function asset(file) {
  return path.relative(DOCS, path.join(SHOTS, `${file}.png`)).replaceAll('\\', '/');
}

function logoAsset() {
  return LOGO.replaceAll('\\', '/');
}

function heroAsset() {
  return HERO.replaceAll('\\', '/');
}

function fig(name, caption, type = 'desktop') {
  const number = figures.findIndex(([id]) => id === name) + 1;
  const figNumber = number > 0 ? number : 1;
  const chapter = Math.ceil(figNumber / 4);
  const item = ((figNumber - 1) % 4) + 1;
  const label = `${chapter}.${item}`;
  const cls = type === 'mobile' ? 'editorial-capture mobile-capture' : 'editorial-capture desktop-capture';
  return `
    <figure class="figure-block">
      <div class="${cls}"><img src="${asset(name)}" alt="${esc(caption)}" /></div>
      <figcaption><b>Figura ${label}</b> – ${esc(caption)}</figcaption>
    </figure>`;
}
function miniFlow(items) {
  return `<div class="flow">${items.map((item, idx) => `<div class="flow-step"><span>${idx + 1}</span>${esc(item)}</div>`).join('')}</div>`;
}

function chips(items) {
  return `<div class="chips">${items.map((item) => `<span>${esc(item)}</span>`).join('')}</div>`;
}

function modulePage(mod, index) {
  const mobile = mod.shot?.startsWith('mobile');
  return `
    <section class="page module-page" id="mod-${index}">
      <div class="module-header">
        <div>
          <div class="chapter-kicker">Capítulo ${String(index + 5).padStart(2, '0')}</div>
          <div class="chapter-icon">Módulo ${String(index + 1).padStart(2, '0')}</div>
          <h2>${esc(mod.title)}</h2>
          <p class="lead">${esc(mod.objective)}</p>
        </div>
        <div class="module-permission"><h3>Permissões</h3><p>${esc(mod.permissions)}</p></div>
      </div>
      <div class="module-summary">
        <div class="info-card"><h3>Funcionalidades</h3>${chips(mod.features)}</div>
        <div class="info-card"><h3>Fluxo operacional</h3>${miniFlow(mod.flow)}</div>
        <div class="info-card"><h3>Benefícios</h3>${chips(mod.benefits)}</div>
      </div>
      <div class="module-figure">${fig(mod.shot, `${mod.title} no SIGEBAP.`, mobile ? 'mobile' : 'desktop')}</div>
    </section>`;
}
function diagramSvg(name, title, items) {
  const width = 1320;
  const height = 420;
  const gap = 26;
  const itemWidth = Math.floor((width - 120 - gap * (items.length - 1)) / items.length);
  const y = 170;
  const boxes = items.map((item, i) => {
    const x = 60 + i * (itemWidth + gap);
    const arrow = i < items.length - 1 ? `<path d="M ${x + itemWidth + 7} ${y + 62} L ${x + itemWidth + gap - 8} ${y + 62}" stroke="#7dd3fc" stroke-width="4" stroke-linecap="round"/><path d="M ${x + itemWidth + gap - 18} ${y + 50} L ${x + itemWidth + gap - 6} ${y + 62} L ${x + itemWidth + gap - 18} ${y + 74}" fill="none" stroke="#7dd3fc" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : '';
    return `
      <rect x="${x}" y="${y}" width="${itemWidth}" height="124" rx="24" fill="#10245a" stroke="#3b82f6" opacity=".95"/>
      <circle cx="${x + 38}" cy="${y + 42}" r="18" fill="#2563eb"/>
      <text x="${x + 38}" y="${y + 49}" text-anchor="middle" font-family="Inter, Arial" font-size="17" font-weight="800" fill="#fff">${i + 1}</text>
      <text x="${x + 70}" y="${y + 48}" font-family="Inter, Arial" font-size="22" font-weight="800" fill="#fff">${esc(item[0])}</text>
      <text x="${x + 28}" y="${y + 88}" font-family="Inter, Arial" font-size="17" fill="#bfdbfe">${esc(item[1])}</text>
      ${arrow}`;
  }).join('');
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" x2="1"><stop offset="0" stop-color="#061836"/><stop offset="1" stop-color="#123c85"/></linearGradient>
      <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="#1d4ed8" stroke-width="1" opacity=".22"/></pattern>
    </defs>
    <rect width="1320" height="420" rx="34" fill="url(#bg)"/>
    <rect width="1320" height="420" rx="34" fill="url(#grid)"/>
    <text x="60" y="84" font-family="Inter, Arial" font-size="34" font-weight="850" fill="#fff">${esc(title)}</text>
    <text x="60" y="122" font-family="Inter, Arial" font-size="18" fill="#bfdbfe">Fluxo operacional consolidado para governança, rastreabilidade e tomada de decisão.</text>
    ${boxes}
  </svg>`;
}

async function writeDiagrams() {
  await fs.mkdir(DIAGRAMS, { recursive: true });
  const diagrams = [
    ['arquitetura-v4.svg', 'Arquitetura lógica do SIGEBAP', [['React', 'Interface web e mobile'], ['Supabase', 'Dados, autenticação e storage'], ['Realtime', 'Chat, presença e atualizações'], ['PDF', 'Relatórios e documentos'], ['Vercel', 'Publicação e operação']]],
    ['fluxo-os-v4.svg', 'Fluxo executivo das Ordens de Serviço', [['Abertura', 'Operação ou fiscalização'], ['Triagem', 'CCO e supervisão'], ['Execução', 'Equipe técnica'], ['Validação', 'Supervisor responsável'], ['Registro', 'Histórico e indicadores']]],
    ['fluxo-rdo-v4.svg', 'Fluxo de RDO com evidências', [['Operador', 'Preenchimento mobile'], ['Fotos', 'Evidências obrigatórias'], ['CCO', 'Validação operacional'], ['Ativos', 'Atualização controlada'], ['Indicadores', 'Dashboard e situação']]],
    ['roadmap-v4.svg', 'Roadmap executivo', [['Concluído', 'Base operacional e UI Kit'], ['Atual', 'Documentação e consolidação'], ['Próximo', 'Indicadores avançados'], ['Futuro', 'Sala de situação integrada'], ['Escala', 'Automação e BI']]]
  ];
  for (const [file, title, items] of diagrams) {
    await fs.writeFile(path.join(DIAGRAMS, file), diagramSvg(file, title, items), 'utf8');
  }
}

function diagram(file, caption) {
  return `
    <figure class="diagram-block">
      <img src="${path.relative(DOCS, path.join(DIAGRAMS, file)).replaceAll('\\', '/')}" alt="${esc(caption)}" />
      <figcaption>${esc(caption)}</figcaption>
    </figure>`;
}

function html() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SIGEBAP - Documento Executivo Corporativo v4.0</title>
  <style>
    @page { size: A4 landscape; margin: 0; }
    :root {
      --bg: #050f26; --panel: #0c1c43; --panel2: #102b63; --line: rgba(173, 205, 255, .22);
      --blue: #2563eb; --blue2: #60a5fa; --text: #f8fbff; --muted: #bfd2f6; --soft: #dbeafe;
      --amber: #f59e0b; --red: #ef4444; --cyan: #22d3ee; --green: #38bdf8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; background: #020817; color: var(--text);
      font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 16px; line-height: 1.5;
    }
    .page {
      width: 297mm; height: 210mm; max-height: 210mm; page-break-after: always; position: relative; overflow: hidden;
      padding: 18mm 22mm; background:
        linear-gradient(90deg, rgba(37,99,235,.09) 1px, transparent 1px),
        linear-gradient(0deg, rgba(37,99,235,.08) 1px, transparent 1px),
        radial-gradient(circle at 85% 12%, rgba(37, 99, 235, .42), transparent 36%),
        radial-gradient(circle at 12% 88%, rgba(96, 165, 250, .22), transparent 28%),
        linear-gradient(135deg, #06122c 0%, #081b44 47%, #102b63 100%);
      background-size: 42px 42px, 42px 42px, auto, auto, auto;
    }
    .page::after { content: "SIGEBAP v4.0"; position: absolute; bottom: 10mm; right: 18mm; color: rgba(219,234,254,.48); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; }
    .cover {
      padding: 0; display: grid; grid-template-columns: 1.05fr .95fr;
      background-image: linear-gradient(90deg, rgba(4,15,40,.96), rgba(7,25,62,.86)), url("${heroAsset()}");
      background-size: cover; background-position: center;
    }
    .cover-left { padding: 22mm 22mm; display: flex; flex-direction: column; justify-content: space-between; min-height: 210mm; }
    .logo-wrap { display: flex; align-items: center; gap: 18px; }
    .logo-wrap img { width: 124px; height: auto; filter: drop-shadow(0 18px 30px rgba(0,0,0,.45)); }
    .brand-title { font-size: 18px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .cover h1 { margin: 18mm 0 0; font-size: 68px; line-height: .88; letter-spacing: -.04em; }
    .cover h1 span { display: block; color: var(--blue2); }
    .cover .subtitle { margin-top: 18px; max-width: 760px; font-size: 26px; line-height: 1.24; color: var(--soft); font-weight: 600; }
    .cover .version { margin-top: 26px; display: inline-flex; width: fit-content; border: 1px solid rgba(147,197,253,.36); background: rgba(15,35,83,.74); border-radius: 999px; padding: 10px 16px; font-weight: 700; color: #dbeafe; }
    .authors { align-self: end; margin: 22mm 22mm 22mm 0; padding: 22px; width: 450px; border: 1px solid var(--line); border-radius: 30px; background: rgba(10,25,60,.72); backdrop-filter: blur(12px); box-shadow: 0 30px 90px rgba(0,0,0,.35); }
    .authors h2 { margin: 0 0 18px; font-size: 18px; color: var(--blue2); text-transform: uppercase; letter-spacing: .16em; }
    .author { padding: 16px 0; border-top: 1px solid rgba(191,219,254,.16); }
    .author b { display: block; font-size: 19px; }
    .author span { display: block; color: var(--muted); font-size: 13px; }
    h2 { margin: 0; font-size: 40px; line-height: 1.05; letter-spacing: -.03em; }
    h3 { margin: 0 0 10px; font-size: 20px; }
    .lead { margin: 10px 0 0; color: var(--soft); font-size: 20px; max-width: 820px; }
    .kicker, .chapter-kicker { color: #93c5fd; letter-spacing: .28em; text-transform: uppercase; font-size: 13px; font-weight: 800; }
    .toc-grid { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 36px; }
    .toc-line { display: grid; grid-template-columns: 42px 1fr 42px; gap: 10px; align-items: baseline; border-bottom: 1px dotted rgba(191,219,254,.28); padding: 9px 0; color: var(--soft); }
    .toc-line b { color: white; font-size: 18px; }
    .executive-grid { margin-top: 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .metric, .info-card, .feature-card {
      border: 1px solid var(--line); border-radius: 24px; background: linear-gradient(145deg, rgba(21, 48, 105, .82), rgba(8, 23, 56, .88));
      padding: 16px; box-shadow: 0 18px 45px rgba(0,0,0,.22);
    }
    .metric strong { display: block; font-size: 38px; line-height: 1; }
    .metric span { display: block; margin-top: 8px; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.split { display: grid; grid-template-columns: .94fr 1.06fr; gap: 22px; align-items: center; height: 100%; }
.chapter-icon { width: fit-content; margin-bottom: 14px; color: #bfdbfe; background: rgba(37,99,235,.22); border: 1px solid rgba(147,197,253,.32); border-radius: 18px; padding: 12px 16px; font-size: 14px; font-weight: 800; }
.info-grid { margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.info-card p { margin: 0; color: var(--soft); }
.info-card.wide { grid-column: 1 / -1; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chips span { border: 1px solid rgba(147,197,253,.28); border-radius: 999px; background: rgba(37,99,235,.16); padding: 7px 10px; color: #dbeafe; font-size: 13px; font-weight: 700; }
.flow { display: flex; flex-wrap: wrap; gap: 8px; }
.flow-step { display: flex; align-items: center; gap: 8px; color: var(--soft); font-weight: 700; }
.flow-step span { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 999px; background: var(--blue); color: white; font-size: 12px; }
.module-page .split { align-items: start; }
.module-page h2 { font-size: 38px; margin: 12px 0 10px; }
.module-page .lead { font-size: 18px; line-height: 1.34; max-width: 520px; }
.module-page .chapter-icon { margin-bottom: 10px; padding: 10px 14px; border-radius: 16px; }
.module-page .info-grid { margin-top: 12px; gap: 8px; }
.module-page .info-card { padding: 14px 16px; border-radius: 18px; }
.module-page .info-card h3 { font-size: 18px; margin-bottom: 10px; }
.module-page .chips { gap: 6px; }
.module-page .chips span { font-size: 12px; padding: 6px 9px; }
.module-page .flow { gap: 6px; }
.module-page .flow-step { font-size: 13px; gap: 6px; }
.module-page .flow-step span { width: 20px; height: 20px; font-size: 11px; }
    .figure-block { margin: 0; break-inside: avoid; width: 100%; }
    .editorial-capture { width: 88%; margin: 0 auto; border-radius: 28px; overflow: hidden; }
    .editorial-capture img { display: block; width: 100%; height: auto; object-fit: contain; }
    .desktop-capture { max-width: 980px; }
    .mobile-capture { width: 56%; max-width: 520px; }
    .module-page .editorial-capture { width: 92%; }
    .gallery .editorial-capture { width: 94%; }
    .gallery .mobile-capture { width: 52%; }    figcaption { margin-top: 10px; color: #cbdafe; font-size: 13px; text-align: center; }
    .diagram-block { margin: 18px 0 0; }
    .diagram-block img { width: 100%; border-radius: 24px; box-shadow: 0 22px 60px rgba(0,0,0,.28); }
    .diagram-block figcaption { text-align: left; }
    .cards-3 { margin-top: 18px; display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
    .feature-card b { display: block; font-size: 22px; margin-bottom: 6px; }
    .feature-card p { margin: 0; color: var(--muted); }
    .gallery { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; align-items: start; }
    .gallery .figure-block:nth-child(3) { grid-column: 1 / -1; width: 66%; margin-inline: auto; }
    .roadmap { display: grid; grid-template-columns: repeat(4,1fr); gap: 18px; margin-top: 32px; }
    .road { border: 1px solid var(--line); border-radius: 24px; padding: 20px; background: rgba(13,31,75,.68); }
    .road b { display: block; font-size: 22px; }
    .road span { color: var(--muted); }
    .appendix-list { columns: 3; column-gap: 28px; margin-top: 22px; color: var(--soft); }
    .appendix-list li { break-inside: avoid; margin-bottom: 8px; }
.module-page { display: flex; flex-direction: column; gap: 12px; }
.module-header { display: grid; grid-template-columns: 1.15fr .85fr; gap: 18px; align-items: end; }
.module-header h2 { font-size: 34px; margin: 8px 0 6px; }
.module-header .lead { font-size: 16px; line-height: 1.3; max-width: 700px; margin-top: 0; }
.module-permission { border: 1px solid var(--line); border-radius: 20px; padding: 14px 16px; background: rgba(13,31,75,.68); }
.module-permission h3 { font-size: 16px; margin-bottom: 6px; }
.module-permission p { margin: 0; color: var(--soft); font-size: 14px; line-height: 1.35; }
.module-summary { display: grid; grid-template-columns: 1fr 1.05fr 1fr; gap: 10px; }
.module-summary .info-card { padding: 12px 14px; border-radius: 18px; min-height: 92px; }
.module-summary .info-card h3 { font-size: 16px; margin-bottom: 8px; }
.module-summary .chips span { font-size: 11px; padding: 5px 8px; }
.module-summary .flow-step { font-size: 11px; gap: 5px; }
.module-summary .flow-step span { width: 18px; height: 18px; font-size: 10px; }
.module-figure { flex: 1; display: grid; place-items: center; min-height: 0; }
.module-figure .figure-block { width: 100%; }
.module-figure .editorial-capture { width: 88%; max-width: 980px; }
.module-figure .mobile-capture { width: 34%; max-width: 360px; }
.module-figure .editorial-capture { width: auto; max-width: 94%; max-height: 82mm; display: flex; justify-content: center; align-items: center; }
.module-figure .editorial-capture img { width: auto; max-width: 100%; max-height: 82mm; height: auto; object-fit: contain; }
.module-figure .mobile-capture { width: auto; max-width: 40%; max-height: 82mm; }
.module-figure .mobile-capture img { max-height: 82mm; }
.gallery .editorial-capture { width: auto; max-width: 94%; max-height: 92mm; display: flex; justify-content: center; align-items: center; }
.gallery .editorial-capture img { width: auto; max-width: 100%; max-height: 92mm; height: auto; object-fit: contain; }
.gallery .mobile-capture { max-height: 130mm; }
.gallery .mobile-capture img { max-height: 130mm; }
    .no-break { break-inside: avoid; }
  </style>
</head>
<body>
  <section class="page cover">
    <div class="cover-left">
      <div class="logo-wrap">
        <img src="${logoAsset()}" alt="Logo União Obracon" />
        <div><div class="brand-title">Consórcio União Obracon</div><div style="color:#bfdbfe">Documento institucional executivo</div></div>
      </div>
      <div>
        <h1>SIGEBAP <span>4.0</span></h1>
        <p class="subtitle">Sistema Integrado de Gestão das Estações Elevatórias de Águas Pluviais</p>
        <div class="version">Documento Executivo Corporativo · Versão 4.0 · ${today}</div>
      </div>
      <div style="color:#bfdbfe;max-width:720px">Material institucional para apresentação à Gerência e Diretoria, com visão executiva, arquitetura, módulos, fluxos operacionais e mockups profissionais das telas.</div>
    </div>
    <aside class="authors">
      <h2>Autores</h2>
      <div class="author"><b>João Lucas Soares Almeida</b><span>Idealizador · Analista de Sistemas · Arquiteto de Software · Desenvolvedor Full Stack</span></div>
      <div class="author"><b>Alex Gomes de Matos Martins</b><span>Idealizador Operacional · Especialista Operacional · Gerência Técnica</span></div>
    </aside>
  </section>

  <section class="page">
    <div class="kicker">Sumário executivo</div>
    <h2>Conteúdo do documento</h2>
    <p class="lead">Organização editorial para leitura executiva, técnica e operacional.</p>
    <div class="toc-grid">
      ${[
        ['01','Introdução', '03'], ['02','História do Projeto', '04'], ['03','Arquitetura do Sistema', '05'], ['04','Perfis e Governança', '06'],
        ['05','Dashboard Executivo', '07'], ['06','Agenda Operacional', '08'], ['07','Ordens de Serviço', '09'], ['08','RDO', '10'],
        ['09','Ativos e Sala de Situação', '11'], ['10','Mapa Operacional', '12'], ['11','Gestão e Suprimentos', '13'], ['12','Comunicação', '14'],
          ['13','Experiência Mobile', '15'], ['14','Roadmap', '16'], ['15','Galeria de Mockups', '17'], ['16','Conclusão', '24']
      ].map(([n,t,p]) => `<div class="toc-line"><b>${n}</b><span>${t}</span><b>${p}</b></div>`).join('')}
    </div>
  </section>

  <section class="page">
    <div class="kicker">Introdução</div>
    <h2>Uma plataforma operacional para gestão das EBAPs</h2>
    <p class="lead">O SIGEBAP consolida operação, manutenção, comunicação, documentação e governança das Estações Elevatórias de Águas Pluviais em uma única plataforma corporativa.</p>
    <div class="executive-grid">
      <div class="metric"><strong>11</strong><span>EBAPs estruturadas</span></div>
      <div class="metric"><strong>120+</strong><span>ativos operacionais</span></div>
      <div class="metric"><strong>360°</strong><span>rastreabilidade</span></div>
      <div class="metric"><strong>1</strong><span>fonte da verdade</span></div>
    </div>
    <div class="cards-3">
      <div class="feature-card"><b>Operação</b><p>RDO, CCO, Sala de Situação, comunicação e acompanhamento em campo.</p></div>
      <div class="feature-card"><b>Manutenção</b><p>OS, ativos, planejamento, agenda e histórico técnico integrado.</p></div>
      <div class="feature-card"><b>Gestão</b><p>Compras, almoxarifado, administrativo, indicadores e documentação executiva.</p></div>
    </div>
    ${fig('login-desktop', 'Tela de acesso institucional do SIGEBAP.')}
  </section>

  <section class="page">
    <div class="kicker">História do Projeto</div>
    <h2>Da necessidade operacional ao produto corporativo</h2>
    <p class="lead">O SIGEBAP nasce da operação real das EBAPs, evoluindo de controles dispersos para uma plataforma integrada, auditável e orientada a decisão.</p>
    <div class="roadmap">
      <div class="road"><b>Diagnóstico</b><span>Identificação de lacunas em rastreabilidade, comunicação, RDO, OS e ativos.</span></div>
      <div class="road"><b>Estruturação</b><span>Criação da arquitetura integrada com Supabase, módulos operacionais e perfis.</span></div>
      <div class="road"><b>Modernização</b><span>Design System, mobile nativo, dashboards executivos e documentação corporativa.</span></div>
      <div class="road"><b>Escala</b><span>Base preparada para indicadores, sala de situação, automações e BI.</span></div>
    </div>
    ${diagram('roadmap-v4.svg', 'Linha do tempo executiva do SIGEBAP.')}
  </section>

  <section class="page">
    <div class="kicker">Arquitetura</div>
    <h2>Arquitetura operacional integrada</h2>
    <p class="lead">A plataforma utiliza React, Supabase, Storage, Realtime e geração documental para conectar módulos sem duplicidade de informação.</p>
    ${diagram('arquitetura-v4.svg', 'Arquitetura lógica do SIGEBAP.')}
    <div class="cards-3">
      <div class="feature-card"><b>Frontend React</b><p>Interface web e mobile com rotas protegidas e componentes oficiais do UI Kit.</p></div>
      <div class="feature-card"><b>Supabase</b><p>Banco, autenticação de aplicação, políticas RLS, arquivos e realtime.</p></div>
      <div class="feature-card"><b>Governança</b><p>Perfis, permissões, histórico, auditoria e documentos PDF.</p></div>
    </div>
  </section>

  <section class="page">
    <div class="kicker">Perfis</div>
    <h2>Governança por perfil de acesso</h2>
    <p class="lead">Cada usuário visualiza somente o que faz sentido para sua função, reduzindo complexidade e aumentando segurança operacional.</p>
    <div class="cards-3">
      <div class="feature-card"><b>Operador</b><p>RDO, abertura de OS, comunicação e acompanhamento da EBAP.</p></div>
      <div class="feature-card"><b>Técnico</b><p>Execução de OS, anexos, evidências, materiais e conclusão técnica.</p></div>
      <div class="feature-card"><b>Supervisor</b><p>Fila de OS, validação, planejamento, equipe e agenda por área.</p></div>
      <div class="feature-card"><b>CCO</b><p>Validação de RDO e OS operacionais, comunicação e visão de situação.</p></div>
      <div class="feature-card"><b>Gerência e Diretoria</b><p>Dashboards, indicadores, riscos, histórico e visão consolidada.</p></div>
      <div class="feature-card"><b>Prefeitura e Fiscal</b><p>Abertura ou acompanhamento simplificado conforme perfil autorizado.</p></div>
    </div>
    ${fig('navegacao-sistema', 'Navegação principal do SIGEBAP.')}
  </section>

  ${modules.map(modulePage).join('')}

  <section class="page">
    <div class="kicker">Fluxos principais</div>
    <h2>Rastreabilidade de ponta a ponta</h2>
    <p class="lead">Os fluxos foram desenhados para evitar informações paralelas e manter histórico auditável desde o campo até a gestão.</p>
    ${diagram('fluxo-os-v4.svg', 'Fluxo executivo das Ordens de Serviço.')}
    ${diagram('fluxo-rdo-v4.svg', 'Fluxo de RDO com evidências e validação CCO.')}
  </section>

  <section class="page">
    <div class="kicker">Experiência Mobile</div>
    <h2>Aplicativo operacional para campo</h2>
    <p class="lead">A versão mobile não replica o desktop. Ela prioriza botões grandes, fotos, áudio, checklist, status rápidos e navegação inferior.</p>
    <div class="gallery">
      ${fig('mobile-operador', 'Experiência mobile para Operador.', 'mobile')}
      ${fig('mobile-tecnico', 'Experiência mobile para Técnico.', 'mobile')}
      ${fig('mobile-fiscal-operacional', 'Experiência mobile para Fiscal Operacional.', 'mobile')}
    </div>
  </section>

  <section class="page">
    <div class="kicker">Galeria executiva</div>
    <h2>Mockups das principais telas</h2>
    <p class="lead">Todas as imagens foram capturadas novamente após a correção de encoding e aplicadas em frames visuais profissionais.</p>
    <div class="gallery">
      ${fig('nova-os', 'Abertura de nova Ordem de Serviço.')}
      ${fig('detalhes-os', 'Detalhamento e histórico da OS.')}
    </div>
  </section>
  <section class="page">
    <div class="gallery">
      ${fig('cco-rdo', 'Validação CCO de Relatórios Diários.')}
      ${fig('cco-os', 'Validação CCO de Ordens de Serviço.')}
    </div>
  </section>
  <section class="page">
    <div class="gallery">
      ${fig('planejamento', 'Planejamento de Manutenção.')}
      ${fig('agenda-calendario', 'Calendário operacional de atividades.')}
      ${fig('importacao-xls', 'Importação XLS para cronograma.')}
    </div>
  </section>
  <section class="page">
    <div class="gallery">
      ${fig('almoxarifado', 'Gestão de Almoxarifado.')}
      ${fig('administrativo', 'Módulo Administrativo.')}
      ${fig('alertas', 'Central de Alertas.')}
    </div>
  </section>

  <section class="page">
    <div class="kicker">Roadmap</div>
    <h2>Próximas versões</h2>
    <p class="lead">A plataforma está preparada para crescer com novas camadas de automação, indicadores e integração executiva.</p>
    <div class="roadmap">
      <div class="road"><b>Concluído</b><span>Dashboard, OS, RDO, CCO, Ativos, Chat, Mobile, UI Kit e documentação.</span></div>
      <div class="road"><b>Em desenvolvimento</b><span>Agenda operacional avançada, calendário e simplificação de execução técnica.</span></div>
      <div class="road"><b>Próximas versões</b><span>Indicadores analíticos, BI, automações e relatórios executivos recorrentes.</span></div>
      <div class="road"><b>Visão futura</b><span>Sala de Situação integrada, previsibilidade operacional e inteligência de manutenção.</span></div>
    </div>
    ${diagram('roadmap-v4.svg', 'Roadmap corporativo do SIGEBAP.')}
  </section>

  <section class="page">
    <div class="kicker">Apêndice</div>
    <h2>Inventário visual capturado</h2>
    <p class="lead">Lista das capturas novas utilizadas como base visual do documento.</p>
    <ol class="appendix-list">
      ${figures.map(([id, cap]) => `<li><b>${esc(id)}</b><br><span>${esc(cap)}</span></li>`).join('')}
    </ol>
  </section>

  <section class="page">
    <div class="kicker">Conclusão</div>
    <h2>Um produto corporativo para operação, gestão e decisão</h2>
    <p class="lead">O SIGEBAP consolida a operação das EBAPs em uma plataforma única, com rastreabilidade, visão executiva, comunicação interna e base técnica preparada para evolução contínua.</p>
    <div class="executive-grid">
      <div class="metric"><strong>Governança</strong><span>Perfis, permissões e histórico</span></div>
      <div class="metric"><strong>Operação</strong><span>RDO, OS, CCO e ativos</span></div>
      <div class="metric"><strong>Gestão</strong><span>KPIs, prioridades e indicadores</span></div>
      <div class="metric"><strong>Escala</strong><span>Base pronta para automação</span></div>
    </div>
    ${fig('ui-kit', 'UI Kit do SIGEBAP como base de consistência visual.')}
  </section>
</body>
</html>`;
}

async function validateHtml(content) {
  const hits = badPatterns.filter((pattern) => content.includes(pattern));
  if (hits.length) throw new Error(`Documento contém padrões inválidos: ${hits.join(', ')}`);
  for (const [name] of figures) {
    try {
      await fs.access(path.join(SHOTS, `${name}.png`));
    } catch {
      throw new Error(`Screenshot ausente: ${name}.png`);
    }
  }
}

async function main() {
  await fs.mkdir(ASSETS, { recursive: true });
  await writeDiagrams();
  const content = html();
  await validateHtml(content);
  await fs.writeFile(HTML_OUT, content, 'utf8');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1131 }, deviceScaleFactor: 1 });
  await page.goto(`file://${HTML_OUT.replaceAll('\\', '/')}`, { waitUntil: 'networkidle' });
  await page.pdf({
    path: PDF_OUT,
    format: 'A4',
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true
  });
  await browser.close();
  console.log(JSON.stringify({ html: HTML_OUT, pdf: PDF_OUT }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});






