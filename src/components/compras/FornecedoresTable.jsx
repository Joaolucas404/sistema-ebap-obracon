import { Edit3, Truck } from 'lucide-react';

export default function FornecedoresTable({ fornecedores, canManage, onEdit }) {
  if (!fornecedores.length) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <Truck className="mx-auto text-cyan-200" size={36} />
        <h3 className="mt-3 text-xl font-black text-white">Nenhum fornecedor cadastrado</h3>
        <p className="text-sm text-slate-300">Cadastre fornecedores para cotacao e compras.</p>
      </div>
    );
  }

  return (
    <section className="glass-card overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead className="bg-navy-950/45 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Fornecedor</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Cidade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-300/10">
            {fornecedores.map((fornecedor) => (
              <tr key={fornecedor.id} className="hover:bg-cyan-300/5">
                <td className="px-4 py-4">
                  <div className="font-black text-white">{fornecedor.nome}</div>
                  <div className="text-sm text-slate-300">{fornecedor.razao_social || '-'}</div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-200">{fornecedor.documento || '-'}</td>
                <td className="px-4 py-4 text-sm text-slate-200">
                  <div>{fornecedor.contato || '-'}</div>
                  <div className="text-slate-400">{fornecedor.email || fornecedor.telefone || '-'}</div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-200">{[fornecedor.cidade, fornecedor.uf].filter(Boolean).join(' / ') || '-'}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${fornecedor.ativo ? 'border-green-300/35 bg-green-500/15 text-green-100' : 'border-orange-300/35 bg-orange-500/15 text-orange-100'}`}>
                    {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  {canManage && (
                    <button className="secondary-button min-h-10 px-3" type="button" onClick={() => onEdit(fornecedor)}>
                      <Edit3 size={16} />
                      Editar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
