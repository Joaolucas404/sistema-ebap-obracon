import RelatorioChecklistSection from './RelatorioChecklistSection.jsx';

export default function RelatorioBombas(props) {
  return (
    <RelatorioChecklistSection
      title="Bombas"
      description="Condicao operacional das bombas, cabos, alarmes e necessidade de OS."
      quantityLabel="Quantidade de bombas"
      itemPrefix="Bomba"
      {...props}
    />
  );
}
