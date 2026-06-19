import RelatorioChecklistSection from './RelatorioChecklistSection.jsx';

export default function RelatorioRastelos(props) {
  return (
    <RelatorioChecklistSection
      title="Rastelos"
      description="Inspecao dos rastelos, grades mecanizadas e obstrucoes."
      quantityLabel="Quantidade de rastelos"
      itemPrefix="Rastelo"
      {...props}
    />
  );
}
