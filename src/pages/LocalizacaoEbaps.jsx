import { useEffect, useMemo, useState } from 'react';
import { MapPinned, RefreshCcw } from 'lucide-react';
import EbapModal from '../components/localizacao/EbapModal.jsx';
import EbapsMap from '../components/localizacao/EbapsMap.jsx';
import EbapsSidePanel from '../components/localizacao/EbapsSidePanel.jsx';
import LocalizacaoDashboard from '../components/localizacao/LocalizacaoDashboard.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useLocalizacaoEbapsStore } from '../store/localizacaoEbapsStore.js';

export default function LocalizacaoEbaps() {
  const {
    ebaps,
    dashboard,
    filters,
    loading,
    error,
    setFilters,
    carregar,
    getFilteredEbaps
  } = useLocalizacaoEbapsStore();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filteredEbaps = useMemo(() => getFilteredEbaps(), [ebaps, filters, getFilteredEbaps]);

  return (
    <div className="grid gap-4">
      <PageHeader
        title="Localizacao EBAPs"
        description="Mapa operacional das EBAPs com status, OS abertas, RDO pendentes e manutencoes preventivas."
        leading={<span className="grid size-12 place-items-center rounded-2xl bg-navy-950/60 text-cyan-100"><MapPinned size={24} /></span>}
        actions={
          <button className="secondary-button" type="button" onClick={carregar} disabled={loading}>
            <RefreshCcw size={17} />
            Atualizar
          </button>
        }
      />

      {error && <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-4 text-sm font-bold text-red-100">{error}</div>}

      <LocalizacaoDashboard dashboard={dashboard} />

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <EbapsSidePanel ebaps={filteredEbaps} filters={filters} onFilterChange={setFilters} onSelect={setSelected} />
        {loading ? (
          <div className="glass-card rounded-3xl p-8 text-center text-slate-300">Carregando mapa operacional...</div>
        ) : (
          <EbapsMap ebaps={filteredEbaps} onSelect={setSelected} />
        )}
      </div>

      <Modal open={Boolean(selected)} title="Detalhes da EBAP" onClose={() => setSelected(null)}>
        <EbapModal ebap={selected} onClose={() => setSelected(null)} />
      </Modal>
    </div>
  );
}
