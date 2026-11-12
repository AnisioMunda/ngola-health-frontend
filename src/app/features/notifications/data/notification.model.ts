export type NotificationType =
  'LAB_RESULTS_READY' | 'LAB_ABNORMAL_RESULT' | 'LAB_RESULT_AMENDED' | 'STOCK_ALERTS' | 'SYSTEM';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface AppNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  /** Rota interna do frontend (começa por "/"). */
  link: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface UnreadCount {
  count: number;
}

export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

/** Classe do distintivo de prioridade (só as que merecem destaque). */
export function priorityBadge(p: NotificationPriority): string | null {
  return p === 'CRITICAL' ? 'badge-danger' : p === 'HIGH' ? 'badge-warning' : null;
}

/** Só segue rotas internas: nunca URLs externos nem "//host". */
export function safeLink(link: string | null): string | null {
  return link && link.startsWith('/') && !link.startsWith('//') ? link : null;
}
