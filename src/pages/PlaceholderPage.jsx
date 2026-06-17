import PageHeader from '../components/ui/PageHeader.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="grid gap-4">
      <PageHeader title={title} description={description} />
      <EmptyState
        title="Módulo reservado para fase futura"
        description="A rota, permissão e navegação já estão prontas. A implementação funcional será feita nas próximas fases da migração."
      />
    </div>
  );
}
