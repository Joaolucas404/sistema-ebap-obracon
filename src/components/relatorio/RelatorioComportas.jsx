import RelatorioChecklistSection from './RelatorioChecklistSection.jsx';

export default function RelatorioComportas(props) {
  return (
    <RelatorioChecklistSection
      title="Comportas"
      description="Situacao das comportas, atuadores, comandos e vedacoes."
      quantityLabel="Quantidade de comportas"
      itemPrefix="Comporta"
      {...props}
    />
  );
}
