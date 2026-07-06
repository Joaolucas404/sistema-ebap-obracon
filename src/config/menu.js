import {
  Activity,
  BellRing,
  Boxes,
  Building2,
  CalendarDays,
  FileCog,
  FileText,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Wrench
} from 'lucide-react';

export const MENU_GROUPS = ['OPERAÇÃO', 'INFRAESTRUTURA', 'PLANEJAMENTO', 'GESTÃO', 'COMUNICAÇÃO'];

export const MENU_ITEMS = [
  { key: 'dashboard', group: 'OPERAÇÃO', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, description: 'Visão executiva' },
  { key: 'agendaOperacional', group: 'OPERAÇÃO', label: 'Agenda Operacional', path: '/agenda-operacional', icon: CalendarDays, description: 'Trabalho diário' },
  { key: 'os', group: 'OPERAÇÃO', label: 'Ordens de Serviço', path: '/os', icon: Wrench, description: 'Central de OS' },
  { key: 'relatorio', group: 'OPERAÇÃO', label: 'RDO', path: '/relatorio', icon: FileText, description: 'Relatório diário' },
  { key: 'salaSituacaoEbaps', group: 'OPERAÇÃO', label: 'Sala de Situação', path: '/sala-situacao-ebaps', icon: FileCog, description: 'Visão operacional' },
  { key: 'ccoRelatoriosDiarios', group: 'OPERAÇÃO', label: 'CCO', path: '/cco-relatorios-diarios', icon: ShieldCheck, description: 'Fila de validação' },

  { key: 'ativos', group: 'INFRAESTRUTURA', label: 'Ativos', path: '/ativos', icon: PackageCheck, description: 'Equipamentos' },
  { key: 'localizacaoEbaps', group: 'INFRAESTRUTURA', label: 'Mapa Operacional', path: '/localizacao-ebaps', icon: MapPin, description: 'Localização das EBAPs' },

  { key: 'manutencao', group: 'PLANEJAMENTO', label: 'Planejamento de Manutenção', path: '/manutencao', icon: Activity, description: 'Planos e importações' },

  { key: 'compras', group: 'GESTÃO', label: 'Compras', path: '/compras', icon: ShoppingCart, description: 'Solicitações' },
  { key: 'almoxarifado', group: 'GESTÃO', label: 'Almoxarifado', path: '/almoxarifado', icon: Boxes, description: 'Estoque' },
  { key: 'administrativo', group: 'GESTÃO', label: 'Administrativo', path: '/administrativo', icon: Building2, description: 'RH, DP e frota' },

  { key: 'comunicacao', group: 'COMUNICAÇÃO', label: 'Chat Corporativo', path: '/comunicacao', icon: MessageCircle, description: 'Conversas e grupos' },
  { key: 'notificacoes', group: 'COMUNICAÇÃO', label: 'Alertas', path: '/notificacoes', icon: BellRing, description: 'Notificações' }
];
