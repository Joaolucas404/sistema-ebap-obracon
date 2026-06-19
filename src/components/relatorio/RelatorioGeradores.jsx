import RelatorioChecklistSection from './RelatorioChecklistSection.jsx';

export default function RelatorioGeradores(props) {
  return (
    <RelatorioChecklistSection
      title="Geradores"
      description="Condicao dos geradores, diesel, autonomia e alarmes."
      quantityLabel="Quantidade de geradores"
      itemPrefix="Gerador"
      {...props}
    />
  );
}
