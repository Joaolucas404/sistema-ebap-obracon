import StatusBadge from '../ui/StatusBadge.jsx';
import { ccoStatusLabel, ccoStatusTone } from '../../services/ccoService.js';

export default function CcoStatusBadge({ status }) {
  return <StatusBadge tone={ccoStatusTone(status)}>{ccoStatusLabel(status)}</StatusBadge>;
}
