import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx';
import { useAuthStore } from '../store/authStore.js';
import ArquivoRelatorios from '../pages/ArquivoRelatorios.jsx';
import CcoRelatoriosDiarios from '../pages/CcoRelatoriosDiarios.jsx';
import Config from '../pages/Config.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import DetalheOS from '../pages/DetalheOS.jsx';
import Login from '../pages/Login.jsx';
import OrdensServico from '../pages/OrdensServico.jsx';
import PlaceholderPage from '../pages/PlaceholderPage.jsx';
import RelatorioDiario from '../pages/RelatorioDiario.jsx';
import Unauthorized from '../pages/Unauthorized.jsx';
import Usuarios from '../pages/Usuarios.jsx';

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
    title: 'CCO - Relatórios dos Operadores - RO',
    description: 'Fila de validação dos relatórios diários pelo CCO.'
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
    description: 'Consulta rastreável de RO e OS criadas por operadores.'
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
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="dashboardOS" />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard-os" element={<OrdensServico />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute permission="os" />}>
        <Route element={<AppLayout />}>
          <Route path="/os" element={<OrdensServico />} />
          <Route path="/os/:id" element={<DetalheOS />} />
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

      <Route element={<ProtectedRoute permission="arquivoRelatorios" />}>
        <Route element={<AppLayout />}>
          <Route path="/arquivo-relatorios" element={<ArquivoRelatorios />} />
        </Route>
      </Route>

      {placeholders.filter((page) => !['/cco-relatorios-diarios', '/arquivo-relatorios'].includes(page.path)).map((page) => (
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

      <Route element={<ProtectedRoute permission="usuarios" />}>
        <Route element={<AppLayout />}>
          <Route path="/usuarios" element={<Usuarios />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
