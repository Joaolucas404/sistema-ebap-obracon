import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader.jsx';

export default function Unauthorized() {
  return (
    <div className="app-bg">
      <div className="content-layer grid place-items-center">
        <div className="w-full max-w-2xl">
          <PageHeader
            title="Acesso não autorizado"
            description="Seu perfil não possui permissão para acessar esta área do sistema."
            actions={
              <Link className="primary-button" to="/dashboard">
                Voltar ao Dashboard
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}
