import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Database,
  Download,
  Layers3,
  Palette,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserRound,
  XCircle
} from 'lucide-react';
import Avatar from '../components/ui/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import Card, { CardHeader } from '../components/ui/Card.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import DonutChart from '../components/ui/DonutChart.jsx';
import { Field, Input, Select, Textarea } from '../components/ui/Form.jsx';
import HorizontalBarChart from '../components/ui/HorizontalBarChart.jsx';
import KpiCard from '../components/ui/KpiCard.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import Toast from '../components/ui/Toast.jsx';

const colorTokens = [
  { name: 'Background', className: 'bg-navy-950', value: '#071A45' },
  { name: 'Surface', className: 'bg-navy-900', value: '#0D255F' },
  { name: 'Hover', className: 'bg-navy-800', value: '#12377F' },
  { name: 'Primary', className: 'bg-blue-600', value: '#2D63FF' },
  { name: 'Secondary', className: 'bg-sky-400', value: '#59A5FF' },
  { name: 'Warning', className: 'bg-amber-400', value: '#F7B955' },
  { name: 'Critical', className: 'bg-red-400', value: '#F15B5B' },
  { name: 'Maintenance', className: 'bg-indigo-500', value: '#6366F1' }
];

const tableColumns = [
  { key: 'componente', label: 'Componente' },
  { key: 'uso', label: 'Uso' },
  { key: 'estado', label: 'Estado', render: (row) => <StatusBadge tone={row.tone}>{row.estado}</StatusBadge> }
];

const tableRows = [
  { id: 1, componente: 'Button', uso: 'Ações principais e secundárias', estado: 'Oficial', tone: 'blue' },
  { id: 2, componente: 'Card', uso: 'Containers principais por seção', estado: 'Oficial', tone: 'blue' },
  { id: 3, componente: 'Modal', uso: 'Fluxos de confirmação e edição', estado: 'Evoluído', tone: 'indigo' }
];

const chartRows = [
  { value: 'em_execucao', name: 'Em execucao', total: 6 },
  { value: 'aguardando_supervisor', name: 'Aguardando Supervisor', total: 3 },
  { value: 'pendente_cco', name: 'Pendente CCO', total: 2 },
  { value: 'encaminhada_tecnicos', name: 'Encaminhada Tecnicos', total: 2 },
  { value: 'solicitada', name: 'Solicitada', total: 1 },
  { value: 'concluida', name: 'Concluida', total: 18 }
];

const donutRows = [
  { value: 'solicitada', name: 'Solicitada', total: 4 },
  { value: 'em_execucao', name: 'Em execucao', total: 7 },
  { value: 'concluida', name: 'Concluida', total: 12 }
];

export default function UiKit() {
  const [activeTab, setActiveTab] = useState('componentes');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  return (
    <div className="grid gap-6">
      <PageHeader
        title="SIGEBAP UI Kit"
        description="Vitrine interna dos componentes oficiais. Toda alteração visual deve ser validada aqui antes de chegar às telas operacionais."
        leading={<Palette className="text-blue-100" size={26} />}
        actions={
          <>
            <Button icon={RefreshCcw} variant="secondary" onClick={() => setToast('UI Kit atualizado para validação visual.')}>
              Validar estados
            </Button>
            <Button icon={Plus} variant="primary" onClick={() => setModalOpen(true)}>
              Abrir modal
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader title="Fundação visual" description="Tokens de cor, tipografia, espaçamento, borda, sombra e movimento serão a fonte de verdade da plataforma." />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {colorTokens.map((token) => (
            <article key={token.name} className="rounded-2xl border border-blue-200/12 bg-[#071A45]/55 p-3">
              <span className={['block h-16 rounded-xl border border-white/10', token.className].join(' ')} />
              <strong className="mt-3 block text-sm text-white">{token.name}</strong>
              <small className="text-xs font-bold text-slate-400">{token.value}</small>
            </article>
          ))}
        </div>
      </Card>

      <Card>
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          items={[
            { value: 'componentes', label: 'Componentes', icon: Layers3 },
            { value: 'formularios', label: 'Formulários', icon: ClipboardList },
            { value: 'dados', label: 'Dados', icon: Database }
          ]}
        />

        {activeTab === 'componentes' && (
          <div className="mt-5 grid gap-5">
            <section className="grid gap-3">
              <h3 className="text-xl font-black text-white">Botões</h3>
              <div className="flex flex-wrap gap-3">
                <Button icon={Plus} variant="primary">Primary</Button>
                <Button icon={Download} variant="secondary">Secondary</Button>
                <Button icon={Search} variant="outline">Outline</Button>
                <Button icon={Clock3} variant="ghost">Ghost</Button>
                <Button icon={XCircle} variant="danger">Danger</Button>
                <Button loading variant="primary">Loading</Button>
                <Button disabled variant="secondary">Disabled</Button>
              </div>
            </section>

            <section className="grid gap-3">
              <h3 className="text-xl font-black text-white">Badges e avatares</h3>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone="blue">Operando</StatusBadge>
                <StatusBadge tone="orange">Atenção</StatusBadge>
                <StatusBadge tone="red">Crítico</StatusBadge>
                <StatusBadge tone="indigo">Manutenção</StatusBadge>
                <StatusBadge tone="slate">Inativo</StatusBadge>
                <Avatar name="João Lucas" />
                <Avatar name="Alex Martins" size="lg" />
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-3">
              <KpiCard icon={ClipboardList} label="OS abertas" value="8" helper="2 hoje" tone="blue" />
              <KpiCard icon={AlertTriangle} label="EBAPs críticas" value="5" helper="Sem alteração" tone="red" />
              <KpiCard icon={ShieldCheck} label="Concluídas hoje" value="0" helper="Sem alteração" tone="indigo" />
            </section>
          </div>
        )}

        {activeTab === 'formularios' && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Pesquisa" hint="Altura padrão de 44px e foco azul.">
              <Input placeholder="Buscar OS, RDO, compras..." />
            </Field>
            <Field label="Status">
              <Select defaultValue="operando">
                <option value="operando">Operando</option>
                <option value="atencao">Atenção</option>
                <option value="parado">Parado</option>
                <option value="manutencao">Em manutenção</option>
              </Select>
            </Field>
            <Field label="Campo com erro" error="Informe uma descrição com pelo menos 10 caracteres.">
              <Input invalid placeholder="Descrição obrigatória" />
            </Field>
            <Field label="Observação" className="md:col-span-2">
              <Textarea placeholder="Descreva a condição operacional observada..." />
            </Field>
          </div>
        )}

        {activeTab === 'dados' && (
          <div className="mt-5 grid gap-5">
            <DataTable columns={tableColumns} rows={tableRows} />
            <Card variant="subtle">
              <CardHeader title="Visualizacoes oficiais" description="Barras horizontais para 6 a 15 categorias. Donut para proporcoes. Textos nunca devem ser cortados." />
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <Card variant="subtle">
                  <CardHeader title="Distribuicao das Ordens de Servico" description="Padrao executivo para status." />
                  <div className="mt-5">
                    <HorizontalBarChart data={chartRows} />
                  </div>
                </Card>
                <Card variant="subtle">
                  <CardHeader title="Proporcao operacional" description="Padrao para distribuicoes percentuais." />
                  <div className="mt-5">
                    <DonutChart data={donutRows} />
                  </div>
                </Card>
              </div>
            </Card>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Tipografia" description="Hierarquia oficial para páginas, seções, cards, subtítulos, descrições e labels." />
        <div className="mt-5 grid gap-3">
          <h1 className="text-page-title text-white">H1 - Titulo principal 40 / 700</h1>
          <h2 className="text-section-title text-white">H2 - Titulo de secao 30 / 600</h2>
          <h3 className="text-2xl font-semibold text-white">H3 - Subsecao 24 / 600</h3>
          <h3 className="text-card-title text-white">Titulo de card 20 / 600</h3>
          <p className="text-body-primary text-slate-200">Texto principal 16 / 400 para leitura operacional.</p>
          <p className="text-body-secondary text-slate-300">Texto secundario 14 / 400 para descricoes e apoio.</p>
          <span className="text-caption uppercase tracking-[0.08em] text-slate-400">Legenda 13 / 400</span>
          <span className="ds-badge inline-flex w-fit rounded-full border border-blue-300/35 bg-blue-500/15 px-3 py-1 text-[13px] text-blue-100">Badge 13 / 600</span>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title="Modal oficial"
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button icon={CheckCircle2} variant="primary" onClick={() => setModalOpen(false)}>Confirmar</Button>
          </div>
        }
      >
        <p className="text-sm font-semibold leading-6 text-slate-300">
          Este é o padrão oficial para modais: cabeçalho fixo, conteúdo com rolagem e rodapé opcional.
        </p>
      </Modal>

      <Toast message={toast} tone="blue" onClose={() => setToast('')} />
    </div>
  );
}
