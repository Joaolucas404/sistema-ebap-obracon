import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx';
import { normalizePerfil } from '../config/permissions.js';
import { useAuthStore } from '../store/authStore.js';
import PlaceholderPage from '../pages/PlaceholderPage.jsx';

const Almoxarifado = lazy(() => import('../pages/Almoxarifado.jsx'));
const Administrativo = lazy(() => import('../pages/Administrativo.jsx'));
const AgendaOperacional = lazy(() => import('../pages/AgendaOperacional.jsx'));
const ArquivoRelatorios = lazy(() => import('../pages/ArquivoRelatorios.jsx'));
const Ativos = lazy(() => import('../pages/Ativos.jsx'));
const CcoAnaliseOS = lazy(() => import('../pages/CcoAnaliseOS.jsx'));
const CcoRelatoriosDiarios = lazy(() => import('../pages/CcoRelatoriosDiarios.jsx'));
const Config = lazy(() => import('../pages/Config.jsx'));
const UiKit = lazy(() => import('../pages/UiKit.jsx'));
const Comunicacao = lazy(() => import('../pages/Comunicacao.jsx'));
const Compras = lazy(() => import('../pages/Compras.jsx'));
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const DetalheOS = lazy(() => import('../pages/DetalheOS.jsx'));
const DocumentationKit = lazy(() => import('../pages/DocumentationKit.jsx'));
const FinanceiroContratos = lazy(() => import('../pages/FinanceiroContratos.jsx'));
const LocalizacaoEbaps = lazy(() => import('../pages/LocalizacaoEbaps.jsx'));
const Login = lazy(() => import('../pages/Login.jsx'));
const Manutencao = lazy(() => import('../pages/Manutencao.jsx'));
const ModelosRelatorioAdmin = lazy(() => import('../pages/ModelosRelatorioAdmin.jsx'));
const MeuPerfil = lazy(() => import('../pages/MeuPerfil.jsx'));
const Notificacoes = lazy(() => import('../pages/Notificacoes.jsx'));
const OrdensServico = lazy(() => import('../pages/OrdensServico.jsx'));
const Orientacoes = lazy(() => import('../pages/Orientacoes.jsx'));
const OsDiaria = lazy(() => import('../pages/OsDiaria.jsx'));
const RelatorioDiario = lazy(() => import('../pages/RelatorioDiario.jsx'));
const SST = lazy(() => import('../pages/SST.jsx'));
const SalaSituacao = lazy(() => import('../pages/SalaSituacao.jsx'));
const SalaSituacaoTV = lazy(() => import('../pages/SalaSituacaoTV.jsx'));
const Supervisao = lazy(() => import('../pages/Supervisao.jsx'));
const Unauthorized = lazy(() => import('../pages/Unauthorized.jsx'));
const Usuarios = lazy(() => import('../pages/Usuarios.jsx'));

const placeholders = [
  {
    path: '/localizacao-ebaps',
    permission: 'localizacaoEbaps',
    title: 'Localização EBAPs',
    description: 'Consulta de localização e links de mapa das unidades EBAP.'
  },
  {
    path: '/cco-relatorios-diarios',
    permission: 'ccoRelatoriosDiarios',
    title: 'CCO - Relatórios dos Operadores - RDO',
    description: 'Fila de validação dos Relatórios Diários Operacionais pelo CCO.'
  },
  {
    path: '/cco-analise-os',
    permission: 'ccoAnaliseOS',
    title: 'CCO - OS Geradas pela Operação',
    description: 'Validação das OS criadas pela operação antes de seguirem para manutenção.'
  },
  {
    path: '/manutencao',
    permission: 'manutencao',
    title: 'Manutenção',
    description: 'Programação, fila de OS e Sala de Situação das EBAPs.'
  },
  {
    path: '/sala-situacao-ebaps',
    permission: 'salaSituacaoEbaps',
    title: 'Sala de Situação das EBAPs',
    description: 'OS aprovadas pelo CCO aguardando tratamento do Supervisor.'
  },
  {
    path: '/os-diaria',
    permission: 'osDiaria',
    title: 'OS Diárias',
    description: 'Ordens de serviço do dia para execução técnica.'
  },
  {
    path: '/arquivo-relatorios',
    permission: 'arquivoRelatorios',
    title: 'Arquivo PDF e Rastreabilidade',
    description: 'Consulta de PDFs, códigos, hashes e histórico documental.'
  },
  {
    path: '/acervo-operador',
    permission: 'acervoOperador',
    title: 'Acervo do Operador',
    description: 'Consulta rastreável de RDO e OS criadas por operadores.'
  },
  {
    path: '/relatorios',
    permission: 'relatorios',
    title: 'Relatórios',
    description: 'Consolidados, filtros, impressões e exportações futuras.'
  },
  {
    path: '/almoxarifado',
    permission: 'almoxarifado',
    title: 'Almoxarifado',
    description: 'Materiais, ferramentas, EPI/EPC e rastreabilidade.'
  },
  {
    path: '/compras',
    permission: 'compras',
    title: 'Compras',
    description: 'Solicitações, cotações e aprovações.'
  },
  {
    path: '/financeiro-contrato',
    permission: 'financeiroContrato',
    title: 'Financeiro/Contrato',
    description: 'Contrato, medições, custos, pagamentos e documentos.'
  },
  {
    path: '/sst',
    permission: 'sst',
    title: 'SST',
    description: 'Segurança do Trabalho, EPI/EPC, APR/APT, cursos e inspeções.'
  },
  {
    path: '/administrativo',
    permission: 'administrativo',
    title: 'Administrativo',
    description: 'Demandas, contratos, DP/RH, documentos e fornecedores.'
  },
  {
    path: '/orientacoes',
    permission: 'orientacoes',
    title: 'Orientações',
    description: 'Procedimentos operacionais e instruções.'
  }
];

function RootRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  return <Navigate to={isAuthenticated ? startRouteByPerfil(user?.perfil) : '/login'} replace />;
}

function startRouteByPerfil(perfil = '') {
  const role = normalizePerfil(perfil);
  if (role === 'operador') return '/relatorio';
  if (role === 'supervisor') return '/agenda-operacional';
  if (role === 'cco') return '/cco-relatorios-diarios';
  if (role === 'tecnico') return '/os';
  return '/dashboard';
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="app-bg grid min-h-screen place-items-center text-sm font-black text-cyan-100">Carregando modulo...</div>}>
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/sala-situacao-tv" element={<SalaSituacaoTV />} />

      <Route element={<ProtectedRoute permission="dashboard" />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="notificacoes" />}>
        <Route element={<AppLayout />}>
          <Route path="/notificacoes" element={<Notificacoes />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="comunicacao" />}>
        <Route element={<AppLayout />}>
          <Route path="/comunicacao" element={<Comunicacao />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="localizacaoEbaps" />}>
        <Route element={<AppLayout />}>
          <Route path="/localizacao-ebaps" element={<LocalizacaoEbaps />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="ativos" />}>
        <Route element={<AppLayout />}>
          <Route path="/ativos" element={<Ativos />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="os" />}>
        <Route element={<AppLayout />}>
          <Route path="/os" element={<OrdensServico />} />
          <Route path="/os/:id" element={<DetalheOS />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="agendaOperacional" />}>
        <Route element={<AppLayout />}>
          <Route path="/agenda-operacional" element={<AgendaOperacional />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="supervisao" />}>
        <Route element={<AppLayout />}>
          <Route path="/supervisao" element={<Supervisao />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="perfil" />}>
        <Route element={<AppLayout />}>
          <Route path="/perfil" element={<MeuPerfil />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="relatorio" />}>
        <Route element={<AppLayout />}>
          <Route path="/relatorio" element={<RelatorioDiario />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="ccoRelatoriosDiarios" />}>
        <Route element={<AppLayout />}>
          <Route path="/cco-relatorios-diarios" element={<CcoRelatoriosDiarios />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="ccoAnaliseOS" />}>
        <Route element={<AppLayout />}>
          <Route path="/cco-analise-os" element={<CcoAnaliseOS />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="salaSituacaoEbaps" />}>
        <Route element={<AppLayout />}>
          <Route path="/sala-situacao-ebaps" element={<SalaSituacao />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="arquivoRelatorios" />}>
        <Route element={<AppLayout />}>
          <Route path="/arquivo-relatorios" element={<ArquivoRelatorios />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="almoxarifado" />}>
        <Route element={<AppLayout />}>
          <Route path="/almoxarifado" element={<Almoxarifado />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="sst" />}>
        <Route element={<AppLayout />}>
          <Route path="/sst" element={<SST />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="manutencao" />}>
        <Route element={<AppLayout />}>
          <Route path="/manutencao" element={<Manutencao />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="compras" />}>
        <Route element={<AppLayout />}>
          <Route path="/compras" element={<Compras />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="financeiroContrato" />}>
        <Route element={<AppLayout />}>
          <Route path="/financeiro-contrato" element={<FinanceiroContratos />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="modelosRelatorio" />}>
        <Route element={<AppLayout />}>
          <Route path="/administrativo/modelos-relatorio" element={<ModelosRelatorioAdmin />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="administrativo" />}>
        <Route element={<AppLayout />}>
          <Route path="/administrativo" element={<Administrativo />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="osDiaria" />}>
        <Route element={<AppLayout />}>
          <Route path="/os-diaria" element={<OsDiaria />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="orientacoes" />}>
        <Route element={<AppLayout />}>
          <Route path="/orientacoes" element={<Orientacoes />} />
        </Route>
      </Route>

      {placeholders.filter((page) => !['/localizacao-ebaps', '/cco-relatorios-diarios', '/cco-analise-os', '/sala-situacao-ebaps', '/arquivo-relatorios', '/almoxarifado', '/sst', '/manutencao', '/compras', '/financeiro-contrato', '/administrativo', '/os-diaria', '/orientacoes'].includes(page.path)).map((page) => (
        <Route key={page.path} element={<ProtectedRoute permission={page.permission} />}>
          <Route element={<AppLayout />}>
            <Route path={page.path} element={<PlaceholderPage title={page.title} description={page.description} />} />
          </Route>
        </Route>
      ))}

      <Route element={<ProtectedRoute permission="config" />}>
        <Route element={<AppLayout />}>
          <Route path="/config" element={<Config />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="uiKit" />}>
        <Route element={<AppLayout />}>
          <Route path="/config/ui-kit" element={<UiKit />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="documentationKit" />}>
        <Route element={<AppLayout />}>
          <Route path="/config/documentation-kit" element={<DocumentationKit />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="usuarios" />}>
        <Route element={<AppLayout />}>
          <Route path="/usuarios" element={<Usuarios />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
