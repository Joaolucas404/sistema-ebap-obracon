import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'docs', 'assets', 'screenshots');
const BASE_URL = process.env.SIGEBAP_BASE_URL || 'http://localhost:5173';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yjsaopegtvumdeucgdde.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eS1uzB3zbYB-LW5kRKRvqw_iyF3cQjR';

const DESKTOP_VIEWPORT = { width: 2560, height: 1440 };
const MOBILE_VIEWPORT = { width: 430, height: 932 };
const CANVAS = { width: 2400, height: 1350 };
const PHONE_CANVAS = { width: 1920, height: 1920 };
const CAPTURE_MARGIN = 96;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const baseUser = {
  id: '7bbedc5a-124f-48c4-95f6-da0ed9eed587',
  usuario: 'admin',
  nome: 'Administrador',
  perfil: 'diretoria',
  setor: 'Diretoria',
  area_operacional: 'todas',
  area_supervisao: null,
  equipe: null,
  ebap_id: null,
  status_aprovacao: 'aprovado',
  ativo: true,
  cargo: 'Diretoria',
  foto_url: '',
  ultimo_login: new Date().toISOString(),
  criado_em: '2026-06-17T19:44:18.705475+00:00'
};

const roleUsers = {
  operador: { ...baseUser, nome: 'Operador SIGEBAP', usuario: 'operador.demo', perfil: 'operador', setor: 'Operação', cargo: 'Operador', area_operacional: 'operacao' },
  supervisor: { ...baseUser, nome: 'Supervisor SIGEBAP', usuario: 'supervisor.demo', perfil: 'supervisor', setor: 'Supervisão', cargo: 'Supervisor', area_operacional: 'mecanica', area_supervisao: 'mecanica' },
  tecnico: { ...baseUser, nome: 'Técnico SIGEBAP', usuario: 'tecnico.demo', perfil: 'tecnico', setor: 'Manutenção', cargo: 'Técnico', equipe: 'Mecânica C', area_operacional: 'mecanica' },
  cco: { ...baseUser, nome: 'CCO SIGEBAP', usuario: 'cco.demo', perfil: 'cco', setor: 'CCO', cargo: 'CCO' },
  prefeitura: { ...baseUser, nome: 'Prefeitura', usuario: 'prefeitura.demo', perfil: 'prefeitura', setor: 'Prefeitura', cargo: 'Fiscalização' },
  fiscal_operacional: { ...baseUser, nome: 'Fiscal Operacional', usuario: 'fiscal.op', perfil: 'fiscal_operacional', setor: 'Prefeitura', cargo: 'Fiscal Operacional' }
};

const badPatterns = [
  '\uFFFD', 'ï¿½', 'Ã§', 'Ã£', 'Ã¡', 'Ã©', 'Ãª', 'Ã³', 'Ã´', 'Ãº', 'Â ', '??', 'T?', 'Situa??', 'Valida??', 'Hist?', 'Opera??',
  'Manuten??', 'Configura??', 't?cnic', 'Di?rio', 'Relat?rio'
];

const sidebarOnlyShots = new Set(['navegacao-sistema']);
const desktopMainShots = new Set([
  'dashboard-executivo', 'agenda-operacional', 'ordens-servico', 'dashboard-supervisor', 'sala-situacao',
  'rdo-desktop', 'cco-rdo', 'cco-os', 'ativos', 'mapa-operacional', 'planejamento', 'compras',
  'almoxarifado', 'administrativo', 'chat', 'alertas', 'configuracoes', 'ui-kit', 'nova-os',
  'detalhes-os', 'agenda-calendario', 'importacao-xls', 'chat-grupos'
]);

function authState(user = baseUser) {
  return JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 });
}

async function resetDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function setSession(page, user = baseUser) {
  await page.addInitScript((state) => window.localStorage.setItem('ebaps-auth-session', state), authState(user));
  await page.evaluate((state) => window.localStorage.setItem('ebaps-auth-session', state), authState(user)).catch(() => {});
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.addStyleTag({
    content: `
      * { caret-color: transparent !important; }
      html, body, #root { background: #07142f !important; }
      .vite-error-overlay, vite-error-overlay { display: none !important; }
      .leaflet-control-attribution { display: none !important; }
      [data-codex-overlay], .codex-assistant, .floating-assistant, .support-widget, .chatbot-widget { display: none !important; }
      .desktop-main, main { scroll-behavior: auto !important; }
      * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
    `
  }).catch(() => {});
  await page.waitForTimeout(1000);
}

async function validateText(page, name) {
  const visibleText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  const hits = badPatterns.filter((pattern) => visibleText.includes(pattern));
  if (hits.length) throw new Error(`Texto quebrado em ${name}: ${hits.join(', ')}`);
}

async function prepareEditorialView(page, name) {
  if (sidebarOnlyShots.has(name)) {
    await page.addStyleTag({ content: `
      .topbar-shell { display: none !important; }
      .desktop-main { display: none !important; }
      .nav-shell { position: fixed !important; inset: 0 auto 0 0 !important; height: 100vh !important; }
      body { overflow: hidden !important; }
    ` }).catch(() => {});
    return;
  }

  if (desktopMainShots.has(name)) {
    await page.addStyleTag({ content: `
      .nav-shell { display: none !important; }
      .topbar-shell { position: sticky !important; top: 0 !important; left: 0 !important; right: 0 !important; }
      .desktop-main { margin-left: 0 !important; width: 100vw !important; max-width: none !important; padding-left: 48px !important; padding-right: 48px !important; }
      body { overflow: auto !important; }
    ` }).catch(() => {});
  }
}

async function contentClip(page, name) {
  if (sidebarOnlyShots.has(name)) {
    const box = await page.locator('.nav-shell').boundingBox().catch(() => null);
    return box ? expandClip(box, 80, page) : null;
  }

  const selectors = desktopMainShots.has(name)
    ? ['.desktop-main', 'main', '#root']
    : ['#root', 'body'];

  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.count().catch(() => 0)) {
      const box = await locator.boundingBox().catch(() => null);
      if (box && box.width > 400 && box.height > 300) return expandClip(box, CAPTURE_MARGIN, page);
    }
  }
  return null;
}

async function expandClip(box, margin, page) {
  const viewport = page.viewportSize() || DESKTOP_VIEWPORT;
  const x = Math.max(0, Math.floor(box.x - margin));
  const y = Math.max(0, Math.floor(box.y - margin));
  const right = Math.min(viewport.width, Math.ceil(box.x + box.width + margin));
  const bottom = Math.min(viewport.height, Math.ceil(box.y + Math.min(box.height, viewport.height - box.y) + margin));
  return { x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) };
}

async function framedScreenshot(page, name, options = {}) {
  await settle(page);
  await validateText(page, name);
  await prepareEditorialView(page, name);
  await page.waitForTimeout(350);

  const rawPath = path.join(OUT, `${name}.raw.png`);
  const finalPath = path.join(OUT, `${name}.png`);
  const isMobile = options.mobile === true;

  if (sidebarOnlyShots.has(name)) {
    await page.locator('.nav-shell').screenshot({ path: rawPath });
  } else if (!isMobile && desktopMainShots.has(name) && await page.locator('.desktop-main').count().catch(() => 0)) {
    await page.locator('.desktop-main').screenshot({ path: rawPath });
  } else {
    const clip = isMobile ? null : await contentClip(page, name);
    await page.screenshot({ path: rawPath, fullPage: false, clip: clip || undefined });
  }

  await frameImage(page, rawPath, finalPath, (isMobile || sidebarOnlyShots.has(name)) ? PHONE_CANVAS : CANVAS, isMobile ? 'phone' : sidebarOnlyShots.has(name) ? 'sidebar' : 'desktop');
  await fs.rm(rawPath, { force: true });
  return finalPath;
}

async function frameImage(page, input, output, canvas, mode) {
  const bytes = await fs.readFile(input);
  const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
  const framePage = await page.context().newPage();
  await framePage.setViewportSize({ width: 2600, height: 2200 });
  await framePage.setContent(`<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  html, body { margin: 0; min-width: 100%; min-height: 100%; overflow: hidden; background: transparent; }
  body { display: inline-block; padding: ${mode === 'desktop' ? 34 : 38}px; font-family: Inter, Segoe UI, Arial, sans-serif; }
  .frame { display: inline-block; padding: ${mode === 'desktop' ? 16 : 18}px; border-radius: ${mode === 'desktop' ? 34 : 44}px; background: #fff; border: 3px solid #d8e6ff; box-shadow: 0 34px 84px rgba(10,22,51,.24); }
  img { display: block; width: ${mode === 'desktop' ? 2160 : mode === 'sidebar' ? 600 : 560}px; max-width: none; height: auto; border-radius: ${mode === 'desktop' ? 24 : 32}px; }
</style></head><body><div class="frame"><img src="${dataUrl}" /></div></body></html>`, { waitUntil: 'load' });
  const frame = framePage.locator('.frame');
  await frame.screenshot({ path: output });
  await framePage.close();
}
async function gotoShot(page, route, name, options = {}) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  return framedScreenshot(page, name, options);
}

async function clickByText(page, texts) {
  for (const text of texts) {
    const locator = page.getByText(text, { exact: false }).first();
    if (await locator.count().catch(() => 0)) {
      try {
        await locator.click({ timeout: 2500 });
        await page.waitForTimeout(900);
        return true;
      } catch {}
    }
  }
  return false;
}

async function main() {
  await resetDir(OUT);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: DESKTOP_VIEWPORT, deviceScaleFactor: 1, locale: 'pt-BR' });
  const page = await context.newPage();
  page.setDefaultTimeout(9000);

  const captured = [];
  const cap = async (route, name, options = {}) => {
    const file = await gotoShot(page, route, name, options);
    captured.push({ name, route, file, mode: options.mobile ? 'mobile' : 'desktop', editorial: true });
  };

  await cap('/login', 'login-desktop');
  await page.setViewportSize(MOBILE_VIEWPORT);
  await cap('/login', 'login-mobile', { mobile: true, fullPage: true });
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await setSession(page, baseUser);

  await cap('/dashboard', 'navegacao-sistema');

  const routes = [
    ['/dashboard', 'dashboard-executivo'],
    ['/agenda-operacional', 'agenda-operacional'],
    ['/os', 'ordens-servico'],
    ['/supervisao', 'dashboard-supervisor'],
    ['/sala-situacao-ebaps', 'sala-situacao'],
    ['/relatorio', 'rdo-desktop'],
    ['/cco-relatorios-diarios', 'cco-rdo'],
    ['/cco-analise-os', 'cco-os'],
    ['/ativos', 'ativos'],
    ['/localizacao-ebaps', 'mapa-operacional'],
    ['/manutencao', 'planejamento'],
    ['/compras', 'compras'],
    ['/almoxarifado', 'almoxarifado'],
    ['/administrativo', 'administrativo'],
    ['/comunicacao', 'chat'],
    ['/notificacoes', 'alertas'],
    ['/config', 'configuracoes'],
    ['/config/ui-kit', 'ui-kit']
  ];

  for (const [route, name] of routes) await cap(route, name);

  await gotoShot(page, '/os', 'ordens-servico-lista');
  await clickByText(page, ['Nova OS', 'Nova Ordem', 'Abrir OS']);
  captured.push({ name: 'nova-os', route: '/os', file: await framedScreenshot(page, 'nova-os'), mode: 'desktop', editorial: true });

  const { data: osRows } = await supabase.from('ordens_servico').select('id').order('created_at', { ascending: false }).limit(1);
  if (osRows?.[0]?.id) await cap(`/os/${osRows[0].id}`, 'detalhes-os');
  else await cap('/os', 'detalhes-os');

  await gotoShot(page, '/manutencao', 'agenda-calendario');
  await clickByText(page, ['Calendário', 'Calendario']);
  captured.push({ name: 'agenda-calendario', route: '/manutencao', file: await framedScreenshot(page, 'agenda-calendario'), mode: 'desktop', editorial: true });
  await clickByText(page, ['Importar', 'Importação', 'XLS']);
  captured.push({ name: 'importacao-xls', route: '/manutencao', file: await framedScreenshot(page, 'importacao-xls'), mode: 'desktop', editorial: true });

  await gotoShot(page, '/comunicacao', 'chat-conversas');
  await clickByText(page, ['Grupos']);
  captured.push({ name: 'chat-grupos', route: '/comunicacao', file: await framedScreenshot(page, 'chat-grupos'), mode: 'desktop', editorial: true });

  await page.setViewportSize(MOBILE_VIEWPORT);
  await setSession(page, roleUsers.operador);
  await cap('/relatorio', 'mobile-rdo', { mobile: true, fullPage: true });
  for (const [role, user] of Object.entries(roleUsers)) {
    await setSession(page, user);
    const route = role === 'operador' ? '/relatorio'
      : role === 'supervisor' ? '/agenda-operacional'
      : role === 'tecnico' ? '/os'
      : role === 'cco' ? '/cco-relatorios-diarios'
      : '/dashboard';
    await cap(route, `mobile-${role.replaceAll('_', '-')}`, { mobile: true, fullPage: true });
  }

  await browser.close();
  await fs.writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(captured, null, 2), 'utf8');
  console.log(JSON.stringify({ out: OUT, count: captured.length, canvas: CANVAS, phoneCanvas: PHONE_CANVAS }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});






