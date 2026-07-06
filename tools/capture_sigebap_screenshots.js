import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'docs', 'screenshots');
const BASE_URL = process.env.SIGEBAP_BASE_URL || 'http://localhost:5173';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yjsaopegtvumdeucgdde.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eS1uzB3zbYB-LW5kRKRvqw_iyF3cQjR';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const adminUser = {
  id: '7bbedc5a-124f-48c4-95f6-da0ed9eed587',
  usuario: 'admin',
  nome: 'Administrador',
  perfil: 'diretoria',
  setor: 'Diretoria',
  area_operacional: 'todas',
  area_supervisão: null,
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
  operador: { ...adminUser, nome: 'Operador SIGEBAP', usuario: 'operador.demo', perfil: 'operador', setor: 'Operação', cargo: 'Operador', area_operacional: 'operacao' },
  supervisor: { ...adminUser, nome: 'Supervisor SIGEBAP', usuario: 'supervisor.demo', perfil: 'supervisor', setor: 'Supervisão', cargo: 'Supervisor', area_operacional: 'mecanica' },
  tecnico: { ...adminUser, nome: 'Técnico SIGEBAP', usuario: 'tecnico.demo', perfil: 'tecnico', setor: 'Manutenção', cargo: 'Técnico', equipe: 'mecanica_c', area_operacional: 'mecanica' },
  cco: { ...adminUser, nome: 'CCO SIGEBAP', usuario: 'cco.demo', perfil: 'cco', setor: 'CCO', cargo: 'CCO' },
  fiscal_operacional: { ...adminUser, nome: 'Fiscal Operacional', usuario: 'fiscal.op', perfil: 'fiscal_operacional', setor: 'Prefeitura', cargo: 'Fiscal Operacional' },
  fiscal_gestor: { ...adminUser, nome: 'Fiscal Gestor', usuario: 'fiscal.gestor', perfil: 'fiscal_gestor', setor: 'Prefeitura', cargo: 'Fiscal Gestor' }
};

function authState(user = adminUser) {
  return JSON.stringify({ state: { user, isAuthenticated: true }, version: 0 });
}

async function ensureSession(page, user = adminUser) {
  await page.addInitScript((state) => {
    window.localStorage.setItem('ebaps-auth-session', state);
  }, authState(user));
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 3500 }).catch(() => {});
  await page.addStyleTag({
    content: `
      * { caret-color: transparent !important; }
      .vite-error-overlay, vite-error-overlay { display: none !important; }
      [data-codex], [class*="codex"] { display: none !important; }
    `
  }).catch(() => {});
  await page.waitForTimeout(900);
}

async function shot(page, name, options = {}) {
  const file = path.join(OUT, `${name}.png`);
  await settle(page);
  await page.screenshot({ path: file, fullPage: options.fullPage ?? false });
  return file;
}

async function gotoShot(page, route, name, options = {}) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  return shot(page, name, options);
}

async function clickByText(page, texts) {
  for (const text of texts) {
    const locator = page.getByText(text, { exact: false }).first();
    if (await locator.count().catch(() => 0)) {
      try {
        await locator.click({ timeout: 1500 });
        await page.waitForTimeout(600);
        return true;
      } catch {}
    }
  }
  return false;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(6000);

  await gotoShot(page, '/login', 'login-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoShot(page, '/login', 'login-mobile');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await ensureSession(page);

  const routes = [
    ['/dashboard', 'dashboard-executivo'],
    ['/os', 'ordens-servico'],
    ['/supervisão', 'supervisão'],
    ['/sala-situacao-ebaps', 'sala-situacao'],
    ['/agenda-operacional', 'agenda-operacional'],
    ['/manutencao', 'planejamento-manutencao'],
    ['/relatorio', 'rdo-desktop'],
    ['/cco-relatorios-diarios', 'cco-rdo'],
    ['/cco-analise-os', 'cco-os'],
    ['/ativos', 'ativos'],
    ['/localizacao-ebaps', 'mapa-operacional'],
    ['/compras', 'compras'],
    ['/almoxarifado', 'almoxarifado'],
    ['/administrativo', 'administrativo'],
    ['/usuarios', 'usuarios'],
    ['/perfil', 'perfil'],
    ['/config', 'configuracoes'],
    ['/config/ui-kit', 'ui-kit'],
    ['/comunicacao', 'chat'],
    ['/notificacoes', 'alertas']
  ];

  for (const [route, name] of routes) {
    await gotoShot(page, route, name);
  }

  await gotoShot(page, '/os', 'dashboard-os-consolidado');
  await clickByText(page, ['Nova OS', 'Nova Ordem', 'Abrir OS']);
  await shot(page, 'nova-ordem-servico');

  const { data: osRows } = await supabase.from('ordens_servico').select('id').order('created_at', { ascending: false }).limit(1);
  if (osRows?.[0]?.id) {
    await gotoShot(page, `/os/${osRows[0].id}`, 'detalhes-os');
  } else {
    await gotoShot(page, '/os', 'detalhes-os');
  }

  await gotoShot(page, '/manutencao', 'calendario-manutencao');
  await clickByText(page, ['Calendário', 'Calendario']);
  await shot(page, 'calendario');
  await clickByText(page, ['Importar', 'Importação', 'XLS']);
  await shot(page, 'importacao-xls');

  await gotoShot(page, '/comunicacao', 'conversa-individual');
  await clickByText(page, ['Alex', 'Administrador']);
  await shot(page, 'chat-conversa-individual');
  await clickByText(page, ['Grupos']);
  await shot(page, 'chat-grupos');

  await gotoShot(page, '/usuarios', 'perfis-permissoes');
  await gotoShot(page, '/config', 'permissoes');

  await page.setViewportSize({ width: 390, height: 844 });
  await gotoShot(page, '/relatorio', 'rdo-mobile', { fullPage: true });
  for (const [role, user] of Object.entries(roleUsers)) {
    await page.evaluate((state) => window.localStorage.setItem('ebaps-auth-session', state), authState(user));
    const route = role === 'operador' ? '/relatorio' : role === 'supervisor' ? '/agenda-operacional' : role === 'tecnico' ? '/os' : role === 'cco' ? '/cco-relatorios-diarios' : '/dashboard';
    await gotoShot(page, route, `tela-${role.replaceAll('_', '-')}`, { fullPage: true });
  }

  await browser.close();
  const files = await fs.readdir(OUT);
  console.log(JSON.stringify({ out: OUT, count: files.filter((f) => f.endsWith('.png')).length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
